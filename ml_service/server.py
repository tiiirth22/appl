import asyncio
import uuid
from datetime import datetime, timezone
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, Request, BackgroundTasks
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from config import (
    SERVICE_NAME, SERVICE_VERSION, DEBUG, LOG_LEVEL,
    REQUEST_SIZE_LIMIT, RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW_SEC,
)
from logger_config import setup_logging, get_processing_logger
from processor import AsyncDocumentProcessor
from rag_engine import RAGQueryEngine
from model_manager import model_manager
from errors import (
    MLServiceException, ErrorType, ServiceUnavailableError,
    ProcessManualRequest, QueryRequest, HealthCheckResponse
)

# Initialize logging with absolute safety
try:
    setup_logging(log_level=LOG_LEVEL)
    logger = get_processing_logger(__name__)
    logger.info("Logging initialized successfully")
except Exception as e:
    import sys
    print(f"CRITICAL: Failed to initialize logging: {str(e)}", file=sys.stderr)
    # Define a basic logger if setup_logging fails
    logger = logging.getLogger(__name__)

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
    
    # Don't block startup on model loading to prevent Gunicorn/Railway boot timeouts
    # Instead, trigger it in the background
    logger.info("Triggering background model initialization...")
    model_manager.initialize()
    
    yield
    
    # Shutdown
    logger.info("Shutting down ML Service")


# Initialize FastAPI app
app = FastAPI(
    title=SERVICE_NAME,
    version=SERVICE_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://appliance-iq.vercel.app",
        "https://appliance-iq.vercel.app/",
        "https://www.appliance-iq.vercel.app",
        "https://www.appliance-iq.vercel.app/",
        "https://applianceiq-production.up.railway.app",
        "https://applianceiq-production.up.railway.app/",
        "https://upbeat-contentment-production-ed5c.up.railway.app",
        "https://upbeat-contentment-production-ed5c.up.railway.app/"
    ],
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
        content=error_response.model_dump(mode='json'),
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
    """Handle unexpected exceptions — expose real error for debugging"""
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_error",
            "message": f"Internal server error: {str(exc)}",
            "exception_type": type(exc).__name__,
            "request_id": request_id,
            "retryable": True,
        },
    )


# ==================== PUBLIC ROUTES ====================

@app.get("/", include_in_schema=False)
async def root_redirect():
    """Redirect root to documentation"""
    return RedirectResponse(url="/docs")


@app.get("/api/welcome")
async def welcome():
    """ML Service welcome message"""
    return {
        "message": "Welcome to ApplianceIQ ML Service",
        "status": "online",
        "docs": "/docs",
        "health": "/health"
    }


# ==================== HEALTH CHECK ====================

@app.get("/health")
async def health_check():
    """Liveness check - returns immediately if the server process is up.
    This prevents Railway from killing the container while the model is still loading.
    """
    return {
        "status": "alive",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": SERVICE_VERSION
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
    request: ProcessManualRequest,
    request_id: str = Depends(get_request_id),
    client_ip: str = Depends(check_rate_limit),
):
    """
    Process a manual document
    """
    try:
        logger.info(f"Processing request from {client_ip}")
        
        # Create processor and start processing
        processor = AsyncDocumentProcessor(
            manual_id=request.manual_id,
            request_id=request_id,
        )
        
        result = await processor.process_manual(
            file_url=request.file_url,
            manual_id=request.manual_id,
            manual_name=request.manual_name,
            version=request.version,
            file_type=request.file_type,
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
    request: QueryRequest,
    request_id: str = Depends(get_request_id),
    client_ip: str = Depends(check_rate_limit),
):
    """
    Answer a question about a manual
    """
    try:
        logger.info(f"Query request from {client_ip}")
        
        # Validate question length via Pydantic ge/le
        question = request.question.strip()
        if not question or len(question) < 3:
            raise HTTPException(status_code=400, detail="Question too short")
        
        # Create RAG engine and answer question
        rag_engine = RAGQueryEngine(
            manual_id=request.manual_id,
            request_id=request_id,
        )
        
        result = await rag_engine.answer_question(
            manual_id=request.manual_id,
            question=question,
            top_k=request.top_k,
        )
        
        logger.info(f"Query answered in {result['processing_time_ms']:.2f}ms")
        
        return result
        
    except MLServiceException:
        raise
    except Exception as e:
        logger.error(f"Query failed: {str(e)}", exc_info=True)
        raise


