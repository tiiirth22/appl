@echo off
SETLOCAL EnableDelayedExpansion
cd /d "P:\AI NEW PROJ\6th SEM SGP"

echo ========================================================
echo  ApplianceIQ v2.0 — Unified ML Service Commit Script
echo  14 logical commits, clean traceable history
echo ========================================================
echo.

:: ─────────────────────────────────────────────────────────
:: Commit 1: Configuration foundation
:: ─────────────────────────────────────────────────────────
echo [1/14] Committing: ml_service config...
git add ml_service/config.py
git commit -m "feat(ml_service): add unified configuration module" -m "Centralizes all environment variables, timeouts, batching params, and ONNX model paths into a single config.py. Reads .env from backend/ for shared API keys. Includes USE_ONNX auto-detection for dev/prod mode switching."

:: ─────────────────────────────────────────────────────────
:: Commit 2: Error hierarchy and Pydantic models
:: ─────────────────────────────────────────────────────────
echo [2/14] Committing: ml_service error handling...
git add ml_service/errors.py
git commit -m "feat(ml_service): add unified error hierarchy and request/response models" -m "Defines ErrorType enum, MLServiceException base class, and typed Pydantic models for all API contracts (QueryRequest, ProcessManualRequest, EmbedRequest, etc.). Ensures consistent error serialization across all endpoints."

:: ─────────────────────────────────────────────────────────
:: Commit 3: Structured logging
:: ─────────────────────────────────────────────────────────
echo [3/14] Committing: ml_service logging...
git add ml_service/logger_config.py
git commit -m "feat(ml_service): add structured JSON logging with context tracking" -m "ProcessingLogger carries manual_id and request_id through the pipeline. JSON formatter for machine-readable logs. Handles read-only filesystems (Railway/Cloud Run) gracefully by falling back to tmpdir."

:: ─────────────────────────────────────────────────────────
:: Commit 4: ONNX model conversion script (build-time only)
:: ─────────────────────────────────────────────────────────
echo [4/14] Committing: ONNX conversion script...
git add ml_service/convert_model.py
git commit -m "feat(ml_service): add ONNX export and INT8 quantization script" -m "Build-time script that converts sentence-transformers/all-MiniLM-L6-v2 from PyTorch to ONNX format, then applies INT8 dynamic quantization. Reduces model size from ~90MB to ~22MB. Validates output dimensions and numerical accuracy post-conversion."

:: ─────────────────────────────────────────────────────────
:: Commit 5: Singleton ONNX model manager
:: ─────────────────────────────────────────────────────────
echo [5/14] Committing: model manager...
git add ml_service/model_manager.py
git commit -m "feat(ml_service): add ONNX-first singleton model manager" -m "Loads INT8-quantized ONNX model at startup via background asyncio task. Falls back to sentence-transformers for local development. Thread-safe encode() delegates CPU inference to asyncio.to_thread. Fixes stale-task race condition where a failed load could leave the manager in an unrecoverable state."

:: ─────────────────────────────────────────────────────────
:: Commit 6: Embedding cache
:: ─────────────────────────────────────────────────────────
echo [6/14] Committing: embedding cache...
git add ml_service/cache.py
git commit -m "feat(ml_service): add LRU embedding cache with SHA-256 keys" -m "Thread-safe OrderedDict-based LRU cache (1024 entries, ~1.5MB). Prevents recomputation for repeated queries. Exposes hit/miss metrics for observability."

:: ─────────────────────────────────────────────────────────
:: Commit 7: Dynamic embedding batcher
:: ─────────────────────────────────────────────────────────
echo [7/14] Committing: embedding batcher...
git add ml_service/batcher.py
git commit -m "feat(ml_service): add dynamic embedding batcher for CPU throughput" -m "Accumulates individual embed requests and flushes every 10ms or when 8 texts arrive. Converts sequential 15ms-per-text overhead into single batch operations. Uses asyncio.get_running_loop() (not deprecated get_event_loop)."

