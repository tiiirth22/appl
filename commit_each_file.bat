@echo off
SETLOCAL EnableDelayedExpansion
cd /d "P:\AI NEW PROJ\6th SEM SGP"

echo ================================================================
echo  ApplianceIQ — Individual File Commit Script
echo  Each file gets its own separate commit
echo ================================================================
echo.

:: ─────────────────────────────────────────────────────────
:: ml_service files (13 files, 13 commits)
:: ─────────────────────────────────────────────────────────

echo [1/15] Committing: ml_service/config.py
git add ml_service/config.py
git commit -m "feat(ml_service): add unified configuration module" -m "Centralizes all environment variables, timeouts, batching params, and ONNX model paths into a single config.py."

echo [2/15] Committing: ml_service/errors.py
git add ml_service/errors.py
git commit -m "feat(ml_service): add error hierarchy and Pydantic request/response models" -m "Defines ErrorType enum, MLServiceException base class, and typed Pydantic models for all API contracts."

echo [3/15] Committing: ml_service/logger_config.py
git add ml_service/logger_config.py
git commit -m "feat(ml_service): add structured JSON logging with context tracking" -m "ProcessingLogger carries manual_id and request_id through the pipeline with JSON formatter."

echo [4/15] Committing: ml_service/convert_model.py
git add ml_service/convert_model.py
git commit -m "feat(ml_service): add ONNX export and INT8 quantization script" -m "Build-time script converting sentence-transformers to ONNX with INT8 dynamic quantization."

echo [5/15] Committing: ml_service/model_manager.py
git add ml_service/model_manager.py
git commit -m "feat(ml_service): add ONNX-first singleton model manager" -m "Loads INT8-quantized ONNX model at startup with fallback to sentence-transformers for local dev."

echo [6/15] Committing: ml_service/cache.py
git add ml_service/cache.py
git commit -m "feat(ml_service): add LRU embedding cache with SHA-256 keys" -m "Thread-safe OrderedDict-based LRU cache (1024 entries) preventing recomputation for repeated queries."

echo [7/15] Committing: ml_service/batcher.py
git add ml_service/batcher.py
git commit -m "feat(ml_service): add dynamic embedding batcher for CPU throughput" -m "Accumulates embed requests and flushes every 10ms or when 8 texts arrive for batch operations."

echo [8/15] Committing: ml_service/metrics.py
git add ml_service/metrics.py
git commit -m "feat(ml_service): add lightweight observability metrics module" -m "Tracks process RSS memory, CPU percent, and per-endpoint latency with sliding window percentiles."

echo [9/15] Committing: ml_service/processor.py
git add ml_service/processor.py
git commit -m "feat(ml_service): add unified document processor (merged from ingestion_service)" -m "AsyncDocumentProcessor refactored to use shared model_manager and embedding_cache."

echo [10/15] Committing: ml_service/rag_engine.py
git add ml_service/rag_engine.py
git commit -m "feat(ml_service): add RAG query engine (merged from chat_service)" -m "RAGQueryEngine adapted to use shared ONNX model_manager and embedding_cache."

echo [11/15] Committing: ml_service/server.py
git add ml_service/server.py
git commit -m "feat(ml_service): add unified FastAPI server with all endpoints" -m "Merges /query, /analyze-image, /analyze-frame, /process_manual, /embed, and /metrics into single process."

echo [12/15] Committing: ml_service/requirements.txt
git add ml_service/requirements.txt
git commit -m "build(ml_service): add runtime requirements (ONNX-optimized)" -m "Runtime requirements exclude torch entirely, shipping only onnxruntime for inference."

echo [13/15] Committing: ml_service/Dockerfile
git add ml_service/Dockerfile
git commit -m "build(ml_service): add multi-stage Dockerfile with ONNX optimization" -m "Stage 1 installs PyTorch for ONNX export, Stage 2 ships only ONNX Runtime (~50MB vs ~800MB)."

:: ─────────────────────────────────────────────────────────
:: Root-level files
:: ─────────────────────────────────────────────────────────

echo [14/15] Committing: docker-compose.yml
git add docker-compose.yml
git commit -m "build: update docker-compose to 2-service architecture" -m "Replaces 3-service setup with 2 services (backend + ml_service). Resource limits: backend 256MB, ml_service 768MB."

echo [15/15] Committing: run_all_v2.bat
git add run_all_v2.bat
git commit -m "build: add v2 startup script for unified architecture" -m "Local development startup script for the new 2-service Docker architecture."

echo.
echo ================================================================
echo  All 15 individual commits created!
echo ================================================================
echo.

:: Show the commit log
echo Recent commit history:
git log --oneline -15

echo.
echo ================================================================
echo  Ready to push. Run:  git push origin main
echo ================================================================
pause
