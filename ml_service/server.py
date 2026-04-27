"""
ApplianceIQ Unified ML Service
================================
Merges chat_service + ingestion_service into a single process.
- Single ONNX model loaded once (singleton)
- Dynamic batching for embeddings
- LRU embedding cache
- Background task queue for ingestion (fault isolation)
- Backward-compatible endpoints for the existing backend
"""

import asyncio
import os
import uuid
import time
import logging
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, Request, BackgroundTasks
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
import uvicorn

from config import (
    SERVICE_NAME, SERVICE_VERSION, DEBUG, LOG_LEVEL,
    REQUEST_SIZE_LIMIT, RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW_SEC,
)
from logger_config import setup_logging, get_processing_logger
from model_manager import model_manager
from batcher import EmbeddingBatcher
from cache import embedding_cache
from metrics import metrics
from rag_engine import RAGQueryEngine
from processor import AsyncDocumentProcessor
from errors import (
    MLServiceException, ErrorType, ServiceUnavailableError,
    QueryRequest, AnalyzeImageRequest, AnalyzeFrameRequest,
    AnalyzeFrameResponse, ProcessManualRequest,
    EmbedRequest, EmbedResponse, HealthCheckResponse, QueryResponse,
)

# ─── Logging ──────────────────────────────────────────────────────────
try:
    setup_logging(log_level=LOG_LEVEL)
    logger = get_processing_logger(__name__)
    logger.info("Logging initialized")
except Exception as e:
    import sys
    print(f"CRITICAL: Logging init failed: {e}", file=sys.stderr)
    logger = logging.getLogger(__name__)

# ─── Rate Limiter ─────────────────────────────────────────────────────
class SimpleRateLimiter:
    def __init__(self, requests: int, window_sec: int):
        self.requests = requests
        self.window_sec = window_sec
        self.request_times = {}
        self.last_cleanup = 0.0

    async def check(self, key: str) -> bool:
        now = time.time()
        if key not in self.request_times:
            self.request_times[key] = []
        cutoff = now - self.window_sec
        self.request_times[key] = [t for t in self.request_times[key] if t > cutoff]
        if len(self.request_times[key]) >= self.requests:
            return False
        self.request_times[key].append(now)
        if len(self.request_times) > 1000 and (now - self.last_cleanup) > self.window_sec:
            self.last_cleanup = now
            for k in [k for k, v in self.request_times.items() if not v]:
                del self.request_times[k]
        return True

rate_limiter = SimpleRateLimiter(RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW_SEC)

# ─── Global batcher ──────────────────────────────────────────────────
batcher = EmbeddingBatcher(model_manager)

# ─── Ingestion background queue ──────────────────────────────────────
# Queue is initialized in lifespan() to guarantee an event loop exists.
_ingestion_queue: asyncio.Queue = None  # type: ignore
_ingestion_active = 0

async def _ingestion_worker():
    """Background worker that processes ingestion tasks sequentially,
    ensuring they never block chat requests."""
    global _ingestion_active
    while True:
        task_data = await _ingestion_queue.get()
        _ingestion_active += 1
        try:
            processor = AsyncDocumentProcessor(
                manual_id=task_data["manual_id"],
                request_id=task_data.get("request_id"),
            )
            await processor.process_manual(
                file_url=task_data["file_url"],
                manual_id=task_data["manual_id"],
                manual_name=task_data["manual_name"],
                version=task_data["version"],
                file_type=task_data["file_type"],
            )
            logger.info(f"Ingestion completed: {task_data['manual_id']}")
        except Exception as e:
            logger.error(f"Ingestion failed for {task_data['manual_id']}: {e}", exc_info=True)
        finally:
            _ingestion_active -= 1
            _ingestion_queue.task_done()


# ─── Lifespan ─────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {SERVICE_NAME} v{SERVICE_VERSION}")

    # Initialize the ingestion queue (requires a running event loop)
    global _ingestion_queue
    _ingestion_queue = asyncio.Queue(maxsize=50)

    # Start model loading (non-blocking)
    model_manager.initialize()

    # Start embedding batcher
    await batcher.start()

    # Start background ingestion worker
    worker_task = asyncio.create_task(_ingestion_worker())

    yield

    # Shutdown
    await batcher.stop()
    worker_task.cancel()
    logger.info("Shutting down ML Service")


