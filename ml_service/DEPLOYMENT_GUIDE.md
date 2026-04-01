# Two-Service Architecture - Quick Start & Deployment Guide

## Quick Start (Local Development)

### Prerequisites

```bash
# Python 3.11+
python --version

# System dependencies (for ML Service)
# On Ubuntu/Debian:
sudo apt-get install -y tesseract-ocr poppler-utils

# On macOS:
brew install tesseract poppler

# On Windows:
# Download from:
# - Tesseract: https://github.com/UB-Mannheim/tesseract/wiki
# - Poppler: https://github.com/oschwartz10612/poppler-windows/releases
```

### Setup ML Service

```bash
# Create virtual environment
cd ml_service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your Pinecone API key, Groq API key, etc.

# Run ML Service
uvicorn server:app --reload --port 8001
# Should see: Uvicorn running on http://0.0.0.0:8001
```

### Setup Backend Service

```bash
# In another terminal, create virtual environment
cd backend
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with:
# - MONGO_URL=mongodb://localhost:27017
# - ML_SERVICE_URL=http://localhost:8001
# - Other configurations

# Run Backend
uvicorn server:app --reload --port 8000
# Should see: Uvicorn running on http://0.0.0.0:8000
```

### Verify Setup

```bash
# In another terminal:

# Check Backend health
curl http://localhost:8000/health
# Expected: {"status":"ok"}

# Check ML Service health
curl http://localhost:8001/health
# Expected: {"status":"healthy",...}

# Check ML Service detailed health
curl http://localhost:8001/health/detailed
# Expected: Component status for embedding_model, pinecone, groq
```

---

## Architecture Overview

```
Frontend (React)        Backend (8000)        ML Service (8001)
┌──────────────┐       ┌──────────────┐      ┌──────────────┐
│   React 19   │◄─────►│  FastAPI     │◄────►│  FastAPI     │
│  Port 3000   │       │ Lightweight  │      │  Heavy ML    │
│              │       │              │      │              │
│ - Auth       │       │ - Auth       │      │ - OCR        │
│ - Chat UI    │       │ - File Upload│      │ - Embeddings │
│ - QR Codes   │       │ - QR Codes   │      │ - RAG        │
│ - Feedback   │       │ - Router     │      │ - Pinecone   │
└──────────────┘       └──────────────┘      └──────────────┘
                            ▲
                            │
                       ┌────▼─────┐
                       │ Pinecone  │
                       │ (Vector   │
                       │  DB)      │
                       └───────────┘
```

---

## Deployment to Google Cloud

### Prerequisites

```bash
# Install Google Cloud SDK
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Enable services
gcloud services enable run.googleapis.com
gcloud services enable build.googleapis.com
```

### Build & Push Docker Images

```bash
# Set variables
PROJECT_ID=$(gcloud config get-value project)
REGION=us-central1

# Build and push ML Service
cd ml_service
docker build -t gcr.io/$PROJECT_ID/ml-service:latest .
docker push gcr.io/$PROJECT_ID/ml-service:latest

# Build and push Backend Service
cd ../backend
docker build -t gcr.io/$PROJECT_ID/backend-service:latest .
docker push gcr.io/$PROJECT_ID/backend-service:latest
```

### Deploy to Cloud Run

```bash
# Deploy ML Service
gcloud run deploy ml-service \
  --image gcr.io/$PROJECT_ID/ml-service:latest \
  --region $REGION \
  --memory 4Gi \
  --timeout 600 \
  --set-env-vars "PINECONE_API_KEY=$PINECONE_KEY,GROQ_API_KEY=$GROQ_KEY" \
  --no-allow-unauthenticated

# Get ML Service URL
ML_SERVICE_URL=$(gcloud run services describe ml-service \
  --region $REGION --format 'value(status.url)')

# Deploy Backend Service
gcloud run deploy backend-service \
  --image gcr.io/$PROJECT_ID/backend-service:latest \
  --region $REGION \
  --memory 1Gi \
  --timeout 120 \
  --set-env-vars "ML_SERVICE_URL=$ML_SERVICE_URL,MONGO_URL=$MONGO_URL" \
  --allow-unauthenticated

# Get Backend Service URL
BACKEND_URL=$(gcloud run services describe backend-service \
  --region $REGION --format 'value(status.url)')

echo "Backend Service: $BACKEND_URL"
echo "ML Service: $ML_SERVICE_URL"
```

### Configure Service-to-Service Authentication

```bash
# Get ML Service identity
ML_SERVICE_SA=$(gcloud run services describe ml-service \
  --region $REGION --format 'value(spec.template.spec.serviceAccountName)')

# Grant Backend permission to call ML Service
gcloud run services add-iam-policy-binding ml-service \
  --region $REGION \
  --member "serviceAccount:$BACKEND_SA" \
  --role "roles/run.invoker"
```

