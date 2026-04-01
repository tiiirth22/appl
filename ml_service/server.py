"""ML Service - Main FastAPI Application"""
import asyncio
import uuid
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, Request, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from config import (
    SERVICE_NAME, SERVICE_VERSION, DEBUG, LOG_LEVEL,
    REQUEST_SIZE_LIMIT, RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW_SEC,
)
from errors import MLServiceException, ErrorType, ServiceUnavailableError
from logger_config import setup_logging, get_processing_logger
from processor import AsyncDocumentProcessor
from rag_engine import RAGQueryEngine
from model_manager import model_manager

# Initialize logging
setup_logging(log_level=LOG_LEVEL)
logger = get_processing_logger(__name__)

# Rate limiter (simple in-memory implementation)
class SimpleRateLimiter:
    def __init__(self, requests: int, window_sec: int):
        self.requests = requests
        self.window_sec = window_sec
        self.request_times = {}
    
    async def check_rate_limit(self, key: str) -> bool:
        """Check if request is within rate limit"""
        import time
        now = time.time()
        
        if key not in self.request_times:
            self.request_times[key] = []
        
        # Clean old times
        cutoff = now - self.window_sec
        self.request_times[key] = [t for t in self.request_times[key] if t > cutoff]
        
        if len(self.request_times[key]) >= self.requests:
            return False
        
        self.request_times[key].append(now)
        return True


rate_limiter = SimpleRateLimiter(RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW_SEC)