# ==================== UTILITY ENDPOINTS ====================

@app.get("/debug/pinecone")
async def debug_pinecone(request_id: str = Depends(get_request_id)):
    """Comprehensive Pinecone diagnostic endpoint returning only JSON-serializable info"""
    from config import PINECONE_API_KEY, PINECONE_INDEX_NAME
    import time
    
    debug_info = {
        "timestamp": time.time(),
        "config": {
            "index_name": PINECONE_INDEX_NAME,
            "api_key_present": bool(PINECONE_API_KEY),
        },
        "pinecone_connected": False,
        "details": {},
        "error": None
    }
    
    try:
        # 1. Initialize Processor to get index
        processor = AsyncDocumentProcessor(request_id=request_id)
        index = await processor._get_pinecone_index()
        debug_info["pinecone_connected"] = True
        
        # 2. Get Index Description (Safe extract)
        index_desc = await asyncio.to_thread(processor._pinecone_client.describe_index, PINECONE_INDEX_NAME)
        debug_info["details"]["dimension"] = getattr(index_desc, 'dimension', None)
        debug_info["details"]["metric"] = getattr(index_desc, 'metric', None)
        
        # 3. Get Stats (Wrapped in try/except)
        try:
            stats = await asyncio.to_thread(index.describe_index_stats)
            if hasattr(stats, 'to_dict'):
                debug_info["details"]["stats"] = stats.to_dict()
            else:
                debug_info["details"]["stats"] = {
                    "total_vector_count": getattr(stats, 'total_vector_count', 0),
                    "namespaces": getattr(stats, 'namespaces', {})
                }
        except Exception as stats_err:
            debug_info["details"]["stats_error"] = str(stats_err)
        
        debug_info["status"] = "ok"
            
    except Exception as e:
        debug_info["error"] = str(e)
        logger.error(f"Pinecone debug failed: {str(e)}", exc_info=True)
        
    return debug_info


@app.get("/status")
async def status():
    """Service status endpoint"""
    return {
        "service": SERVICE_NAME,
        "version": SERVICE_VERSION,
        "status": "running",
        "debug": DEBUG,
    }


@app.post("/debug/test-process")
async def debug_test_process(
    request_data: dict,
    request_id: str = Depends(get_request_id),
):
    """Debug endpoint: test process_manual with full error details exposed."""
    import traceback
    try:
        required_fields = ["file_url", "manual_id", "manual_name", "version", "file_type"]
        for field in required_fields:
            if field not in request_data:
                return {"error": f"Missing field: {field}"}
        
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
        return {"success": True, "result": result}
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__,
            "traceback": traceback.format_exc(),
        }


@app.get("/debug/pip-list")
async def debug_pip_list():
    """Debug endpoint: list all installed packages."""
    import subprocess
    try:
        result = subprocess.run(["pip", "list"], capture_output=True, text=True)
        return {"success": True, "output": result.stdout}
    except Exception as e:
        return {"success": False, "error": str(e)}


@app.post("/debug/test-query")
async def debug_test_query(
    request_data: dict,
    request_id: str = Depends(get_request_id),
):
    """Debug endpoint: test query with full error details exposed."""
    import traceback
    try:
        manual_id = request_data.get("manual_id", "")
        question = request_data.get("question", "")
        
        if not manual_id or not question:
            return {"error": "manual_id and question are required"}
        
        rag_engine = RAGQueryEngine(
            manual_id=manual_id,
            request_id=request_id,
        )
        
        result = await rag_engine.answer_question(
            manual_id=manual_id,
            question=question,
            top_k=request_data.get("top_k", 5),
        )
        return {"success": True, "result": result}
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__,
            "traceback": traceback.format_exc(),
        }


if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8001,
        reload=DEBUG,
        log_level=LOG_LEVEL.lower(),
    )
