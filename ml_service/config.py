"""ML Service Configuration"""
import os
from pathlib import Path

# Environment loading - Load from BACKEND .env file
ROOT_DIR = Path(__file__).parent
BACKEND_DIR = ROOT_DIR.parent / 'backend'
load_dotenv_file = BACKEND_DIR / '.env'

# Try backend .env first, then fall back to ml_service .env
if not load_dotenv_file.exists():
    load_dotenv_file = ROOT_DIR / '.env'

if load_dotenv_file.exists():
    from dotenv import load_dotenv
    load_dotenv(load_dotenv_file)
    print(f"[Config] Loaded environment from: {load_dotenv_file}")

# Pinecone Configuration
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY", "")
PINECONE_INDEX_NAME = os.getenv("PINECONE_INDEX_NAME", "appliance-manuals")
# Groq/LLM Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
LLM_MODEL = os.getenv("LLM_MODEL", GROQ_MODEL)

# Embedding Configuration
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

# OCR Configuration
TESSERACT_PATH = os.getenv("TESSERACT_PATH", None)  # Path to tesseract binary if needed
POPPLER_PATH = os.getenv("POPPLER_PATH", None)      # Path to poppler bin

# Processing Configuration
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "100"))
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "512"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "100"))

# Timeout Configuration
DOWNLOAD_TIMEOUT = int(os.getenv("DOWNLOAD_TIMEOUT", "120"))  # 2 minutes
OCR_TIMEOUT = int(os.getenv("OCR_TIMEOUT", "300"))  # 5 minutes
EMBEDDING_TIMEOUT = int(os.getenv("EMBEDDING_TIMEOUT", "120"))  # 2 minutes
PINECONE_TIMEOUT = int(os.getenv("PINECONE_TIMEOUT", "60"))  # 1 minute
QUERY_TIMEOUT = int(os.getenv("QUERY_TIMEOUT", "60"))  # 1 minute

# Performance Configuration
REQUEST_SIZE_LIMIT = int(os.getenv("REQUEST_SIZE_LIMIT", "512")) * 1024 * 1024  # 512MB
RATE_LIMIT_REQUESTS = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
RATE_LIMIT_WINDOW_SEC = int(os.getenv("RATE_LIMIT_WINDOW_SEC", "60"))

# Service Configuration
SERVICE_NAME = "ApplianceIQ ML Service"
SERVICE_VERSION = "1.0.0"
DEBUG = os.getenv("DEBUG", "false").lower() == "true"
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Health Check
HEALTH_CHECK_INTERVAL = 60  # seconds
