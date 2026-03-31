import os
import logging
from typing import List, Dict, Any
import httpx
import importlib
import base64
try:
    from groq import Groq
    groq_available = True
except ImportError:
    groq_available = False

# Optional import for sentence transformers
SentenceTransformer = None
sentence_transformers_available = False
try:
    sentence_transformers = importlib.import_module('sentence_transformers')
    SentenceTransformer = sentence_transformers.SentenceTransformer
    sentence_transformers_available = True
except ImportError as e:
    print(f"Warning: sentence_transformers not available: {e}")

# Pinecone imports
Index = None
pinecone_available = False
try:
    import pinecone
    from pinecone import Index
    pinecone_available = True
except ImportError:
    pass

logger = logging.getLogger(__name__)

class RAGEngine:
    """RAG engine for question answering."""
    
    def __init__(self, pinecone_index: Index = None):
        self.index = pinecone_index
        
        # Initialize embedding model if available
        if sentence_transformers_available and SentenceTransformer:
            self.embedding_model = SentenceTransformer(
                os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
            )
        else:
            self.embedding_model = None
            logger.warning("Embedding model not available - RAG functionality will be limited")
        
        self.ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.ollama_model = os.getenv("OLLAMA_MODEL", "llama3.1")

        # Initialize Groq client if available and API key is present
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.groq_model = os.getenv("GROQ_MODEL", "llama3-70b-8192")
        self.groq_client = None
        
        if groq_available and self.groq_api_key:
            try:
                self.groq_client = Groq(api_key=self.groq_api_key)
                print(f"[RAG] Groq client initialized OK. Model: {self.groq_model}")
                logger.info(f"Initialized Groq client with model: {self.groq_model}")
            except Exception as e:
                print(f"[RAG] Groq client FAILED to initialize: {e}")
                logger.error(f"Failed to initialize Groq client: {e}")
        else:
            print(f"[RAG] Groq NOT initialized. groq_available={groq_available}, api_key_present={bool(self.groq_api_key)}")

    
    def retrieve_relevant_chunks(self, query: str, manual_id: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Retrieve relevant chunks from Pinecone."""
        if self.index is None:
            logger.warning("Pinecone index not available - skipping semantic search")
            return []
            
        if self.embedding_model is None:
            logger.warning("Embedding model not available - cannot retrieve relevant chunks from Pinecone")
            return []
        
        try:
            # Generate query embedding
            query_embedding = self.embedding_model.encode(query).tolist()
            
            # Search in Pinecone with manual_id filter
            search_results = self.index.query(
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True,
                filter={
                    "manual_id": {"$eq": manual_id}
                }
            )
            
            # Format results
            chunks = []
            for match in search_results['matches']:
                if match.score > 0.3:  # Threshold
                    chunks.append({
                        "content": match.metadata.get("content", ""),
                        "score": match.score,
                        "chunk_index": int(match.metadata.get("chunk_index", 0)),
                        "page_number": int(match.metadata.get("page_number", 0))
                    })
            
            return chunks
            
        except Exception as e:
            logger.error(f"Error retrieving chunks: {e}")
            return []

    async def retrieve_keyword_chunks(self, query: str, manual_id: str, db, top_k: int = 3) -> List[Dict[str, Any]]:
        """Retrieve chunks from MongoDB using text search (Page Index)."""
        if db is None:
            return []
        
        try:
            # MongoDB text search
            cursor = db.manual_chunks.find(
                {
                    "manual_id": manual_id,
                    "$text": {"$search": query}
                },
                {"score": {"$meta": "textScore"}}
            ).sort([("score", {"$meta": "textScore"})]).limit(top_k)
            
            chunks = []
            async for doc in cursor:
                chunks.append({
                    "content": doc["content"],
                    "score": doc["score"] / 10.0,  # Normalize score roughly
                    "chunk_index": doc["chunk_index"],
                    "page_number": doc.get("page_number", 0),
                    "source": "keyword"
                })
            return chunks
        except Exception as e:
            logger.error(f"Error in keyword search: {e}")
            return []
    
    async def log_rag_trace(self, db, trace_data: Dict[str, Any]):
        """Store RAG observability data in MongoDB."""
        if db is None: return
        try:
            trace_data["timestamp"] = datetime.now(timezone.utc).isoformat()
            await db.rag_traces.insert_one(trace_data)
        except Exception as e:
            logger.error(f"Error logging RAG trace: {e}")

    async def generate_answer(self, question: str, context_chunks: List[Dict[str, Any]]) -> Any:
        """Generate answer using Groq (streaming) or Ollama."""
        is_local = "localhost" in self.ollama_base_url or "127.0.0.1" in self.ollama_base_url
        try:
            # Prepare context from chunks with page numbers
            context = "\n\n".join([
                f"[Page {chunk.get('page_number', '?')}] {chunk['content']}"
                for chunk in context_chunks
            ])
            
            system_prompt = """You are an expert assistant answering questions about appliance manuals. Answer ONLY using the provided context.

IMPORTANT:
1. Answer questions exclusively using the retrieved context.
2. If unsure, say "I don't have sufficient information in this manual".
3. Always cite page numbers (e.g., "Page 3 notes that...").
4. Provide structured, clear advice."""

            # User prompt with data
            user_msg_content = f"""RETRIEVED CONTEXT:
{context}

QUESTION: {question}"""

            if not self.groq_client:
                # Try fallback to Ollama, but check if base_url is likely reachable (not localhost in prod)
                if is_local and os.getenv("K_SERVICE"): # K_SERVICE is set in Cloud Run
                    yield "System Error: Remote AI services (Groq) are not configured, and local AI (Ollama) is not available in the cloud environment. Please contact the administrator to set GROQ_API_KEY."
                    return

            if self.groq_client:
                try:
                    stream = self.groq_client.chat.completions.create(
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": f"RETRIEVED CONTEXT:\n{context}\n\nQUESTION: {question}"}
                        ],
                        model=self.groq_model,
                        temperature=0.0,
                        stream=True,
                    )
                    for chunk in stream:
                        if chunk.choices and chunk.choices[0].delta.content:
                            yield chunk.choices[0].delta.content
                    return
                except Exception as e:
                    logger.error(f"Groq streaming error: {e}")
                    if not is_local: # If not local, don't even try Ollama
                         yield f"Groq Error: {str(e)}"
                         return
            
            # Fallback to Ollama streaming (only if explicitly configured or local)
            try:
                async with httpx.AsyncClient(timeout=10.0) as client: # Shorter timeout for check
                    async with client.stream(
                        "POST",
                        f"{self.ollama_base_url}/api/generate",
                        json={
                            "model": self.ollama_model,
                            "prompt": f"{system_prompt}\n\nCONTEXT:\n{context}\n\nQUESTION: {question}\n\nANSWER:",
                            "stream": True,
                        }
                    ) as response:
                        if response.status_code != 200:
                            yield f"AI Service Error: Ollama returned {response.status_code}. Please check GROQ_API_KEY for cloud deployment."
                            return
                        async for line in response.aiter_lines():
                            if not line: continue
                            import json
                            try:
                                data = json.loads(line)
                                if "response" in data:
                                    yield data["response"]
                                if data.get("done"): break
                            except: continue
            except Exception as e:
                logger.error(f"Ollama fallback failed: {e}")
                yield "Error: AI services are currently unavailable. (Checked Groq and Ollama)"
        except Exception as e:
            logger.error(f"Error in streaming generate_answer: {e}")
            yield f"Error: {str(e)}"

    async def analyze_image(self, image_bytes: bytes) -> str:
        """Analyze an image using Groq Vision model to identify appliance issues."""
        if not self.groq_client:
            raise RuntimeError("Groq client not available - cannot analyze images")

        try:
            # Encode image to base64
            base64_image = base64.b64encode(image_bytes).decode('utf-8')
            
            # System prompt for vision analysis
            system_prompt = """You are an expert appliance technician. Your job is to analyze images of appliances, parts, or error messages.
            
            1. Identify what is shown in the image (specific part, error code, control panel symbol, etc.).
            2. If it's an error code, transcribe it exactly.
            3. If it's a damaged part, describe the damage and the part name.
            4. Generate a specific search query that would find the solution in a manual.
            
            Output ONLY the description and the search query in this format:
            Description: [What you see]
            Search Query: [The query]"""

            chat_completion = self.groq_client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": system_prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{base64_image}",
                                },
                            },
                        ],
                    }
                ],
                model="llama-3.2-11b-vision-preview",
                temperature=0.0,
                max_tokens=300,
            )
            
            return chat_completion.choices[0].message.content
        except Exception as e:
            logger.error(f"Error analyzing image: {e}")
            raise e
    
    async def answer_question_stream(self, manual_id: str, question: str, db=None) -> Any:
        """Full RAG pipeline with streaming tokens and trace logging."""
        import time
        start_time = time.time()
        
        # 1. Retrieval
        semantic_chunks = []
        if self.index:
            semantic_chunks = self.retrieve_relevant_chunks(question, manual_id, top_k=5)
        
        keyword_chunks = await self.retrieve_keyword_chunks(question, manual_id, db, top_k=5)
        
        # Merge
        seen = set()
        combined = []
        for c in semantic_chunks + keyword_chunks:
            if c["chunk_index"] not in seen:
                combined.append(c)
                seen.add(c["chunk_index"])
        
        retrieval_time = time.time() - start_time
        
        # Log Trace
        sources = [
            {"page": c.get("page_number"), "score": round(c.get("score", 0), 3), "type": c.get("source", "semantic")}
            for c in combined
        ]
        
        # 2. Log Trace with full context for Faithfulness evaluation
        full_context = "\n\n".join([f"[Page {c.get('page_number', '?')}] {c['content']}" for c in combined])
        import json
        
        trace = {
            "manual_id": manual_id,
            "question": question,
            "retrieval_time": retrieval_time,
            "source_count": len(combined),
            "sources": sources,
            "full_context": full_context
        }
        await self.log_rag_trace(db, trace)

        yield f"__METADATA__:{json.dumps({'sources': sources})}\n"
        
        # 3. Stream Answer
        async for token in self.generate_answer(question, combined):
            yield token