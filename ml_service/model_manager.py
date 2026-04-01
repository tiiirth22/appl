import asyncio
import logging
from typing import Optional
from sentence_transformers import SentenceTransformer
from config import EMBEDDING_MODEL

logger = logging.getLogger(__name__)

class ModelManager:
    """
    Singleton manager for ML models to ensure background initialization
    and shared access across services.
    """
    _instance: Optional['ModelManager'] = None
    _model: Optional[SentenceTransformer] = None
    _loading_task: Optional[asyncio.Task] = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelManager, cls).__new__(cls)
        return cls._instance

    @property
    def status(self) -> str:
        if self._model:
            return "ready"
        if self._loading_task and not self._loading_task.done():
            return "loading"
        return "not_initialized"

    def initialize(self):
        """Start background initialization of the model"""
        if self._model or (self._loading_task and not self._loading_task.done()):
            return
        
        logger.info(f"Starting background initialization for model: {EMBEDDING_MODEL}")
        self._loading_task = asyncio.create_task(self._load_model())

    async def _load_model(self):
        """Internal method to load the model in a thread"""
        try:
            # Use asyncio.to_thread to avoid blocking the event loop during heavy IO/Model loading
            self._model = await asyncio.to_thread(
                SentenceTransformer, EMBEDDING_MODEL
            )
            self._initialized = True
            logger.info(f"Model {EMBEDDING_MODEL} loaded successfully and ready.")
        except Exception as e:
            logger.error(f"Failed to load model {EMBEDDING_MODEL}: {str(e)}", exc_info=True)
            self._loading_task = None
            raise

    async def get_model(self) -> SentenceTransformer:
        """
        Get the model instance. Waits for loading if it's already in progress.
        If not initialized, starts loading and waits.
        """
        if self._model:
            return self._model
        
        if not self._loading_task or self._loading_task.done():
            self.initialize()
            
        if self._loading_task:
            logger.info("Waiting for model initialization to complete...")
            await self._loading_task
            
        if self._model:
            return self._model
            
        raise RuntimeError("Model manager failed to provide a valid model instance.")

# Global singleton instance
model_manager = ModelManager()