# Health check state
_service_health = {
    "pinecone": "unknown",
    "embedding_model": "unknown",
    "groq": "unknown",
    "uptime_seconds": 0,
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    logger.info(f"Starting {SERVICE_NAME} v{SERVICE_VERSION}")
    
    # Startup: Initialize model in background immediately
    model_manager.initialize()
    
    yield
    
    # Shutdown
    logger.info("Shutting down ML Service")


# Initialize FastAPI app
app = FastAPI(
    title=SERVICE_NAME,
    version=SERVICE_VERSION,
    lifespan=lifespan,
    docs_url="/docs" if DEBUG else None,
    redoc_url="/redoc" if DEBUG else None,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request ID dependency
async def get_request_id(request: Request) -> str:
    """Get or create request ID"""
    request_id = request.headers.get("X-Request-ID")
    if not request_id:
        request_id = str(uuid.uuid4())
    return request_id


# Rate limit dependency
async def check_rate_limit(request: Request) -> str:
    """Check rate limit based on IP"""
    client_ip = request.client.host if request.client else "unknown"
    
    if not await rate_limiter.check_rate_limit(client_ip):
        logger.warning(f"Rate limit exceeded for {client_ip}")
        raise HTTPException(
            status_code=429,
            detail="Too many requests",
        )
    
    return client_ip


# Exception handler
@app.exception_handler(MLServiceException)
async def ml_service_exception_handler(request: Request, exc: MLServiceException):
    """Handle ML service exceptions"""
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    error_response = exc.to_response(request_id)
    
    status_code = 400
    if exc.error_type == ErrorType.TIMEOUT_ERROR:
        status_code = 504
    elif exc.error_type == ErrorType.SERVICE_UNAVAILABLE:
        status_code = 503
    elif exc.error_type == ErrorType.PINECONE_ERROR:
        status_code = 503 if exc.retryable else 400
    
    return JSONResponse(
        status_code=status_code,
        content=error_response.model_dump(),
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": "http_error", "message": exc.detail},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected exceptions"""
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_error",
            "message": "Internal server error",
            "request_id": request_id,
            "retryable": True,
        },
    )


# ==================== HEALTH CHECK ====================

@app.get("/health")
async def health_check():
    """Health check endpoint - returns immediately"""
    import time
    return {
        "status": "healthy",
        "service": SERVICE_NAME,
        "version": SERVICE_VERSION,
        "model_status": model_manager.status,
        "timestamp": time.time(),
    }


@app.get("/health/detailed")
async def health_check_detailed(request_id: str = Depends(get_request_id)):
    """Detailed health check with component status"""
    logger.info("Detailed health check requested")
    
    health_status = {
        "status": "healthy",
        "components": {},
    }
    
    # Check embedding model availability (doesn't wait for load)
    try:
        health_status["components"]["embedding_model"] = model_manager.status
        if model_manager.status == "not_initialized":
             health_status["status"] = "degraded"
    except Exception as e:
        health_status["components"]["embedding_model"] = f"error: {str(e)}"
        health_status["status"] = "degraded"
    
    # Check Pinecone availability
    try:
        processor = AsyncDocumentProcessor(request_id=request_id)
        index = await processor._get_pinecone_index()
        health_status["components"]["pinecone"] = "ready"
    except Exception as e:
        health_status["components"]["pinecone"] = f"error: {str(e)}"
        health_status["status"] = "degraded"
    
    # Check Groq availability
    try:
        rag_engine = RAGQueryEngine(request_id=request_id)
        client = await rag_engine._get_groq_client()
        health_status["components"]["groq"] = "ready"
    except Exception as e:
        health_status["components"]["groq"] = f"error: {str(e)}"
        health_status["status"] = "degraded"
    
    return health_status


# ==================== PROCESSING ENDPOINTS ====================

@app.post("/process_manual")
async def process_manual(
    request_data: dict,
    request_id: str = Depends(get_request_id),
    client_ip: str = Depends(check_rate_limit),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    """
    Process a manual document
    
    Request body:
    {
        "file_url": str,
        "manual_id": str,
        "manual_name": str,
        "version": str,
        "file_type": str  # "pdf" or "image"
    }
    """
    try:
        logger.info(f"Processing request from {client_ip}", extra={"request_id": request_id})
        
        # Validate request
        required_fields = ["file_url", "manual_id", "manual_name", "version", "file_type"]
        for field in required_fields:
            if field not in request_data:
                raise HTTPException(status_code=400, detail=f"Missing field: {field}")
        
        # Create processor and start processing
        processor = AsyncDocumentProcessor(
            manual_id=request_data["manual_id"],
            request_id=request_id,
        )
        
        result = await processor.process_manual(
            file_url=request_data["file_url"],
            manual_id=request_data["manual_id"],
            manual_name=request_data["manual_name"],
            version=request_data["version"],
            file_type=request_data["file_type"],
        )
        
        logger.info(f"Processing completed: {result['chunks_count']} chunks")
        
        return result
        
    except MLServiceException:
        raise
    except Exception as e:
        logger.error(f"Processing failed: {str(e)}", exc_info=True)
        raise


@app.post("/query")
async def query_manual(
    request_data: dict,
    request_id: str = Depends(get_request_id),
    client_ip: str = Depends(check_rate_limit),
):
    """
    Answer a question about a manual
    
    Request body:
    {
        "manual_id": str,
        "question": str,
        "top_k": int (optional, default=5)
    }
    """
    try:
        logger.info(f"Query request from {client_ip}", extra={"request_id": request_id})
        
        # Validate request
        if "manual_id" not in request_data:
            raise HTTPException(status_code=400, detail="Missing field: manual_id")
        if "question" not in request_data:
            raise HTTPException(status_code=400, detail="Missing field: question")
        
        # Validate question
        question = request_data["question"].strip()
        if not question or len(question) < 3:
            raise HTTPException(status_code=400, detail="Question too short")
        if len(question) > 500:
            raise HTTPException(status_code=400, detail="Question too long")
        
        # Create RAG engine and answer question
        rag_engine = RAGQueryEngine(
            manual_id=request_data["manual_id"],
            request_id=request_id,
        )
        
        result = await rag_engine.answer_question(
            manual_id=request_data["manual_id"],
            question=question,
            top_k=min(request_data.get("top_k", 5), 20),
        )
        
        logger.info(f"Query answered in {result['processing_time_ms']:.2f}ms")
        
        return result
        
    except MLServiceException:
        raise
    except Exception as e:
        logger.error(f"Query failed: {str(e)}", exc_info=True)
        raise


# ==================== UTILITY ENDPOINTS ====================

@app.get("/status")
async def status():
    """Service status endpoint"""
    return {
        "service": SERVICE_NAME,
        "version": SERVICE_VERSION,
        "status": "running",
        "debug": DEBUG,
    }


if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8001,
        reload=DEBUG,
        log_level=LOG_LEVEL.lower(),
    )
