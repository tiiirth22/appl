import os
import logging
from typing import List, Dict, Any
import httpx
import importlib

# Optional import for sentence transformers
SentenceTransformer = None
sentence_transformers_available = False
try:
    sentence_transformers = importlib.import_module('sentence_transformers')
    SentenceTransformer = sentence_transformers.SentenceTransformer
    sentence_transformers_available = True
except ImportError as e:
    print(f"Warning: sentence_transformers not available: {e}")

from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue

logger = logging.getLogger(__name__)

class RAGEngine:
    """RAG engine for question answering."""
    
    def __init__(self, qdrant_client: QdrantClient, collection_name: str):
        self.qdrant_client = qdrant_client
        self.collection_name = collection_name
        
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
    
    def retrieve_relevant_chunks(self, query: str, manual_id: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Retrieve relevant chunks from Qdrant."""
        if self.embedding_model is None:
            raise RuntimeError("Embedding model not available - cannot retrieve relevant chunks")
        
        try:
            # Generate query embedding
            query_embedding = self.embedding_model.encode(query).tolist()
            
            # Search in Qdrant with manual_id filter
            search_results = self.qdrant_client.search(
                collection_name=self.collection_name,
                query_vector=query_embedding,
                query_filter=Filter(
                    must=[
                        FieldCondition(
                            key="manual_id",
                            match=MatchValue(value=manual_id)
                        )
                    ]
                ),
                limit=top_k,
                with_payload=True,
                score_threshold=0.3
            )
            
            # Format results
            chunks = []
            for result in search_results:
                chunks.append({
                    "content": result.payload["content"],
                    "score": result.score,
                    "chunk_index": result.payload.get("chunk_index", 0)
                })
            
            return chunks
            
        except Exception as e:
            logger.error(f"Error retrieving chunks: {e}")
            return []
    
    async def generate_answer(self, question: str, context_chunks: List[Dict[str, Any]]) -> str:
        """Generate answer using Llama 3.1 via Ollama."""
        try:
            # Prepare context from chunks
            context = "\n\n".join([
                f"[Chunk {chunk['chunk_index'] + 1}] {chunk['content']}"
                for chunk in context_chunks
            ])
            
            # Construct prompt
            prompt = f"""You are an expert assistant answering questions about appliance manuals. Answer ONLY using the provided context.

IMPORTANT INSTRUCTIONS:
1. Answer questions exclusively using the retrieved context
2. If the context does not contain information to answer the question, state: "I don't have sufficient information in this manual to answer that question."
3. Always cite which section/chunk you're referencing
4. Provide clear, concise, well-structured answers
5. Do not make up information

RETRIEVED CONTEXT:
{context}

QUESTION: {question}

ANSWER:"""
            
            # Call Ollama API
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    f"{self.ollama_base_url}/api/generate",
                    json={
                        "model": self.ollama_model,
                        "prompt": prompt,
                        "stream": False,
                        "options": {
                            "temperature": 0.0,
                            "top_p": 0.95,
                            "num_predict": 1024
                        }
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result.get("response", "Error generating response")
                else:
                    logger.error(f"Ollama API error: {response.status_code}")
                    return "Error: Unable to generate answer at this time."
                    
        except Exception as e:
            logger.error(f"Error generating answer: {e}")
            return f"Error generating answer: {str(e)}"
    
    async def answer_question(self, manual_id: str, question: str) -> Dict[str, Any]:
        """Complete RAG pipeline: retrieve and generate."""
        # Retrieve relevant chunks
        chunks = self.retrieve_relevant_chunks(question, manual_id, top_k=5)
        
        if not chunks:
            return {
                "answer": "I couldn't find relevant information in this manual to answer your question.",
                "sources": [],
                "manual_id": manual_id
            }
        
        # Generate answer
        answer = await self.generate_answer(question, chunks)
        
        # Format sources
        sources = [
            {
                "chunk_index": chunk["chunk_index"],
                "content_preview": chunk["content"][:200] + "...",
                "relevance_score": round(chunk["score"], 3)
            }
            for chunk in chunks
        ]
        
        return {
            "answer": answer,
            "sources": sources,
            "manual_id": manual_id
        }