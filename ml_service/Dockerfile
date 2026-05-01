# ══════════════════════════════════════════════════════════════════════
#  Stage 1: BUILD — Install PyTorch, convert model to ONNX + INT8
# ══════════════════════════════════════════════════════════════════════
FROM python:3.11-slim AS builder

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Build dependencies
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libtesseract-dev \
    poppler-utils \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# Install PyTorch (CPU-only) — ONLY used for ONNX export, NOT shipped to runtime
RUN pip install --no-cache-dir torch==2.2.0 --index-url https://download.pytorch.org/whl/cpu

# Install conversion dependencies
RUN pip install --no-cache-dir \
    "sentence-transformers==3.0.1" \
    "transformers>=4.38.0" \
    "onnx>=1.15.0" \
    "onnxruntime>=1.17.0" \
    "numpy>=1.24.0,<2.0.0"

# Convert model to ONNX + INT8 quantization
COPY convert_model.py .
RUN python convert_model.py

# Now install the actual runtime requirements (without torch)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt


# ══════════════════════════════════════════════════════════════════════
#  Stage 2: RUNTIME — Slim image with ONNX Runtime only (no PyTorch)
# ══════════════════════════════════════════════════════════════════════
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# CPU optimization
ENV OMP_NUM_THREADS=1
ENV MKL_NUM_THREADS=1
ENV TOKENIZERS_PARALLELISM=false
ENV ONNX_MODEL_DIR=/app/model_onnx

# Runtime system dependencies only
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    poppler-utils \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Python packages from builder (includes onnxruntime, transformers, etc.)
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy pre-converted ONNX model (INT8 quantized, ~22MB)
COPY --from=builder /app/model_onnx /app/model_onnx

# Copy service source code
COPY *.py requirements.txt /app/

# Cleanup
RUN find . -type d -name "__pycache__" -exec rm -rf {} + && \
    find . -type f -name "*.pyc" -delete

# Health check
HEALTHCHECK --interval=30s --timeout=15s --start-period=45s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

EXPOSE 8080

# Single worker — no process-level memory duplication
CMD exec gunicorn server:app \
    --workers 1 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:${PORT:-8080} \
    --timeout 300
