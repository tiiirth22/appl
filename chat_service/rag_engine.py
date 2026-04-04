"""ML Service - RAG Engine for Query Answering"""
import asyncio
import uuid
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone
import time

# Optional imports
try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMER_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMER_AVAILABLE = False

try:
    from pinecone import Pinecone
    PINECONE_AVAILABLE = True
except ImportError:
    PINECONE_AVAILABLE = False

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

from config import (
    EMBEDDING_MODEL, LLM_MODEL, GROQ_API_KEY,
    GROQ_API_KEY_SECONDARY, LLM_MODEL_SECONDARY,
    GROQ_VISION_MODEL, GEMINI_API_KEY,
    PINECONE_API_KEY, PINECONE_INDEX_NAME,
    QUERY_TIMEOUT, EMBEDDING_TIMEOUT, PINECONE_TIMEOUT,
)
from model_manager import model_manager

HARDCODED_COST_MAP = {
    "water_leak": {"diy": "$10–$30", "professional": "$100–$200"},
    "cooling_issue": {"diy": "$50–$100", "professional": "$200–$400"},
    "noise_vibration": {"diy": "$5–$20", "professional": "$80–$150"},
    "door_seal": {"diy": "$20–$60", "professional": "$100–$150"},
    "electrical": {"diy": "Not recommended", "professional": "$150–$350"},
    "unknown": {"diy": "Cost estimate unavailable", "professional": "Cost estimate unavailable"}
}
from errors import (
    EmbeddingError, PineconeError, RAGError, TimeoutError as TimeoutErrorException,
    ServiceUnavailableError, MLServiceException,
)
from logger_config import get_processing_logger

logger = get_processing_logger(__name__)

_global_pinecone_client = None
_global_pinecone_index = None
_global_groq_client = None
_global_groq_client_secondary = None


