import os
import sys

# Add ml_service to path
sys.path.append(os.path.join(os.getcwd(), "ml_service"))

# Create a temporary .env for testing (or just set env var)
os.environ["PINECONE_NAMESPACE"] = "default"

from ml_service.config import PINECONE_NAMESPACE

print(f"DEBUG: PINECONE_NAMESPACE is '{PINECONE_NAMESPACE}'")
if PINECONE_NAMESPACE == "":
    print("SUCCESS: 'default' was normalized to ''")
else:
    print(f"FAILURE: 'default' was NOT normalized (got '{PINECONE_NAMESPACE}')")

# Test with "none"
os.environ["PINECONE_NAMESPACE"] = "none"
# Reload config logic (manual since it's already imported)
_raw = os.getenv("PINECONE_NAMESPACE", "")
_normalized = _raw if _raw.lower() not in ["", "default", "none", "null", "\"\"", "''"] else ""
print(f"DEBUG: 'none' normalized to '{_normalized}'")
