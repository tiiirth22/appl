# Two-Service Architecture Refactoring

## Overview

The ApplianceIQ backend has been refactored into a robust two-service architecture designed for production deployment with full error handling, resilience, and independent scalability.

### Service Decomposition

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
│                   (Port 3000, Cloud Run)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP REST API
                         │
┌────────────────────────▼────────────────────────────────────┐
│         Backend Service (Lightweight)                        │
│  ├─ Authentication (JWT)                                    │
│  ├─ Routing & API Gateway                                   │
│  ├─ File Upload (Cloudinary)                                │
│  ├─ QR Code Generation & Verification                       │
│  ├─ MongoDB Integration                                     │
│  └─ ML Service Client (with retries)                        │
│              │                                               │
│      (Port 8000, Cloud Run friendly)                         │
│      Memory: <1GB                                            │
│      Startup: <5s                                            │
│      ┌──────────────────────────────────────┐                │
│      │   Communication with ML Service      │                │
│      │   ├─ Configurable timeout (2min)     │                │
│      │   ├─ 3x retries + exponential backoff│                │
│      │   ├─ Request ID tracking             │                │
│      │   └─ Graceful degradation            │                │
│      └──────────────────────────────────────┘                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP REST (async)
                         │
┌────────────────────────▼────────────────────────────────────┐
│         ML Service (Heavy Processing)                        │
│  ├─ Document Ingestion (PDF/Image)                           │
│  │  ├─ File Downloads & Validation                           │
│  │  ├─ PDF Text Extraction (pdfminer)                        │
│  │  └─ OCR with Tesseract                                    │
│  ├─ Text Processing                                          │
│  │  ├─ Chunking (overlapping windows)                        │
│  │  ├─ Embedding Generation                                  │
│  │  └─ Quality validation                                    │
│  ├─ Vector Indexing                                          │
│  │  └─ Pinecone (namespace isolation)                        │
│  └─ RAG Query Engine                                         │
│     ├─ Semantic Search                                       │
│     └─ LLM Answer Generation (Groq)                          │
│                                                              │
│      (Port 8001, Cloud Run / Compute Engine)                 │
│      Memory: 2-4GB                                           │
│      Processing timeout: up to 10min                         │
└──────────────────────────────────────────────────────────────┘
```

---

## Part 1: Architecture Design

### Backend Service (Lightweight)

**Responsibilities:**
- Authentication & Authorization (JWT)
- HTTP Routing & API Gateway
- File upload handling (Cloudinary)
- MongoDB operations (users, manuals, sessions)
- QR code generation & verification
- Request validation & transformation
- Error handling & graceful degradation

**Constraints:**
- Startup time: < 5 seconds
- Memory usage: < 1GB
- No heavy ML imports at startup
- All ML calls delegate to ML Service

**Key Files:**
- `backend/server.py` - Main FastAPI app
- `backend/ml_client.py` - ML Service communication client
- `backend/auth.py` - Authentication (unchanged)
- `backend/qr_handler.py` - QR handling (unchanged)
- `backend/models.py` - Pydantic models (unchanged)

### ML Service (Heavy Processing)

**Responsibilities:**
- Document acquisition & validation
- Text extraction (PDF, images via OCR)
- Text chunking & preprocessing
- Embedding generation
- Vector indexing to Pinecone
- Semantic search
- LLM-based answer generation

**Constraints:**
- Startup time: flexible (lazy initialization)
- Memory usage: 2-4GB acceptable
- Processing timeout: up to 10 minutes
- Lazy initialization of heavy components

**Key Files:**
- `ml_service/server.py` - Main FastAPI app
- `ml_service/processor.py` - Document processing pipeline
- `ml_service/rag_engine.py` - Query answering engine
- `ml_service/errors.py` - Error types & handling
- `ml_service/config.py` - Configuration
- `ml_service/logger_config.py` - Logging setup

---

## Part 2: ML Service Implementation

### Endpoints

#### 1. POST `/process_manual`

Process a document and index it to Pinecone.

**Request:**
```json
{
  "file_url": "https://example.com/manual.pdf",
  "manual_id": "unique-id-123",
  "manual_name": "Washing Machine XL2000",
  "version": "1.0",
  "file_type": "pdf"  // or "image"
}
```

**Success Response (200):**
```json
{
  "manual_id": "unique-id-123",
  "status": "completed",
  "chunks_count": 245,
  "embedding_model": "sentence-transformers/all-MiniLM-L6-v2"
}
```

**Error Response (varies by error type):**
```json
{
  "error": "file_size_error",
  "message": "File size 250.50MB exceeds limit 100.00MB",
  "details": {
    "file_size_mb": 250.50,
    "max_size_mb": 100.00
  },
  "retryable": false,
  "timestamp": "2026-04-01T10:15:30.123456Z",
  "request_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### 2. POST `/query`

Answer a question about a manual using RAG.

**Request:**
```json
{
  "manual_id": "unique-id-123",
  "question": "How do I clean the filter?",
  "top_k": 5
}
```

**Success Response (200):**
```json
{
  "query_id": "query-id-456",
  "answer": "To clean the filter, remove it from the housing and rinse under cool running water...",
  "sources": [
    {
      "text": "Maintenance section describing filter cleaning...",
      "chunk_index": 42,
      "score": 0.87
    }
  ],
  "confidence": 0.85,
  "processing_time_ms": 2345
}
```

#### 3. GET `/health`

Basic health check.

**Response (200):**
```json
{
  "status": "healthy",
  "service": "ApplianceIQ ML Service",
  "version": "1.0.0",
  "timestamp": 1743667530.123
}
```

#### 4. GET `/health/detailed`

Detailed health check with component status.

**Response:**
```json
{
  "status": "healthy",
  "components": {
    "embedding_model": "ready",
    "pinecone": "ready",
    "groq": "ready"
  }
}
```

### Error Handling Strategy

All errors follow a consistent structure:

```python
{
  "error": "error_type",        # See ErrorType enum
  "message": "Human readable description",
  "details": {...},             # Optional context
  "retryable": true/false,      # Can caller retry?
  "timestamp": "ISO 8601",      # When error occurred
  "request_id": "UUID"          # Request tracking ID
}
```

**Error Types:**

| Type | Status | Retryable | Cause |
|------|--------|-----------|-------|
| `invalid_input` | 400 | No | Request validation failed |
| `file_download_error` | 502 | Maybe | URL unreachable/timeout |
| `file_size_error` | 413 | No | File exceeds size limit |
| `unsupported_format` | 400 | No | File type not supported |
| `ocr_error` | 500 | Yes | OCR extraction failed |
| `embedding_error` | 500 | Yes | Embedding generation failed |
| `pinecone_error` | 503 | Yes | Pinecone unavailable |
| `timeout_error` | 504 | Yes | Processing exceeded timeout |
| `service_unavailable` | 503 | Yes | Dependency not installed/configured |
| `internal_error` | 500 | Yes | Unexpected error |

### Processing Pipeline (with error handling)

```
┌─────────────────────────────────────┐
│ Download File (timeout: 2min)       │
│ ├─ Validate URL                     │
│ ├─ Check file size                  │
│ └─ Handle network errors            │
└─────────┬───────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│ Extract Text (timeout: 5min)        │
│ ├─ PDF: use pdfminer                │
│ ├─ Image: OCR with Tesseract        │
│ └─ Validate extracted content       │
└─────────┬───────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│ Chunk Text                          │
│ ├─ Split on word boundaries         │
│ ├─ Maintain overlap                 │
│ └─ Validate chunk count             │
└─────────┬───────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│ Generate Embeddings (timeout: 2min) │
│ ├─ Lazy load SentenceTransformer    │
│ ├─ Batch processing                 │
│ └─ Handle OOM errors                │
└─────────┬───────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│ Index to Pinecone (timeout: 1min)   │
│ ├─ Lazy initialize client           │
│ ├─ Batch upsert                     │
│ ├─ Attach metadata                  │
│ └─ Handle connection errors         │
└─────────┬───────────────────────────┘
          │
          ▼
    ✓ Success
```

### Lazy Initialization

Heavy components are NOT loaded at startup:

```python
class AsyncDocumentProcessor:
    def __init__(self):
        self._embedding_model = None          # Lazy
        self._pinecone_client = None          # Lazy
        self._pinecone_index = None           # Lazy
    
    async def _get_embedding_model(self):
        """Load on first use"""
        if self._embedding_model is None:
            self._embedding_model = await asyncio.to_thread(
                SentenceTransformer, EMBEDDING_MODEL
            )
        return self._embedding_model
```

**Benefits:**
- Fast startup (< 5s)
- Graceful degradation
- Only load what's needed
- Easy to test

### Timeout Handling

All external calls use `asyncio.wait_for()`:

```python
async def _extract_text(self, file_content, file_type):
    try:
        return await asyncio.wait_for(
            asyncio.to_thread(self._expensive_operation),
            timeout=300  # 5 minutes
        )
    except asyncio.TimeoutError:
        raise TimeoutError("extract_text", 300)
```

**Timeout Values:**
- File download: 2 minutes
- OCR extraction: 5 minutes
- Embedding generation: 2 minutes
- Pinecone operations: 1 minute
- Query answering: 1 minute

---

## Part 3: Backend Service Integration

### ML Service Client

```python
from ml_client import MLServiceClient, MLServiceError

# Initialize client
client = MLServiceClient(
    ml_service_url="http://ml-service:8001",
    timeout=120,
    max_retries=3,
    retry_backoff_factor=2.0,
)

# Process manual
try:
    result = await client.process_manual(
        file_url="https://...",
        manual_id="id-123",
        manual_name="Manual Name",
        version="1.0",
        file_type="pdf",
    )
except MLServiceError as e:
    if e.retryable:
        # Retry later
        pass
    else:
        # Log and fail
        logger.error(f"Non-retryable error: {e.message}")

# Query manual
try:
    result = await client.query_manual(
        manual_id="id-123",
        question="How do I clean it?",
        top_k=5,
    )
except MLServiceError as e:
    # Handle error
    pass
```

### Error Handling in Backend

Convert ML Service errors to HTTP responses:

```python
@app.post("/api/manuals/upload")
async def upload_manual(
    file: UploadFile,
    form_data: dict,
    ml_client: MLServiceClient = Depends(get_ml_client),
):
    try:
        # Upload to Cloudinary
        cloudinary_url = await upload_to_cloudinary(file)
        
        # Call ML Service
        result = await ml_client.process_manual(
            file_url=cloudinary_url,
            manual_id=form_data["manual_id"],
            manual_name=form_data["manual_name"],
            version=form_data["version"],
            file_type=form_data["file_type"],
        )
        
        # Save to MongoDB
        await db.manuals.insert_one({
            "manual_id": result["manual_id"],
            "status": result["status"],
            "chunks_count": result["chunks_count"],
        })
        
        return result
        
    except MLServiceError as e:
        # Convert to HTTPException
        raise e.to_http_exception()
```

### Retry Logic

The client automatically retries transient failures:

```python
# Retry configuration
max_retries = 3              # Total 4 attempts
retry_backoff_factor = 2.0   # Exponential backoff: 1s, 2s, 4s

# Retry on:
# - Connection errors
# - 5xx status codes
# - Timeouts

# Don't retry:
# - 4xx status codes (validation errors)
# - Non-retryable ML Service errors
```

**Backoff Example:**
```
Attempt 1: 0s (immediate)
Attempt 2: 1s (after 1s wait)
Attempt 3: 2s (after 2s wait)
Attempt 4: 4s (after 4s wait)
Failed: After 7s total
```

---

## Part 4: Resilience & Edge Cases

### 1. ML Service Down

**Backend Response:**
```json
{
  "error": "service_unavailable",
  "message": "ML Service is unavailable",
  "retryable": true,
  "status_code": 503
}
```

**Behavior:**
- Returns 503 Service Unavailable
- Request is retryable (client should retry)
- Backend continues running
- Other requests unaffected

### 2. Slow ML Response

**Handling:**
- Client timeout: 120s (configurable)
- Returns 504 Gateway Timeout
- Request marked as retryable

### 3. Invalid Response from ML

**Handling:**
```python
try:
    response = response.json()
except ValueError:
    raise MLServiceError(
        "invalid_response",
        "ML Service returned invalid JSON",
        retryable=False,
    )
```

### 4. File Upload Issues

**File Validation in Backend:**
```python
# Validate file type
allowed_types = {"pdf", "png", "jpg", "jpeg"}
if file.content_type not in allowed_types:
    raise HTTPException(400, "Unsupported file type")

# Validate file size (before upload)
max_size = 100 * 1024 * 1024  # 100MB
if len(await file.read()) > max_size:
    raise HTTPException(413, "File too large")
```

### 5. Database Failures

**Strategy:**
```python
async def save_to_db(db, data):
    for attempt in range(3):
        try:
            await db.collection.insert_one(data)
            return
        except pymongo.errors.AutoReconnect:
            await asyncio.sleep(2 ** attempt)
        except pymongo.errors.ServerSelectionTimeoutError:
            raise HTTPException(503, "Database unavailable")
```

### 6. Large Files

**Handling:**

Backend (before ML Service):
```python
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB

# Validate in backend
if file.size > MAX_FILE_SIZE:
    raise HTTPException(413, "File too large")
```

ML Service (double-check):
```python
if len(file_content) > MAX_FILE_SIZE_BYTES:
    raise FileSizeError(file_size_mb, max_size_mb)
```

### 7. Empty/Corrupt Documents

**ML Service Validation:**
```python
text = await self._extract_text(file_content, file_type)

# Validate extracted content
if not text or len(text.strip()) < 50:
    raise MLServiceException(
        "invalid_input",
        "Extracted text is too short or empty",
        retryable=False,
    )
```

---

## Part 5: Async Safety

### ✓ Correct Patterns

**Use async/await:**
```python
async def process_file(url):
    # Good: async context manager
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
    
    # Good: asyncio.to_thread() for blocking code
    result = await asyncio.to_thread(blocking_function, arg)
    
    # Good: asyncio.Lock for shared state
    async with asyncio.Lock():
        shared_state.update(data)
```

### ✗ Avoid These

```python
# BAD: threading.Lock in async code
import threading
lock = threading.Lock()  # ❌ WRONG

# BAD: Blocking I/O in async function
async def process():
    with open("file.txt") as f:  # ❌ Blocks event loop
        data = f.read()

# BAD: time.sleep()
async def process():
    time.sleep(5)  # ❌ Blocks event loop

# GOOD: asyncio.sleep()
async def process():
    await asyncio.sleep(5)  # ✓ Correct
```

---

## Part 6: Performance & Scalability

### Backend Service

**Rate Limiting (simple IP-based):**
```python
class RateLimiter:
    def __init__(self, limit: int = 100, window_sec: int = 60):
        self.limit = limit
        self.window = window_sec
    
    async def check(self, ip: str) -> bool:
        # Count requests in window
        recent = await self.db.rate_limits.count_documents({
            "ip": ip,
            "timestamp": {"$gt": time.time() - self.window}
        })
        return recent < self.limit
```

**Idempotency Key Support:**
```python
@app.post("/api/manuals/upload")
async def upload_manual(
    idempotency_key: str = Header(None),
):
    # Check if already processed
    existing = await db.uploads.find_one({
        "idempotency_key": idempotency_key
    })
    if existing:
        return existing["result"]
    
    # Process new upload
    result = await process(...)
    
    # Store with key
    await db.uploads.insert_one({
        "idempotency_key": idempotency_key,
        "result": result,
    })
    
    return result
```

### ML Service

**Batch Processing:**
```python
def _batch_upsert(self, index, vectors, batch_size=100):
    """Batch upsert to Pinecone"""
    for i in range(0, len(vectors), batch_size):
        batch = vectors[i:i + batch_size]
        index.upsert(vectors=batch)
```

**Resource Management:**
```python
# CPU-bound: use thread pool
embeddings = await asyncio.to_thread(
    model.encode, chunks
)

# I/O-bound: use httpx AsyncClient
async with httpx.AsyncClient() as client:
    response = await client.get(url)
```

---

## Part 7: Configuration

### Environment Variables

**ML Service** (`.env`):
```bash
# Services
PINECONE_API_KEY=...
GROQ_API_KEY=...

# Timeouts (seconds)
DOWNLOAD_TIMEOUT=120
OCR_TIMEOUT=300
EMBEDDING_TIMEOUT=120
PINECONE_TIMEOUT=60

# Size limits
MAX_FILE_SIZE_MB=100
CHUNK_SIZE=512
CHUNK_OVERLAP=100

# Logging
LOG_LEVEL=INFO
DEBUG=false
```

**Backend** (`.env`):
```bash
# ML Service
ML_SERVICE_URL=http://localhost:8001
ML_SERVICE_TIMEOUT=120
ML_SERVICE_MAX_RETRIES=3

# Other
MONGO_URL=mongodb://...
CLOUDINARY_*=...
JWT_SECRET_KEY=...
```

---

## Part 8: Deployment

### Development

**Start ML Service:**
```bash
cd ml_service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --reload --port 8001
```

**Start Backend (in another terminal):**
```bash
cd backend
pip install -r requirements.txt
export ML_SERVICE_URL=http://localhost:8001
uvicorn server:app --reload --port 8000
```

### Production (Cloud Run)

**Backend Dockerfile:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt --no-cache-dir

COPY backend/ .

ENV ML_SERVICE_URL=http://ml-service:8001
ENV PORT=8080

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8080"]
```

**ML Service Dockerfile:**
```dockerfile
FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY ml_service/requirements.txt .
RUN pip install -r requirements.txt --no-cache-dir

COPY ml_service/ .

ENV PORT=8080
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8080"]
```

**docker-compose.yml:**
```yaml
version: '3.8'

services:
  ml-service:
    build: ./ml_service
    ports:
      - "8001:8080"
    environment:
      - PINECONE_API_KEY=${PINECONE_API_KEY}
      - GROQ_API_KEY=${GROQ_API_KEY}
      - LOG_LEVEL=INFO
    depends_on:
      - pinecone  # Optional if running locally

  backend:
    build: ./backend
    ports:
      - "8000:8080"
    environment:
      - ML_SERVICE_URL=http://ml-service:8080
      - MONGO_URL=mongodb://mongo:27017
    depends_on:
      - ml-service
      - mongo

  mongo:
    image: mongo:6.0
    ports:
      - "27017:27017"
```

---

## Part 9: Logging Strategy

### Log Levels

- **DEBUG**: Detailed execution flow (disabled in prod)
- **INFO**: Significant events (startup, requests, completions)
- **WARNING**: Retries, degraded services
- **ERROR**: Failures, exceptions

### Structured Logging

All logs are JSON format for easy parsing:

```json
{
  "timestamp": "2026-04-01T10:15:30.123456Z",
  "level": "INFO",
  "logger": "ml_service.processor",
  "message": "Processing completed successfully",
  "module": "processor",
  "function": "process_manual",
  "line": 42,
  "request_id": "550e8400-e29b-41d4-a716-446655440000",
  "manual_id": "manual-123",
  "processing_time_ms": 5432
}
```

### Context Tracking

All requests include `request_id` for tracing:

```python
logger.info(
    "Processing request",
    extra={
        "request_id": request_id,
        "manual_id": manual_id,
        "client_ip": client_ip,
    }
)
```

### Log Files

- **ml_service.log**: All logs (rotates at 100MB)
- **ml_service_errors.log**: Error logs only (rotates at 50MB)
- **Console**: All logs (structured JSON)

---

## Part 10: Testing

### Example Tests

**Test ML Service:**
```python
# Test successful processing
async def test_process_manual_success():
    processor = AsyncDocumentProcessor()
    result = await processor.process_manual(
        file_url="https://example.com/test.pdf",
        manual_id="test-123",
        manual_name="Test Manual",
        version="1.0",
        file_type="pdf",
    )
    assert result["status"] == "completed"
    assert result["chunks_count"] > 0

# Test timeout handling
async def test_process_manual_timeout():
    processor = AsyncDocumentProcessor()
    with pytest.raises(TimeoutError):
        await processor.process_manual(
            file_url="https://slow-server.example.com/file",
            ...
        )

# Test malformed response
async def test_invalid_response():
    client = MLServiceClient("http://bad-service:8001")
    with pytest.raises(MLServiceError):
        await client.query_manual("id", "question")
```

**Test Backend:**
```python
async def test_manual_upload_ml_service_down():
    with patch.object(MLServiceClient, 'process_manual') as mock:
        mock.side_effect = MLServiceError(
            "service_unavailable",
            "ML Service down",
            retryable=True,
        )
        
        response = await client.post("/api/manuals/upload", json={...})
        assert response.status_code == 503

async def test_manual_upload_success():
    with patch.object(MLServiceClient, 'process_manual') as mock:
        mock.return_value = {
            "status": "completed",
            "chunks_count": 100,
        }
        
        response = await client.post("/api/manuals/upload", json={...})
        assert response.status_code == 200
```

---

## Summary

| Aspect | Backend | ML Service |
|--------|---------|------------|
| **Port** | 8000 | 8001 |
| **Memory** | < 1GB | 2-4GB |
| **Startup** | < 5s | flexible |
| **Heavy Imports** | None | Lazy loaded |
| **Timeout** | N/A | up to 10min |
| **Scaling** | Cloud Run | Compute Engine |
| **Error Handling** | HTTP responses | Structured JSON |
| **Retry Logic** | Built-in client | N/A |
| **Dependencies** | Minimal | Heavy (PDFminer, Tesseract, etc.) |

This architecture ensures:
✓ **Resilience**: Graceful degradation when ML Service fails
✓ **Scalability**: Services scale independently
✓ **Reliability**: Full error handling & retries
✓ **Maintainability**: Clear separation of concerns
✓ **Production-Ready**: Comprehensive logging, monitoring, configuration