class RAGQueryEngine:
    """RAG-based query answering engine"""
    
    def __init__(self, manual_id: Optional[str] = None, request_id: Optional[str] = None):
        self.manual_id = manual_id
        self.request_id = request_id
        self.logger = get_processing_logger(__name__, manual_id, request_id)
        
        # Lazy-initialized components
        self._embedding_model = None
        self._pinecone_client = None
        self._pinecone_index = None
        self._groq_client = None
        self._groq_client_secondary = None
    
    async def answer_question(
        self,
        manual_id: str,
        question: str,
        top_k: int = 5,
        history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        """
        Answer question via RAG pipeline:
        1. Embed question
        2. Retrieve relevant chunks from Pinecone
        3. Generate answer via Groq LLM
        
        Returns:
            {
                "query_id": str,
                "answer": str,
                "sources": List[Dict],
                "confidence": float,
                "processing_time_ms": float,
            }
        """
        start_time = time.time()
        query_id = str(uuid.uuid4())
        
        try:
            self.logger.info(f"Processing query: {question[:100]}...")
            
            # Step 1: Embed question
            self.logger.info("Step 1/3: Embedding question")
            question_embedding = await self._embed_text(question)
            
            # Step 2: Retrieve relevant chunks
            self.logger.info("Step 2/3: Retrieving relevant chunks")
            sources, confidence = await self._retrieve_chunks(
                manual_id, question_embedding, top_k
            )
            
            if not sources:
                return {
                    "query_id": query_id,
                    "answer": "No relevant information found in the manual.",
                    "sources": [],
                    "confidence": 0.0,
                    "processing_time_ms": (time.time() - start_time) * 1000,
                }
            
            # Step 3: Generate answer and steps in parallel
            self.logger.info("Step 3/3: Generating answer, steps, and YouTube URL")
            
            # Construct YouTube URL
            video_url = self._construct_youtube_url(question)
            
            # Run LLM calls in parallel
            async def get_secondary_info_safely():
                try:
                    return await self._generate_secondary_info(question, sources)
                except Exception as e:
                    self.logger.error(f"Secondary info generation failed: {str(e)}")
                    return {"steps": [], "severity": None, "cost": None}

            answer_task = self._generate_answer(question, sources, history=history)
            info_task = get_secondary_info_safely()
            
            answer, secondary_info = await asyncio.gather(answer_task, info_task)
            
            processing_time_ms = (time.time() - start_time) * 1000
            self.logger.info(f"Query completed in {processing_time_ms:.2f}ms")
            
            return {
                "query_id": query_id,
                "answer": answer,
                "sources": sources,
                "confidence": confidence,
                "processing_time_ms": processing_time_ms,
                "video_url": video_url,
                "steps": secondary_info.get("steps", []),
                "severity": secondary_info.get("severity", None),
                "cost": secondary_info.get("cost", None),
                "history": history if history else []
            }
            
        except MLServiceException as e:
            self.logger.error(f"Query failed: {e.message}")
            raise
        except Exception as e:
            self.logger.error(f"Unexpected error: {str(e)}", exc_info=True)
            raise RAGError(str(e), retryable=True)
    
    async def _get_embedding_model(self):
        """Lazy load embedding model via ModelManager singleton"""
        try:
            return await model_manager.get_model()
        except Exception as e:
            raise EmbeddingError(
                f"Failed to load embedding model: {str(e)}",
                retryable=True,
            )
    
    async def _embed_text(
        self, text: str, timeout: int = EMBEDDING_TIMEOUT
    ) -> List[float]:
        """Generate embedding for text"""
        try:
            model = await self._get_embedding_model()
            
            embedding = await asyncio.wait_for(
                asyncio.to_thread(
                    lambda: model.encode([text], convert_to_tensor=False)[0].tolist()
                ),
                timeout=timeout,
            )
            
            return embedding
        except asyncio.TimeoutError:
            raise TimeoutErrorException("embedding", timeout)
        except Exception as e:
            raise EmbeddingError(str(e), retryable=True)
    
    async def _get_pinecone_index(self):
        """Lazy load Pinecone client and index as a global pool"""
        global _global_pinecone_client, _global_pinecone_index
        
        if _global_pinecone_index is not None:
            self._pinecone_client = _global_pinecone_client
            self._pinecone_index = _global_pinecone_index
            return _global_pinecone_index
        
        if not PINECONE_AVAILABLE:
            raise ServiceUnavailableError(
                "pinecone",
                "pinecone SDK not installed",
            )
        
        if not PINECONE_API_KEY:
            raise ServiceUnavailableError(
                "pinecone",
                "PINECONE_API_KEY not configured",
            )
        
        try:
            if _global_pinecone_client is None:
                self.logger.info("Initializing global Pinecone client pool")
                _global_pinecone_client = Pinecone(api_key=PINECONE_API_KEY)
            
            self.logger.info(f"Connecting to Pinecone index: {PINECONE_INDEX_NAME}")
            _global_pinecone_index = _global_pinecone_client.Index(PINECONE_INDEX_NAME)
            
            self._pinecone_client = _global_pinecone_client
            self._pinecone_index = _global_pinecone_index
            return _global_pinecone_index
        except Exception as e:
            raise PineconeError(
                f"Failed to initialize Pinecone: {str(e)}",
                retryable=True,
            )
    
    async def _retrieve_chunks(
        self,
        manual_id: str,
        embedding: List[float],
        top_k: int = 5,
        timeout: int = PINECONE_TIMEOUT,
    ) -> Tuple[List[Dict[str, Any]], float]:
        """Retrieve top-k relevant chunks from Pinecone"""
        try:
            index = await self._get_pinecone_index()
            
            # Log dimensions for troubleshooting mismatches
            self.logger.info(f"Querying Pinecone | Dimension: {len(embedding)} | Manual ID: {manual_id}")
            
            # Check dimension of index asynchronously to prevent blocking event loop
            index_desc = await asyncio.to_thread(
                self._pinecone_client.describe_index, PINECONE_INDEX_NAME
            )
            
            if len(embedding) != index_desc.dimension:
                err_msg = f"Embedding dimension mismatch: model is {len(embedding)}, but index is {index_desc.dimension}."
                self.logger.critical(err_msg)
                raise PineconeError(err_msg, retryable=False)

            # Diagnostics: Check index stats
            try:
                stats = await asyncio.to_thread(index.describe_index_stats)
                self.logger.info(f"Pinecone Stats | Total Vectors: {stats.total_vector_count} | Namespaces: {stats.namespaces}")
            except Exception as stats_err:
                self.logger.warning(f"Failed to get index stats: {stats_err}")

            # Query Pinecone with manual_id filter
            start_query = time.time()
            results = await asyncio.wait_for(
                asyncio.to_thread(
                    lambda: index.query(
                        vector=embedding,
                        top_k=top_k,
                        include_metadata=True,
                        filter={"manual_id": {"$eq": manual_id}},
                    )
                ),
                timeout=timeout,
            )
            
            # If 0 matches, try querying without filter to see if matching vectors exist at all
            if not results.get("matches", []):
                self.logger.warning(f"No matches with manual_id filter: {manual_id}. Testing global query...")
                global_results = await asyncio.to_thread(
                    lambda: index.query(
                        vector=embedding,
                        top_k=1,
                        include_metadata=True
                    )
                )
                if global_results.get("matches"):
                    top_match = global_results["matches"][0]
                    match_manual_id = top_match.get("metadata", {}).get("manual_id", "MISSING")
                    self.logger.info(f"Global match found! Top vector manual_id: {match_manual_id}. Current query manual_id: {manual_id}")
                else:
                    self.logger.warning("Global query also returned 0 matches. Index might be empty or embedding mismatch.")

            query_duration = (time.time() - start_query) * 1000
            
            # Extract sources from results
            sources = []
            confidence_scores = []
            
            matches = results.get("matches", [])
            if not matches:
                self.logger.warning(f"Retrieval Miss: 0 matches found for manual_id={manual_id} (took {query_duration:.2f}ms)")
                return [], 0.0
            
            for match in matches:
                metadata = match.get("metadata", {})
                source = {
                    "text": metadata.get("text", ""),
                    "chunk_index": metadata.get("chunk_index", 0),
                    "page": metadata.get("page_number", 0),  # Frontend expects 'page'
                    "score": match.get("score", 0.0),
                }
                sources.append(source)
                confidence_scores.append(match.get("score", 0.0))
            
            # Calculate average confidence
            avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.0
            
            self.logger.info(f"Retrieval Success: Found {len(sources)} chunks | Avg score: {avg_confidence:.4f} | Took: {query_duration:.2f}ms")
            
            return sources, avg_confidence
            
        except asyncio.TimeoutError:
            raise TimeoutErrorException("pinecone_query", timeout)
        except Exception as e:
            raise PineconeError(str(e), retryable=True)
    
    async def _get_groq_client(self):
        """Lazy load Groq client globally"""
        global _global_groq_client
        
        if _global_groq_client is not None:
            self._groq_client = _global_groq_client
            return _global_groq_client
        
        if not GROQ_AVAILABLE:
            raise ServiceUnavailableError(
                "groq",
                "groq SDK not installed",
            )
        
        if not GROQ_API_KEY:
            raise ServiceUnavailableError(
                "groq",
                "GROQ_API_KEY not configured",
            )
        
        try:
            self.logger.info("Initializing global Groq client")
            _global_groq_client = await asyncio.to_thread(
                Groq, api_key=GROQ_API_KEY
            )
            self._groq_client = _global_groq_client
            return _global_groq_client
        except Exception as e:
            raise RAGError(
                f"Failed to initialize Groq: {str(e)}",
                retryable=True,
            )
    
    async def _generate_answer(
        self, 
        question: str, 
        sources: List[Dict[str, Any]], 
        history: Optional[List[Dict[str, str]]] = None,
        timeout: int = QUERY_TIMEOUT
    ) -> str:
        """Generate answer using Groq LLM"""
        try:
            client = await self._get_groq_client()
            
            # Build context from sources
            context = "\n\n".join([
                f"Source {i+1}:\n{s['text']}"
                for i, s in enumerate(sources[:3])  # Use top 3 sources
            ])
            
            # Build prompt
            prompt = f"""Based on the following manual content, answer the question:

MANUAL CONTENT:
{context}

QUESTION: {question}

ANSWER (be concise and direct):"""
            
            # Base system message
            messages = [
                {
                    "role": "system",
                    "content": "You are a helpful assistant answering questions about appliance manuals. Be concise and accurate. Use the provided context to answer the user's question, but acknowledge previous turns in the conversation if they are relevant.",
                }
            ]
            
            # Add history if provided
            if history:
                if len(history) > 6:
                    self.logger.info("History exceeds 6 messages, summarizing older messages")
                    old_history = history[:-6]
                    recent_history = history[-6:]
                    
                    try:
                        # Quick inline summarization without blocking main flow too much
                        client_sec = await self._get_secondary_groq_client() or client
                        summary_prompt = "Summarize the following past conversation concisely regarding appliance repair:\n" + "\n".join([f"{m['role']}: {m['content']}" for m in old_history])
                        sum_resp = await asyncio.wait_for(
                            asyncio.to_thread(
                                lambda: client_sec.chat.completions.create(
                                    model=LLM_MODEL_SECONDARY,
                                    messages=[{"role": "user", "content": summary_prompt}],
                                    temperature=0.1, max_tokens=150
                                )
                            ),
                            timeout=10
                        )
                        summary_text = sum_resp.choices[0].message.content.strip()
                        messages.append({"role": "system", "content": f"Previous conversation summary: {summary_text}"})
                    except Exception as e:
                        self.logger.error(f"Failed to summarize history: {e}")
                    
                    messages.extend(recent_history)
                    self.logger.info(f"Added summary + {len(recent_history)} recent history messages to context")
                else:
                    messages.extend(history)
                    self.logger.info(f"Added {len(history)} history messages to context")
            
            # Add current turns
            messages.append({
                "role": "user",
                "content": prompt,
            })
            
            # Call Groq with timeout
            response = await asyncio.wait_for(
                asyncio.to_thread(
                    lambda: client.chat.completions.create(
                        model=LLM_MODEL,
                        messages=messages,
                        temperature=0.3,
                        max_tokens=600,
                    )
                ),
                timeout=timeout,
            )
            
            answer = response.choices[0].message.content.strip()
            return answer
            
        except asyncio.TimeoutError:
            raise TimeoutErrorException("llm_generation", timeout)
        except Exception as e:
            raise RAGError(
                f"Failed to generate answer: {str(e)}",
                retryable=True,
            )
    async def _get_secondary_groq_client(self):
        """Lazy load secondary Groq client globally"""
        global _global_groq_client_secondary
        
        if _global_groq_client_secondary is not None:
            self._groq_client_secondary = _global_groq_client_secondary
            return _global_groq_client_secondary
        
        if not GROQ_AVAILABLE:
            return None
        
        key = GROQ_API_KEY_SECONDARY or GROQ_API_KEY
        if not key:
            return None
            
        try:
            self.logger.info("Initializing global secondary Groq client")
            _global_groq_client_secondary = await asyncio.to_thread(
                Groq, api_key=key
            )
            self._groq_client_secondary = _global_groq_client_secondary
            return _global_groq_client_secondary
        except Exception as e:
            self.logger.error(f"Failed to initialize secondary Groq: {str(e)}")
            return None

    def _construct_youtube_url(self, question: str) -> str:
        """Construct YouTube search URL from query"""
        import urllib.parse
        clean_query = question.strip()
        # Add keywords for better repair results
        search_terms = f"{clean_query} refrigerator fix"
        encoded_query = urllib.parse.quote_plus(search_terms)
        return f"https://www.youtube.com/results?search_query={encoded_query}"

    async def _generate_secondary_info(
        self, 
        question: str, 
        sources: List[Dict[str, Any]], 
        timeout: int = QUERY_TIMEOUT
    ) -> Dict[str, Any]:
        """Generate structured repair steps, severity, and cost using secondary LLM"""
        try:
            client = await self._get_secondary_groq_client()
            if not client:
                return {}
                
            # Build context from sources
            context = "\n\n".join([
                f"Context Segment {i+1}:\n{s['text']}"
                for i, s in enumerate(sources[:3])
            ])
            
            cost_map_str = str(HARDCODED_COST_MAP)
            
            prompt = f"""You are a home appliance repair assistant.
Given the context from an appliance manual and the user query, return ONLY a valid JSON object.
No explanation, no markdown, no extra text.

Format:
{{
  "steps": [{{ "step": 1, "title": "...", "description": "...", "warning": "..." }}],
  "severity": "minor" | "moderate" | "critical",
  "cost": {{ "diy": "$10–$20", "professional": "$80–$150" }}
}}

Classify the issue's cost using this map based on the issue type:
{cost_map_str}
If no exact match, return "cost": {{"diy": "Cost estimate unavailable", "professional": "Cost estimate unavailable"}}.

Context: {context}
Query: {question}"""

            # Call Groq secondary model
            response = await asyncio.wait_for(
                asyncio.to_thread(
                    lambda: client.chat.completions.create(
                        model=LLM_MODEL_SECONDARY,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.1,
                        max_tokens=800,
                    )
                ),
                timeout=timeout,
            )
            
            content = response.choices[0].message.content.strip()
            
            # Basic cleanup of markdown if LLM includes it
            if content.startswith("```json"):
                content = content.split("```json")[1].split("```")[0].strip()
            elif content.startswith("```"):
                content = content.split("```")[1].split("```")[0].strip()
                
            import json
            try:
                info = json.loads(content)
                if isinstance(info, dict):
                    return info
                return {}
            except json.JSONDecodeError:
                self.logger.error(f"Failed to parse secondary info JSON: {content[:100]}")
                return {}
                
        except Exception as e:
            self.logger.error(f"Error generating secondary info: {str(e)}")
            return {}

    async def analyze_image(
        self,
        image_b64: str,
        manual_id: str,
        history: List[Dict[str, str]] = None,
        top_k: int = 5,
    ) -> Dict[str, Any]:
        """Analyze an image using Vision LLM and then query RAG"""
        try:
            start_time = time.time()
            client = await self._get_groq_client()
            if not client:
                raise MLServiceException(ErrorType.SERVICE_UNAVAILABLE, "Groq client not available")

            self.logger.info(f"Step 1/2: Analyzing image for manual {manual_id}")
            
            # Call Groq Vision model
            response = await asyncio.wait_for(
                asyncio.to_thread(
                    lambda: client.chat.completions.create(
                        model=GROQ_VISION_MODEL,
                        messages=[{
                            "role": "user",
                            "content": [
                                {"type": "text", "text": "Describe the appliance repair technical problem shown in this image in one concise sentence. Focus on technical keywords (error code, broken part, visible symptom)."},
                                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}}
                            ]
                        }],
                        temperature=0.1,
                        max_tokens=100,
                    )
                ),
                timeout=QUERY_TIMEOUT,
            )
            
            extracted_problem = response.choices[0].message.content.strip()
            self.logger.info(f"Extracted problem: {extracted_problem}")
            
            # Step 2: Query RAG with extracted text
            self.logger.info("Step 2/2: Querying RAG with extracted text")
            rag_response = await self.answer_question(
                manual_id=manual_id,
                question=extracted_problem,
                history=history,
                top_k=top_k
            )
            
            # Incorporate extracted problem into final response
            rag_response["extracted_problem"] = extracted_problem
            rag_response["processing_time_ms"] = (time.time() - start_time) * 1000
            
            return rag_response
            
        except Exception as e:
            self.logger.error(f"Error in vision analysis: {str(e)}")
            raise MLServiceException(
                ErrorType.RAG_ERROR,
                f"Failed to analyze image: {str(e)}",
                retryable=True,
            )

    async def analyze_frame(self, image_b64: str) -> Dict[str, Any]:
        """Analyze live camera frame with Gemini 1.5 Flash"""
        import google.generativeai as genai
        import PIL.Image
        import io
        import base64
        import json
        
        try:
            if not GEMINI_API_KEY:
                raise ServiceUnavailableError("gemini", "GEMINI_API_KEY not configured")
                
            genai.configure(api_key=GEMINI_API_KEY)
            model = genai.GenerativeModel('gemini-1.5-flash')
            
            image_bytes = base64.b64decode(image_b64.split(",")[-1] if "," in image_b64 else image_b64)
            image = PIL.Image.open(io.BytesIO(image_bytes))
            
            prompt = '''You are an appliance and device repair assistant.
Look at this image and identify any visible issue.
Return ONLY JSON, no explanation, no markdown:
{
  "issue": "one line description or null if nothing detected",
  "part": "specific part name",
  "severity": "minor|moderate|critical|none",
  "suggested_query": "how to fix ..."
}'''

            response = await asyncio.to_thread(
                model.generate_content,
                [prompt, image]
            )
            
            content = response.text.strip()
            if content.startswith("```json"):
                content = content.split("```json")[1].split("```")[0].strip()
            elif content.startswith("```"):
                content = content.split("```")[1].split("```")[0].strip()
                
            result = json.loads(content)
            return result
        except Exception as e:
            self.logger.error(f"Gemini frame analysis failed: {str(e)}")
            raise MLServiceException(
                ErrorType.SERVICE_UNAVAILABLE, 
                f"Frame analysis failed: {str(e)}", 
                retryable=True
            )
