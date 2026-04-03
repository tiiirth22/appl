"""ML Service Error Handling and Response Models"""
from pydantic import BaseModel, Field
from typing import Optional, Any, List
from enum import Enum
from datetime import datetime, timezone


class ErrorType(str, Enum):
    """Error type classification"""
    INVALID_INPUT = "invalid_input"
    FILE_DOWNLOAD_ERROR = "file_download_error"
    FILE_SIZE_ERROR = "file_size_error"
    UNSUPPORTED_FORMAT = "unsupported_format"
    OCR_ERROR = "ocr_error"
    PDF_PARSE_ERROR = "pdf_parse_error"
    EMBEDDING_ERROR = "embedding_error"
    PINECONE_ERROR = "pinecone_error"
    RAG_ERROR = "rag_error"
    TIMEOUT_ERROR = "timeout_error"
    SERVICE_UNAVAILABLE = "service_unavailable"
    INTERNAL_ERROR = "internal_error"


class ErrorResponse(BaseModel):
    """Structured error response"""
    error: ErrorType
    message: str
    details: Optional[dict] = None
    retryable: bool = False
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    request_id: Optional[str] = None


class ProcessingStatus(str, Enum):
    """Processing status for a manual"""
    PENDING = "pending"
    DOWNLOADING = "downloading"
    EXTRACTING_TEXT = "extracting_text"
    CHUNKING = "chunking"
    GENERATING_EMBEDDINGS = "generating_embeddings"
    INDEXING = "indexing"
    COMPLETED = "completed"
    FAILED = "failed"


class ProcessManualRequest(BaseModel):
    """Request to process a manual"""
    file_url: str
    manual_id: str
    manual_name: str
    version: str
    file_type: str  # "pdf" or "image"


class ProcessManualResponse(BaseModel):
    """Response from manual processing"""
    manual_id: str
    status: ProcessingStatus
    chunks_count: int = 0
    embedding_model: Optional[str] = None
    index_name: Optional[str] = None
    message: Optional[str] = None


class QueryRequest(BaseModel):
    """RAG query request"""
    manual_id: str
    question: str
    top_k: int = Field(default=5, ge=1, le=20)
    history: Optional[List[Dict[str, str]]] = Field(default=None, description="Conversation history as list of role/content dicts")


class QueryResponse(BaseModel):
    """RAG query response"""
    query_id: str
    answer: str
    sources: List[dict] = []
    confidence: Optional[float] = None
    processing_time_ms: float


class HealthCheckResponse(BaseModel):
    """Health check response"""
    status: str  # "healthy" or "unhealthy"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    components: dict = Field(default_factory=dict)
    version: str


class MLServiceException(Exception):
    """Base exception for ML service"""
    def __init__(
        self,
        error_type: ErrorType,
        message: str,
        retryable: bool = False,
        details: Optional[dict] = None,
    ):
        self.error_type = error_type
        self.message = message
        self.retryable = retryable
        self.details = details or {}
        super().__init__(self.message)

    def to_response(self, request_id: Optional[str] = None) -> ErrorResponse:
        """Convert exception to error response"""
        return ErrorResponse(
            error=self.error_type,
            message=self.message,
            details=self.details,
            retryable=self.retryable,
            request_id=request_id,
        )


class FileDownloadError(MLServiceException):
    """Error downloading file"""
    def __init__(self, message: str, retryable: bool = True, details: Optional[dict] = None):
        super().__init__(
            ErrorType.FILE_DOWNLOAD_ERROR, message, retryable, details
        )


class FileSizeError(MLServiceException):
    """File exceeds size limit"""
    def __init__(self, file_size_mb: float, max_size_mb: float):
        super().__init__(
            ErrorType.FILE_SIZE_ERROR,
            f"File size {file_size_mb:.2f}MB exceeds limit {max_size_mb:.2f}MB",
            retryable=False,
            details={"file_size_mb": file_size_mb, "max_size_mb": max_size_mb},
        )


class UnsupportedFormatError(MLServiceException):
    """Unsupported file format"""
    def __init__(self, file_type: str, supported_types: List[str]):
        super().__init__(
            ErrorType.UNSUPPORTED_FORMAT,
            f"File type '{file_type}' not supported. Supported: {', '.join(supported_types)}",
            retryable=False,
            details={"file_type": file_type, "supported_types": supported_types},
        )


class OCRError(MLServiceException):
    """Error during OCR processing"""
    def __init__(self, message: str, retryable: bool = True, details: Optional[dict] = None):
        super().__init__(ErrorType.OCR_ERROR, message, retryable, details)


class EmbeddingError(MLServiceException):
    """Error generating embeddings"""
    def __init__(self, message: str, retryable: bool = True, details: Optional[dict] = None):
        super().__init__(ErrorType.EMBEDDING_ERROR, message, retryable, details)


class PineconeError(MLServiceException):
    """Error with Pinecone operations"""
    def __init__(self, message: str, retryable: bool = True, details: Optional[dict] = None):
        super().__init__(ErrorType.PINECONE_ERROR, message, retryable, details)


class RAGError(MLServiceException):
    """Error during RAG query"""
    def __init__(self, message: str, retryable: bool = True, details: Optional[dict] = None):
        super().__init__(ErrorType.RAG_ERROR, message, retryable, details)


class TimeoutError(MLServiceException):
    """Processing timeout"""
    def __init__(self, step: str, timeout_sec: int):
        super().__init__(
            ErrorType.TIMEOUT_ERROR,
            f"Processing step '{step}' timed out after {timeout_sec}s",
            retryable=True,
            details={"step": step, "timeout_sec": timeout_sec},
        )


class ServiceUnavailableError(MLServiceException):
    """Required service is unavailable"""
    def __init__(self, service_name: str, reason: Optional[str] = None):
        message = f"Service '{service_name}' is unavailable"
        if reason:
            message += f": {reason}"
        super().__init__(
            ErrorType.SERVICE_UNAVAILABLE,
            message,
            retryable=True,
            details={"service_name": service_name, "reason": reason},
        )
