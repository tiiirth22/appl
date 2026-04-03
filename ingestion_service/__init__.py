"""
ApplianceIQ ML Service Package

Entry point for the ML service with lazy-loaded components and async processing.
"""

from .config import *
from .errors import *
from .logger_config import setup_logging, get_logger, get_processing_logger
from .processor import AsyncDocumentProcessor
from .rag_engine import RAGQueryEngine

__version__ = "1.0.0"
__author__ = "ApplianceIQ Team"

__all__ = [
    # Configuration
    "PINECONE_API_KEY",
    "GROQ_API_KEY",
    "EMBEDDING_MODEL",
    "SERVICE_NAME",
    "SERVICE_VERSION",
    
    # Errors
    "MLServiceException",
    "ErrorType",
    "ErrorResponse",
    "FileDownloadError",
    "FileSizeError",
    "UnsupportedFormatError",
    "OCRError",
    "EmbeddingError",
    "PineconeError",
    "RAGError",
    "ServiceUnavailableError",
    
    # Logging
    "setup_logging",
    "get_logger",
    "get_processing_logger",
    
    # Core components
    "AsyncDocumentProcessor",
    "RAGQueryEngine",
]
