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
    PINECONE_API_KEY, PINECONE_INDEX_NAME, PINECONE_NAMESPACE,
    QUERY_TIMEOUT, EMBEDDING_TIMEOUT, PINECONE_TIMEOUT,
)
from model_manager import model_manager
from errors import (
    EmbeddingError, PineconeError, RAGError, TimeoutError as TimeoutErrorException,
    ServiceUnavailableError, MLServiceException,
)
from logger_config import get_processing_logger

logger = get_processing_logger(__name__)


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
    
    async def answer_question(
        self,
        manual_id: str,
        question: str,
        top_k: int = 5,
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
            
            # Step 3: Generate answer
            self.logger.info("Step 3/3: Generating answer")
            answer = await self._generate_answer(question, sources)
            
            processing_time_ms = (time.time() - start_time) * 1000
            self.logger.info(f"Query completed in {processing_time_ms:.2f}ms")
            
            return {
                "query_id": query_id,
                "answer": answer,
                "sources": sources,
                "confidence": confidence,
                "processing_time_ms": processing_time_ms,
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
        """Lazy load Pinecone client and index"""
        if self._pinecone_index is not None:
            return self._pinecone_index
        
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
            if self._pinecone_client is None:
                self.logger.info("Initializing Pinecone client")
                self._pinecone_client = await asyncio.to_thread(
                    Pinecone, api_key=PINECONE_API_KEY
                )
            
            self.logger.info(f"Connecting to Pinecone index: {PINECONE_INDEX_NAME}")
            self._pinecone_index = await asyncio.to_thread(
                self._pinecone_client.Index, PINECONE_INDEX_NAME
            )
            return self._pinecone_index
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
            self.logger.info(f"Querying Pinecone with vector dimension: {len(embedding)} into namespace: '{PINECONE_NAMESPACE}'")
            
            # Check dimension of index
            index_desc = await asyncio.to_thread(self._pinecone_client.describe_index, PINECONE_INDEX_NAME)
            if len(embedding) != index_desc.dimension:
                err_msg = f"Embedding dimension mismatch: model is {len(embedding)}, but index is {index_desc.dimension}. Re-index may be required."
                self.logger.critical(err_msg)
                raise PineconeError(err_msg, retryable=False)

            # Query Pinecone with manual_id filter
            results = await asyncio.wait_for(
                asyncio.to_thread(
                    lambda: index.query(
                        vector=embedding,
                        top_k=top_k,
                        include_metadata=True,
                        namespace=PINECONE_NAMESPACE,
                        filter={"manual_id": {"$eq": manual_id}},
                    )
                ),
                timeout=timeout,
            )
            
            # Check if namespace exists in stats for diagnostic logging
            stats = await asyncio.to_thread(index.describe_index_stats)
            if PINECONE_NAMESPACE not in stats.get("namespaces", {}) and PINECONE_NAMESPACE != "":
                self.logger.error(f"Namespace '{PINECONE_NAMESPACE}' not found in index stats. Results will likely be empty.")
            elif PINECONE_NAMESPACE == "" and "__default__" not in stats.get("namespaces", {}):
                  # In the new Pinecone SDK, the empty namespace might not show up if it's empty
                  pass
            
            # Extract sources from results
            sources = []
            confidence_scores = []
            
            for match in results.get("matches", []):
                source = {
                    "text": match.get("metadata", {}).get("text", ""),
                    "chunk_index": match.get("metadata", {}).get("chunk_index", 0),
                    "score": match.get("score", 0.0),
                }
                sources.append(source)
                confidence_scores.append(match.get("score", 0.0))
            
            # Calculate average confidence
            avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.0
            
            self.logger.info(f"Retrieved {len(sources)} chunks with avg confidence {avg_confidence:.2f}")
            
            return sources, avg_confidence
            
        except asyncio.TimeoutError:
            raise TimeoutErrorException("pinecone_query", timeout)
        except Exception as e:
            raise PineconeError(str(e), retryable=True)
    
    async def _get_groq_client(self):
        """Lazy load Groq client"""
        if self._groq_client is not None:
            return self._groq_client
        
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
            self.logger.info("Initializing Groq client")
            self._groq_client = await asyncio.to_thread(
                Groq, api_key=GROQ_API_KEY
            )
            return self._groq_client
        except Exception as e:
            raise RAGError(
                f"Failed to initialize Groq: {str(e)}",
                retryable=True,
            )
    
    async def _generate_answer(
        self, question: str, sources: List[Dict[str, Any]], timeout: int = QUERY_TIMEOUT
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
            
            # Call Groq with timeout
            response = await asyncio.wait_for(
                asyncio.to_thread(
                    lambda: client.chat.completions.create(
                        model=LLM_MODEL,
                        messages=[
                            {
                                "role": "system",
                                "content": "You are a helpful assistant answering questions about appliance manuals. Be concise and accurate.",
                            },
                            {
                                "role": "user",
                                "content": prompt,
                            },
                        ],
                        temperature=0.3,
                        max_tokens=500,
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
