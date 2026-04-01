# Stage 1: Builder
FROM python:3.11-slim AS builder

WORKDIR /app

# Prevent Python from writing bytecode
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install build dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Stage 2: Final
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Copy ONLY installed packages (as prefix)
COPY --from=builder /install /usr/local

# Copy ONLY necessary backend source code to prevent "blind copying" of entire project
COPY *.py requirements.txt /app/

# Remove ALL unnecessary files from the build context just in case
RUN find . -maxdepth 1 -not -name "*.py" -not -name "requirements.txt" -not -name "." -exec rm -rf {} + && \
    find . -type d -name "__pycache__" -exec rm -rf {} + && \
    find . -type f -name "*.pyc" -delete && \
    rm -rf tests/ .pytest_cache/

EXPOSE 8080

CMD exec gunicorn \
    --bind 0.0.0.0:$PORT \
    --workers 1 \
    --worker-class uvicorn.workers.UvicornWorker \
    --threads 2 \
    --timeout 120 \
    server:app