:: ─────────────────────────────────────────────────────────
:: Commit 8: Observability metrics
:: ─────────────────────────────────────────────────────────
echo [8/14] Committing: metrics module...
git add ml_service/metrics.py
git commit -m "feat(ml_service): add lightweight observability module" -m "Tracks process RSS memory, CPU percent, and per-endpoint latency with a sliding window (p50/p95/p99). Zero external dependencies. Uses clamped percentile indices to prevent IndexError on small sample sizes."

:: ─────────────────────────────────────────────────────────
:: Commit 9: Document processor (merged from ingestion_service)
:: ─────────────────────────────────────────────────────────
echo [9/14] Committing: document processor...
git add ml_service/processor.py
git commit -m "feat(ml_service): merge ingestion_service processor into unified service" -m "Refactored AsyncDocumentProcessor to use shared model_manager and embedding_cache instead of its own PyTorch instance. Fixed MLServiceException calls to use ErrorType enum instead of raw strings (was a runtime crash bug)."

:: ─────────────────────────────────────────────────────────
:: Commit 10: RAG engine (merged from chat_service)
:: ─────────────────────────────────────────────────────────
echo [10/14] Committing: RAG engine...
git add ml_service/rag_engine.py
git commit -m "feat(ml_service): merge chat_service RAG engine into unified service" -m "Adapted RAGQueryEngine to use shared ONNX model_manager and embedding_cache. Fixed: MLServiceException string-vs-enum bug, asyncio.to_thread silently dropping safety_settings kwarg for Gemini vision calls (wrapped in lambda)."

:: ─────────────────────────────────────────────────────────
:: Commit 11: FastAPI server (the unified entry point)
:: ─────────────────────────────────────────────────────────
echo [11/14] Committing: unified FastAPI server...
git add ml_service/server.py
git commit -m "feat(ml_service): add unified FastAPI server with all endpoints" -m "Merges /query, /analyze-image, /analyze-frame (from chat_service) and /process_manual (from ingestion_service) into a single process. Adds /embed and /metrics endpoints. Background ingestion via asyncio.Queue worker for fault isolation. Fixed: Queue created in lifespan (not module level), put_nowait for proper QueueFull handling, None guards for startup race conditions."

:: ─────────────────────────────────────────────────────────
:: Commit 12: Requirements and Dockerfile
:: ─────────────────────────────────────────────────────────
echo [12/14] Committing: requirements and Dockerfile...
git add ml_service/requirements.txt ml_service/Dockerfile
git commit -m "build(ml_service): add optimized Dockerfile and runtime requirements" -m "Multi-stage Docker build: Stage 1 installs PyTorch for ONNX export only, Stage 2 ships ONNX Runtime (~50MB vs ~800MB PyTorch). Runtime requirements exclude torch entirely. Single gunicorn worker with UvicornWorker."

:: ─────────────────────────────────────────────────────────
:: Commit 13: Docker Compose (2-service architecture)
:: ─────────────────────────────────────────────────────────
echo [13/14] Committing: docker-compose and startup script...
git add docker-compose.yml run_all_v2.bat
git commit -m "build: update docker-compose to 2-service architecture" -m "Replaces 3-service setup (backend + chat_service + ingestion_service) with 2 services (backend + ml_service). Both ML_SERVICE_URL and INGESTION_SERVICE_URL point to the same container. Resource limits: backend 256MB/0.25 CPU, ml_service 768MB/0.75 CPU. Adds run_all_v2.bat for local dev."

:: ─────────────────────────────────────────────────────────
:: Commit 14: Backend .env update (the only backend change)
:: ─────────────────────────────────────────────────────────
echo [14/14] Committing: backend .env update...
git add backend/.env
git commit -m "config(backend): point ingestion URL to unified ML service" -m "INGESTION_SERVICE_URL now matches ML_SERVICE_URL — both point to the same unified ml_service container. Old URLs preserved as comments for rollback. This is the ONLY change needed in the backend — zero code modifications."

echo.
echo ========================================================
echo  All 14 commits created successfully!
echo ========================================================
echo.

:: Show the commit log
echo Recent commit history:
echo ─────────────────────
git log --oneline -14

echo.
echo ========================================================
echo  Ready to push. Run: git push origin main
echo ========================================================
pause
