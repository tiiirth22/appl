"""Unified ML Service Configuration"""
import os
from pathlib import Path

# ─── Environment Loading ──────────────────────────────────────────────
ROOT_DIR = Path(__file__).parent
BACKEND_DIR = ROOT_DIR.parent / "backend"
_dotenv_file = BACKEND_DIR / ".env"

if not _dotenv_file.exists():
    _dotenv_file = ROOT_DIR / ".env"

if _dotenv_file.exists():
    from dotenv import load_dotenv
    load_dotenv(_dotenv_file)
    print(f"[Config] Loaded environment from: {_dotenv_file}")

# ─── Pinecone ─────────────────────────────────────────────────────────
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "appliance-manuals")
PINECONE_NAMESPACE = os.getenv("PINECONE_NAMESPACE", "default")

# ─── LLM Configuration ───────────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_API_KEY_SECONDARY = os.getenv("GROQ_API_KEY_SECONDARY", "") or GROQ_API_KEY or None
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
LLM_MODEL = os.getenv("LLM_MODEL", GROQ_MODEL)
LLM_MODEL_SECONDARY = os.getenv("LLM_MODEL_SECONDARY", "llama-3.1-8b-instant")
GROQ_VISION_MODEL = os.getenv("GROQ_VISION_MODEL", "llama-3.2-11b-vision-preview")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# ─── Embedding Model ─────────────────────────────────────────────────
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

# ONNX model path — set by Docker build, or fall back to local dev path
ONNX_MODEL_DIR = os.getenv("ONNX_MODEL_DIR", str(ROOT_DIR / "model_onnx"))
ONNX_MODEL_PATH = os.path.join(ONNX_MODEL_DIR, "model_quantized.onnx")
ONNX_TOKENIZER_PATH = os.path.join(ONNX_MODEL_DIR, "tokenizer")

# Fallback: use sentence-transformers (PyTorch) if ONNX model not found
USE_ONNX = os.path.exists(ONNX_MODEL_PATH)

# ─── OCR Configuration ───────────────────────────────────────────────
TESSERACT_PATH = os.getenv("TESSERACT_PATH", None)
POPPLER_PATH = os.getenv("POPPLER_PATH", None)

# ─── Processing Configuration ────────────────────────────────────────
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "100"))
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "512"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "100"))

# ─── Timeout Configuration ───────────────────────────────────────────
DOWNLOAD_TIMEOUT = int(os.getenv("DOWNLOAD_TIMEOUT", "120"))
OCR_TIMEOUT = int(os.getenv("OCR_TIMEOUT", "300"))
EMBEDDING_TIMEOUT = int(os.getenv("EMBEDDING_TIMEOUT", "120"))
PINECONE_TIMEOUT = int(os.getenv("PINECONE_TIMEOUT", "60"))
QUERY_TIMEOUT = int(os.getenv("QUERY_TIMEOUT", "60"))

# ─── Performance Configuration ───────────────────────────────────────
REQUEST_SIZE_LIMIT = int(os.getenv("REQUEST_SIZE_LIMIT", "512")) * 1024 * 1024
RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
RATE_LIMIT_WINDOW_SEC = int(os.getenv("RATE_LIMIT_WINDOW_SEC", "60"))

# ─── Batching Configuration ──────────────────────────────────────────
BATCH_SIZE = int(os.getenv("BATCH_SIZE", "8"))
BATCH_WINDOW_MS = int(os.getenv("BATCH_WINDOW_MS", "10"))  # milliseconds

# ─── Caching Configuration ───────────────────────────────────────────
EMBEDDING_CACHE_SIZE = int(os.getenv("EMBEDDING_CACHE_SIZE", "1024"))

# ─── Redis Configuration ─────────────────────────────────────────────
REDIS_URL = os.getenv("REDIS_URL", None)  # If None, fallback to in-memory
REDIS_ENABLED = REDIS_URL is not None

# ─── AWS Configuration ───────────────────────────────────────────────
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET", "appliance-manuals-prod")
AWS_SQS_QUEUE_URL = os.getenv("AWS_SQS_QUEUE_URL", "")

# ─── Storage Configuration ───────────────────────────────────────────
STORAGE_BACKEND = os.getenv("STORAGE_BACKEND", "local")  # "local", "s3", "cloudinary"
TEMP_DIR = Path(os.getenv("TEMP_DIR", "/tmp/applianceiq"))

# ─── Service Metadata ────────────────────────────────────────────────
SERVICE_NAME = "ApplianceIQ Unified ML Service"
SERVICE_VERSION = "2.1.0"
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# ─── Health Check ────────────────────────────────────────────────────
HEALTH_CHECK_INTERVAL = 60
