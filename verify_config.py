import sys
import os
from pathlib import Path

# Add ml_service to path
ml_service_path = Path("p:/AI NEW PROJ/6th SEM SGP/ml_service")
sys.path.append(str(ml_service_path))

try:
    import config
    print(f"PINECONE_NAMESPACE: {config.PINECONE_NAMESPACE}")
    print(f"GROQ_MODEL: {config.GROQ_MODEL}")
    print(f"LLM_MODEL: {config.LLM_MODEL}")
    
    # Check if they match backend/.env
    # PINECONE_NAMESPACE should be "default"
    # GROQ_MODEL should be "llama-3.3-70b-versatile"
    # LLM_MODEL should be "llama-3.3-70b-versatile"
    
except Exception as e:
    print(f"Error: {e}")
