import os
import json
import time
from typing import Any, Dict, Optional
from datetime import datetime, timezone

from gptcache import cache
from gptcache.adapter.api import init_similar_cache
from gptcache.embedding import SentenceTransformer
from gptcache.similarity_evaluation.distance import SearchDistanceEvaluation
from gptcache.manager import get_data_manager
from gptcache.manager.storage.mongodb import MongoDB
from gptcache.manager.vector_data.mongodb import MongoDB as MongoDBVector

from config import EMBEDDING_MODEL
from logger_config import get_processing_logger

logger = get_processing_logger(__name__)

def pre_process(data: Dict[str, Any], **kwargs):
    """
    Incorporate manual_id into the query text for caching.
    This ensures that questions are only semantically matched WITHIN the same manual.
    """
    manual_id = data.get("manual_id", "default")
    question = data.get("question", "")
    # Combine query + manual_id for embedding
    # We use a separator to help the model distinguish
    return f"Manual: {manual_id} | Question: {question}"

class SemanticCache:
    """Semantic Cache manager using GPTCache and MongoDB"""
    
    def __init__(self, threshold: float = 0.92):
        self.threshold = threshold
        self.initialized = False
        self.mongo_url = os.getenv("MONGO_URL")
        self.db_name = os.getenv("DB_NAME", "applianceiq_db")
        self.collection_name = "semantic_cache"
        
    def init_cache(self):
        """Initialize GPTCache with MongoDB backend"""
        if self.initialized:
            return
            
        if not self.mongo_url:
            logger.warning("MONGO_URL not found, semantic cache disabled")
            return

        try:
            logger.info(f"Initializing Semantic Cache (threshold={self.threshold})")
            
            # SentenceTransformer wrapper for GPTCache
            encoder = SentenceTransformer(EMBEDDING_MODEL)
            
            # Data Manager for MongoDB
            data_manager = get_data_manager(
                cache_base=MongoDB(
                    url=self.mongo_url, 
                    db_name=self.db_name, 
                    collection_name=self.collection_name
                ),
                vector_base=MongoDBVector(
                    url=self.mongo_url, 
                    db_name=self.db_name, 
                    collection_name=f"{self.collection_name}_vectors",
                    dimension=384 # MiniLM-L6-v2 dimension
                )
            )
            
            init_similar_cache(
                pre_func=pre_process,
                embedding_handler=encoder,
                data_manager=data_manager,
                evaluation=SearchDistanceEvaluation(),
                similarity_threshold=self.threshold
            )
            
            self.initialized = True
            logger.info("Semantic Cache initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Semantic Cache: {str(e)}", exc_info=True)

    def get(self, manual_id: str, question: str) -> Optional[Dict[str, Any]]:
        """Get cached response for query"""
        if not self.initialized:
            return None
            
        try:
            start_time = time.time()
            # Pass data dict to pre_func
            cached_data = cache.get({"manual_id": manual_id, "question": question})
            
            if cached_data:
                duration_ms = (time.time() - start_time) * 1000
                logger.info(f"Semantic Cache HIT for manual {manual_id}: {question[:50]}... ({duration_ms:.2f}ms)")
                
                if isinstance(cached_data, str):
                    try:
                        return json.loads(cached_data)
                    except:
                        return cached_data
                return cached_data
            return None
        except Exception as e:
            logger.error(f"Error reading from Semantic Cache: {str(e)}")
            return None

    def set(self, manual_id: str, question: str, response: Dict[str, Any]):
        """Store response in cache"""
        if not self.initialized:
            return
            
        if response.get("severity") == "critical":
            logger.info("Skipping cache storage for critical severity response")
            return
            
        try:
            # Pass data dict to pre_func for storage as well
            cache.put({"manual_id": manual_id, "question": question}, json.dumps(response))
            logger.info(f"Stored in Semantic Cache for manual {manual_id}")
        except Exception as e:
            logger.error(f"Error writing to Semantic Cache: {str(e)}")

    def flush_all(self):
        """Flush entire cache"""
        if not self.initialized:
            return
        try:
            cache.clear()
            logger.info("Semantic Cache flushed completely")
        except Exception as e:
            logger.error(f"Error flushing cache: {str(e)}")

semantic_cache = SemanticCache()

semantic_cache = SemanticCache()
