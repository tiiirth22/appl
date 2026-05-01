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

import redis
from config import (
    SERVICE_NAME, SERVICE_VERSION, DEBUG, LOG_LEVEL,
    REQUEST_SIZE_LIMIT, RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW_SEC,
    REDIS_URL, REDIS_ENABLED, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY,
    AWS_REGION, AWS_SQS_QUEUE_URL
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
class HybridRateLimiter:
    """Distributed rate limiter with local fallback."""
    def __init__(self, requests: int, window_sec: int):
        self.requests = requests
        self.window_sec = window_sec
        self._redis: Optional[redis.Redis] = None
        self._local_counts = {}
        
        if REDIS_ENABLED:
            try:
                self._redis = redis.from_url(REDIS_URL, socket_timeout=1)
                self._redis.ping()
                logger.info("Distributed Redis rate limiting enabled")
            except Exception as e:
                logger.warning(f"Redis rate limiter unavailable, falling back to local: {e}")

    async def check(self, key: str) -> bool:
        now = time.time()
        
        # 1. Try Redis (Sliding Window)
        if self._redis:
            try:
                redis_key = f"rl:{key}"
                pipe = self._redis.pipeline()
                pipe.zadd(redis_key, {str(now): now})
                pipe.zremrangebyscore(redis_key, 0, now - self.window_sec)
                pipe.zcard(redis_key)
                pipe.expire(redis_key, self.window_sec + 5)
                results = pipe.execute()
                return results[2] <= self.requests
            except Exception as e:
                logger.error(f"Redis rate limit error: {e}")

        # 2. Local Fallback (Simple Window)
        if key not in self._local_counts:
            self._local_counts[key] = []
        self._local_counts[key] = [t for t in self._local_counts[key] if t > now - self.window_sec]
        if len(self._local_counts[key]) >= self.requests:
            return False
        self._local_counts[key].append(now)
        return True

rate_limiter = HybridRateLimiter(RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW_SEC)

# ─── Global batcher ──────────────────────────────────────────────────
batcher = EmbeddingBatcher(model_manager)

# ─── Ingestion background queue ──────────────────────────────────────
_ingestion_queue: asyncio.Queue = None  # type: ignore
_ingestion_active = 0
_worker_running = True

async def _ingestion_worker():
    """Enterprise-grade background worker (supports SQS or Local Queue)."""
    global _ingestion_active, _worker_running
    import json
    
    sqs = None
    if AWS_SQS_QUEUE_URL and AWS_ACCESS_KEY_ID:
        try:
            import boto3
            sqs = boto3.client('sqs', region_name=AWS_REGION)
            logger.info(f"Connected to AWS SQS: {AWS_SQS_QUEUE_URL}")
        except Exception as e:
            logger.error(f"Failed to init SQS worker: {e}")

    while _worker_running:
        task_data = None
        receipt_handle = None
        
        try:
            # 1. Fetch from SQS or Local
            if sqs:
                response = await asyncio.to_thread(sqs.receive_message,
                    QueueUrl=AWS_SQS_QUEUE_URL,
                    MaxNumberOfMessages=1,
                    WaitTimeSeconds=10
                )
                if 'Messages' in response:
                    msg = response['Messages'][0]
                    task_data = json.loads(msg['Body'])
                    receipt_handle = msg['ReceiptHandle']
            else:
                try:
                    task_data = await asyncio.wait_for(_ingestion_queue.get(), timeout=5)
                except asyncio.TimeoutError:
                    continue

            if not task_data:
                continue

            # 2. Process
            _ingestion_active += 1
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
            
            # 3. Cleanup
            if sqs and receipt_handle:
                sqs.delete_message(QueueUrl=AWS_SQS_QUEUE_URL, ReceiptHandle=receipt_handle)
            elif _ingestion_queue:
                _ingestion_queue.task_done()
                
            logger.info(f"Ingestion successful: {task_data['manual_id']}")
            
        except Exception as e:
            logger.error(f"Worker iteration failed: {e}", exc_info=True)
            if _ingestion_queue and not sqs:
                _ingestion_queue.task_done()
            await asyncio.sleep(5) # Cooldown on failure
        finally:
            if task_data:
                _ingestion_active = max(0, _ingestion_active - 1)


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
        os.getenv("PRODUCTION_DOMAIN", "*"),
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
    logger.error(f"ML Service Error [{exc.error_type}]: {exc.message}")
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
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    
    response = await call_next(request)
    
    elapsed = (time.time() - start) * 1000
    logger.info("Request processed", extra={
        "method": request.method,
        "path": request.url.path,
        "status_code": response.status_code,
        "latency_ms": round(elapsed, 2),
        "request_id": request_id,
        "client_ip": request.client.host if request.client else "unknown"
    })
    
    response.headers["X-Response-Time-Ms"] = f"{elapsed:.1f}"
    response.headers["X-Request-ID"] = request_id
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
    h = {"status": "healthy", "components": {}, "request_id": request_id}
    
    # 1. AI Models
    h["components"]["embedding_model"] = model_manager.status
    if model_manager.status != "ready":
        h["status"] = "degraded"

    # 2. Redis
    if REDIS_ENABLED:
        try:
            r = redis.from_url(REDIS_URL, socket_timeout=1)
            r.ping()
            h["components"]["redis"] = "connected"
        except Exception as e:
            h["components"]["redis"] = f"error: {e}"
            h["status"] = "degraded"
    else:
        h["components"]["redis"] = "disabled"

    # 3. AWS Services
    h["components"]["sqs"] = "configured" if AWS_SQS_QUEUE_URL else "local_only"
    h["components"]["s3"] = "configured" if AWS_S3_BUCKET else "local_only"

    # 4. Queue Stats
    h["components"]["ingestion"] = {
        "active_jobs": _ingestion_active,
        "backend": "sqs" if AWS_SQS_QUEUE_URL else "local",
        "queue_size": _ingestion_queue.qsize() if _ingestion_queue else 0
    }
    
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
    """Queue manual for processing — support SQS or Local."""
    import json
    task = {
        "file_url": request.file_url, "manual_id": request.manual_id,
        "manual_name": request.manual_name, "version": request.version,
        "file_type": request.file_type, "request_id": request_id,
    }
    
    # 1. Try SQS
    if AWS_SQS_QUEUE_URL and AWS_ACCESS_KEY_ID:
        try:
            import boto3
            sqs = boto3.client('sqs', region_name=AWS_REGION)
            sqs.send_message(QueueUrl=AWS_SQS_QUEUE_URL, MessageBody=json.dumps(task))
            return {"manual_id": request.manual_id, "status": "queued", "backend": "sqs"}
        except Exception as e:
            logger.error(f"SQS queue failed: {e}")
            
    # 2. Fallback to Local Queue
    if _ingestion_queue is None:
        raise HTTPException(status_code=503, detail="Ingestion service starting up...")
    try:
        _ingestion_queue.put_nowait(task)
        return {"manual_id": request.manual_id, "status": "pending", "backend": "local"}
    except asyncio.QueueFull:
        raise HTTPException(status_code=503, detail="Ingestion queue full")


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
        port=int(os.getenv("PORT", 8080)),
        reload=False, log_level=LOG_LEVEL.lower(),
    )