# ─── App ──────────────────────────────────────────────────────────────
app = FastAPI(
    title=SERVICE_NAME,
    version=SERVICE_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", "http://127.0.0.1:3000",
        "https://appliance-iq.vercel.app", "https://www.appliance-iq.vercel.app",
        "https://applianceiq-production.up.railway.app",
        "https://upbeat-contentment-production-ed5c.up.railway.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Dependencies ─────────────────────────────────────────────────────
async def get_request_id(request: Request) -> str:
    return request.headers.get("X-Request-ID") or str(uuid.uuid4())

async def check_rate_limit(request: Request) -> str:
    client_ip = request.client.host if request.client else "unknown"
    if not await rate_limiter.check(client_ip):
        raise HTTPException(status_code=429, detail="Too many requests")
    return client_ip


# ─── Exception Handlers ──────────────────────────────────────────────
@app.exception_handler(MLServiceException)
async def ml_exc_handler(request: Request, exc: MLServiceException):
    rid = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    status = {ErrorType.TIMEOUT_ERROR: 504, ErrorType.SERVICE_UNAVAILABLE: 503,
              ErrorType.INTERNAL_ERROR: 500}.get(exc.error_type, 400)
    return JSONResponse(status_code=status, content=jsonable_encoder(exc.to_response(rid)))

@app.exception_handler(HTTPException)
async def http_exc_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": "http_error", "message": exc.detail})

@app.exception_handler(Exception)
async def general_exc_handler(request: Request, exc: Exception):
    rid = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    logger.error(f"Unhandled: {exc}", exc_info=True)
    return JSONResponse(status_code=500, content={
        "error": "internal_error", "message": f"Internal error: {exc}",
        "request_id": rid, "retryable": True,
    })


# ─── Middleware: latency tracking ─────────────────────────────────────
@app.middleware("http")
async def latency_middleware(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    elapsed = (time.time() - start) * 1000
    endpoint = f"{request.method} {request.url.path}"
    metrics.latency.record(endpoint, elapsed)
    response.headers["X-Response-Time-Ms"] = f"{elapsed:.1f}"
    return response


# ══════════════════════════════════════════════════════════════════════
#  PUBLIC ROUTES
# ══════════════════════════════════════════════════════════════════════

@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")

@app.get("/api/welcome")
async def welcome():
    return {"message": f"Welcome to {SERVICE_NAME}", "status": "online", "docs": "/docs"}


# ══════════════════════════════════════════════════════════════════════
#  HEALTH
# ══════════════════════════════════════════════════════════════════════

@app.get("/health")
async def health():
    """Liveness probe — returns immediately."""
    return {"status": "alive", "timestamp": datetime.now(timezone.utc).isoformat(), "version": SERVICE_VERSION}

@app.get("/health/detailed")
async def health_detailed(request_id: str = Depends(get_request_id)):
    h = {"status": "healthy", "components": {}}
    h["components"]["embedding_model"] = model_manager.status
    h["components"]["model_backend"] = model_manager.backend
    if model_manager.status != "ready":
        h["status"] = "degraded"

    from config import GEMINI_API_KEY, PINECONE_API_KEY
    h["components"]["gemini"] = "configured" if GEMINI_API_KEY else "missing"
    h["components"]["pinecone_key"] = "configured" if PINECONE_API_KEY else "missing"

    h["components"]["ingestion_queue"] = {
        "pending": _ingestion_queue.qsize() if _ingestion_queue else 0,
        "active": _ingestion_active,
    }
    h["components"]["cache"] = embedding_cache.metrics
    h["components"]["batcher"] = batcher.metrics
    return h


# ══════════════════════════════════════════════════════════════════════
#  CHAT ENDPOINTS (backward-compatible with backend ml_client.py)
# ══════════════════════════════════════════════════════════════════════

@app.post("/query")
async def query_manual(request: QueryRequest, request_id: str = Depends(get_request_id),
                       client_ip: str = Depends(check_rate_limit)):
    start = time.time()
    try:
        question = request.question.strip()
        if not question or len(question) < 3:
            raise HTTPException(status_code=400, detail="Question too short")
        rag = RAGQueryEngine(manual_id=request.manual_id, request_id=request_id)
        result = await rag.answer_question(
            manual_id=request.manual_id, manual_name=request.manual_name,
            question=question, top_k=request.top_k, history=request.history,
        )
        logger.info(f"Query answered in {result['processing_time_ms']:.2f}ms")
        return result
    except MLServiceException:
        raise
    except Exception as e:
        logger.error(f"Query failed: {e}", exc_info=True)
        raise

@app.post("/analyze-image", response_model=QueryResponse)
async def analyze_image(request: AnalyzeImageRequest, request_id: str = Depends(get_request_id),
                        client_ip: str = Depends(check_rate_limit)):
    try:
        rag = RAGQueryEngine(manual_id=request.manual_id, request_id=request_id)
        return await rag.analyze_image(
            image_b64=request.image_b64, manual_id=request.manual_id,
            manual_name=request.manual_name, history=request.history, top_k=request.top_k,
        )
    except MLServiceException:
        raise
    except Exception as e:
        logger.error(f"Analyze image error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail={"error": "internal_error", "message": str(e)})

@app.post("/analyze-frame", response_model=AnalyzeFrameResponse)
async def analyze_frame(request: AnalyzeFrameRequest, request_id: str = Depends(get_request_id),
                        client_ip: str = Depends(check_rate_limit)):
    try:
        rag = RAGQueryEngine(request_id=request_id)
        return await rag.analyze_frame(image_b64=request.image_b64)
    except MLServiceException:
        raise
    except Exception as e:
        logger.error(f"Analyze frame error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail={"error": "internal_error", "message": str(e)})


# ══════════════════════════════════════════════════════════════════════
#  INGESTION ENDPOINT (backward-compatible with backend ml_client.py)
# ══════════════════════════════════════════════════════════════════════

@app.post("/process_manual")
async def process_manual(request: ProcessManualRequest, request_id: str = Depends(get_request_id),
                         client_ip: str = Depends(check_rate_limit)):
    """Queue manual for background processing — returns immediately."""
    if _ingestion_queue is None:
        raise HTTPException(status_code=503, detail="Service is starting up. Try again shortly.")
    try:
        _ingestion_queue.put_nowait({
            "file_url": request.file_url, "manual_id": request.manual_id,
            "manual_name": request.manual_name, "version": request.version,
            "file_type": request.file_type, "request_id": request_id,
        })
        logger.info(f"Ingestion queued: {request.manual_id}")
        return {"manual_id": request.manual_id, "status": "pending", "chunks_count": 0,
                "message": "Manual processing queued in background"}
    except asyncio.QueueFull:
        raise HTTPException(status_code=503, detail="Ingestion queue full. Try again later.")


# ══════════════════════════════════════════════════════════════════════
#  NEW OPTIMIZED ENDPOINTS
# ══════════════════════════════════════════════════════════════════════

@app.post("/embed", response_model=EmbedResponse)
async def embed_texts(request: EmbedRequest, request_id: str = Depends(get_request_id)):
    """Direct embedding endpoint with caching and batching."""
    import numpy as np
    start = time.time()
    results = []
    cached_count = 0

    for text in request.texts:
        cached = embedding_cache.get(text)
        if cached is not None:
            results.append(cached.tolist() if hasattr(cached, "tolist") else list(cached))
            cached_count += 1
        else:
            emb = await batcher.embed(text)
            embedding_cache.put(text, emb)
            results.append(emb.tolist() if hasattr(emb, "tolist") else list(emb))

    elapsed = (time.time() - start) * 1000
    return EmbedResponse(
        embeddings=results, dimension=len(results[0]) if results else 0,
        count=len(results), cached=cached_count, processing_time_ms=round(elapsed, 2),
    )


# ══════════════════════════════════════════════════════════════════════
#  METRICS & DEBUG
# ══════════════════════════════════════════════════════════════════════

@app.get("/metrics")
async def get_metrics():
    """Observability endpoint — memory, CPU, latency, cache, batcher stats."""
    return metrics.collect(model_manager=model_manager, batcher=batcher, cache=embedding_cache)

@app.get("/status")
async def status():
    return {"service": SERVICE_NAME, "version": SERVICE_VERSION, "status": "running", "debug": DEBUG}

@app.get("/debug/pinecone")
async def debug_pinecone(request_id: str = Depends(get_request_id)):
    from config import PINECONE_API_KEY, PINECONE_INDEX_NAME
    info = {"pinecone_connected": False, "error": None}
    try:
        rag = RAGQueryEngine(request_id=request_id)
        index = await rag._get_pinecone_index()
        info["pinecone_connected"] = True
        stats = await asyncio.to_thread(index.describe_index_stats)
        info["total_vectors"] = getattr(stats, "total_vector_count", 0)
    except Exception as e:
        info["error"] = str(e)
    return info


# ─── Entry point ──────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(
        "server:app", host="0.0.0.0",
        port=int(os.getenv("PORT", 8001)),
        reload=DEBUG, log_level=LOG_LEVEL.lower(),
    )