### Monitor Deployments

```bash
# View logs
gcloud run services logs read ml-service --region $REGION
gcloud run services logs read backend-service --region $REGION

# Real-time logs
gcloud run services logs read ml-service --region $REGION --follow

# View service metrics
gcloud monitoring metrics-descriptors list --filter "service.name = ml-service"
```

---

## Docker Compose (Local Stack)

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  # MongoDB
  mongodb:
    image: mongo:6.0
    container_name: applianceiq-mongo
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongo-data:/data/db

  # ML Service
  ml-service:
    build:
      context: .
      dockerfile: ml_service/Dockerfile
    container_name: applianceiq-ml
    ports:
      - "8001:8080"
    environment:
      PINECONE_API_KEY: ${PINECONE_API_KEY}
      GROQ_API_KEY: ${GROQ_API_KEY}
      LOG_LEVEL: INFO
      DEBUG: "false"
    depends_on:
      - mongodb
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Backend Service
  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    container_name: applianceiq-backend
    ports:
      - "8000:8080"
    environment:
      MONGO_URL: "mongodb://admin:password@mongodb:27017/applianceiq_db?authSource=admin"
      ML_SERVICE_URL: "http://ml-service:8080"
      CLOUDINARY_CLOUD_NAME: ${CLOUDINARY_CLOUD_NAME}
      CLOUDINARY_API_KEY: ${CLOUDINARY_API_KEY}
      CLOUDINARY_API_SECRET: ${CLOUDINARY_API_SECRET}
      JWT_SECRET_KEY: ${JWT_SECRET_KEY}
      LOG_LEVEL: INFO
    depends_on:
      - mongodb
      - ml-service
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend (optional)
  frontend:
    build:
      context: ./frontend
    container_name: applianceiq-frontend
    ports:
      - "3000:3000"
    environment:
      REACT_APP_API_URL: "http://localhost:8000"
    depends_on:
      - backend

volumes:
  mongo-data:

networks:
  default:
    name: applianceiq-network
```

**Run with Docker Compose:**

```bash
# Create .env file
cat > .env << EOF
PINECONE_API_KEY=pk_...
GROQ_API_KEY=gsk_...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
JWT_SECRET_KEY=your-secret-key-here
EOF

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

---

## Debugging Common Issues

### Issue: ML Service Times Out

**Symptoms:**
```json
{
  "error": "timeout",
  "message": "ML Service request timed out after 120s",
  "retryable": true
}
```

**Solutions:**
1. Check ML Service is running: `curl http://localhost:8001/health`
2. Increase timeout in backend: `ML_SERVICE_TIMEOUT=300` (5 minutes)
3. Check ML Service logs: `docker-compose logs ml-service`
4. File size too large? Check `MAX_FILE_SIZE_MB` setting

### Issue: Pinecone Connection Failed

**Symptoms:**
```json
{
  "error": "pinecone_error",
  "message": "Failed to initialize Pinecone: ..."
}
```

**Solutions:**
1. Verify `PINECONE_API_KEY` is correct
2. Check Pinecone service status
3. Verify `PINECONE_INDEX_NAME` exists in Pinecone dashboard
4. Try health check: `curl http://localhost:8001/health/detailed`

### Issue: OCR Fails

**Symptoms:**
```json
{
  "error": "ocr_error",
  "message": "OCR extraction failed: ..."
}
```

**Solutions:**
1. Verify Tesseract is installed: `tesseract --version`
2. Check image quality (very low res images fail)
3. Try a different image format
4. Increase `OCR_TIMEOUT` if image is large

### Issue: CORS Errors in Frontend

**Browser Console:**
```
Access to XMLHttpRequest at 'http://localhost:8000/...' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solution:**
Update backend CORS configuration:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue: MongoDB Connection Refused

**Symptoms:**
```
pymongo.errors.ServerSelectionTimeoutError: ...
```

**Solutions:**
1. Start MongoDB: `docker-compose up mongodb`
2. Verify connection string: `MONGO_URL=mongodb://localhost:27017`
3. Check MongoDB is listening: `netstat -an | grep 27017`

---

## Performance Tuning

### Backend Service

```bash
# Optimize for faster cold start
# In Dockerfile:
FROM python:3.11-slim

# Use multi-stage build
RUN pip install --no-cache-dir -r requirements.txt

# Reduce image size
RUN apt-get remove --purge -y && apt-get clean
```

### ML Service

```bash
# Pre-load models at startup (optional, trade startup time for query time)
# In server.py startup event:

@app.on_event("startup")
async def preload_models():
    # Optional: pre-load heavy models
    # processor = AsyncDocumentProcessor()
    # await processor._get_embedding_model()
    # Note: this slows startup but speeds up first query
    pass
```

### Database

```bash
# Add MongoDB indexes
db.manuals.create_index([("user_id", 1), ("created_at", -1)])
db.queries.create_index([("manual_id", 1), ("created_at", -1)])
db.rate_limits.create_index([("user_id", 1), ("timestamp", 1)], expireAfterSeconds=3600)
```

---

## Monitoring & Alerting

### Setup Cloud Monitoring

```bash
# Create uptime check for Backend
gcloud monitoring uptime-configs create \
  --display-name="Backend Service" \
  --monitored-resource-type=uptime-url \
  --http-check-path=/health

# Create uptime check for ML Service
gcloud monitoring uptime-configs create \
  --display-name="ML Service" \
  --monitored-resource-type=uptime-url \
  --http-check-path=/health
```

### Key Metrics to Monitor

1. **Backend Service:**
   - Request latency (p50, p95, p99)
   - Error rate (4xx, 5xx)
   - ML Service call duration
   - Database operation latency

2. **ML Service:**
   - Document processing time
   - Embedding generation time
   - Query answering time
   - Pinecone operation latency
   - OCR success rate

3. **System:**
   - CPU usage
   - Memory usage
   - Disk space
   - Network I/O

---

## Testing

### Test Backend

```bash
cd backend
pip install pytest pytest-asyncio httpx

# Run tests
pytest tests/ -v

# With coverage
pytest tests/ --cov=. --cov-report=html
```

### Test ML Service

```bash
cd ml_service
pip install pytest pytest-asyncio

# Run tests
pytest tests/ -v

# Test specific endpoint
pytest tests/test_processor.py::test_process_manual_success -v
```

### Integration Test

```bash
# Test full flow with Docker Compose
docker-compose up

# From another terminal:
curl -X POST http://localhost:8000/api/manuals/upload \
  -F "file=@test_manual.pdf" \
  -F "model_name=Test Model" \
  -F "version=1.0"

curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"manual_id":"...", "question":"..."}'
```

---

## Rollout Strategy

### Blue-Green Deployment

```bash
# Deploy new version to "green" environment
gcloud run deploy backend-service-green \
  --image gcr.io/$PROJECT_ID/backend-service:v2.0 \
  --region $REGION

# Test green environment
curl https://backend-service-green-xxxx.run.app/health

# Route traffic to green (after validation)
gcloud run services update-traffic backend-service \
  --to-revisions LATEST=100 \
  --region $REGION

# Or gradual rollout (10% to new version)
gcloud run services update-traffic backend-service \
  --to-revisions old-revision=90,new-revision=10 \
  --region $REGION
```

### Canary Deployment

Monitor metrics during gradual rollout:
```bash
# Monitor error rate
gcloud monitoring time-series-data evaluate \
  --filter 'resource.service_name = "backend-service" AND metric.response_status_code >= 500'

# Rollback if needed
gcloud run deploy backend-service \
  --image gcr.io/$PROJECT_ID/backend-service:v1.0 \
  --region $REGION
```

---

## Backup & Recovery

### MongoDB Backup

```bash
# Manual backup
mongodump --uri "mongodb://admin:password@localhost:27017" \
  --authenticationDatabase admin \
  --out ./backup/$(date +%Y%m%d_%H%M%S)

# Automated backup (cron job)
0 2 * * * /usr/bin/mongodump --uri "mongodb://..." --out /backups/mongodb-$(date +\%Y\%m\%d)
```

### Pinecone Backup

```bash
# Export all vectors (via API)
python scripts/backup_pinecone.py
# Saves vectors to JSON file

# Restore (re-index)
python scripts/restore_pinecone.py --input backup.json
```

---

## Scaling Considerations

### Horizontal Scaling

**Backend:** Scale by increasing Cloud Run instances
```bash
gcloud run services update backend-service \
  --region $REGION \
  --max-instances 50
```

**ML Service:** Can deploy multiple instances
- Each handles independent document processing
- Pinecone namespace isolation prevents conflicts

### Scaling Limits

- **Backend**: Can handle 1000+ concurrent requests
- **ML Service**: Limited by file processing capacity (e.g., 10 requests/minute if max timeout is 10min)
- **Pinecone**: Depends on index size and query rate

---

## Summary Checklist

- [ ] Both services running locally
- [ ] Database (MongoDB) connected
- [ ] Pinecone configured
- [ ] Groq API key configured
- [ ] Docker images built
- [ ] Deployed to Cloud Run
- [ ] CORS configured
- [ ] Monitoring set up
- [ ] Logs aggregated
- [ ] Backups automated
- [ ] Health checks passing
- [ ] Integration tests passing
