import os
import asyncio
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add ml_service to sys.path to import config and models
ROOT_DIR = Path(__file__).parent
ml_service_path = ROOT_DIR / "ml_service"
sys.path.append(str(ml_service_path))

# Load environment from backend/.env
backend_env = ROOT_DIR / "backend" / ".env"
if backend_env.exists():
    load_dotenv(backend_env)
    print(f"Loaded environment from {backend_env}")
else:
    print(f"Warning: {backend_env} not found")

import config
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer

async def diagnose():
    print("\n--- Diagnostic Start ---")
    
    # 1. Check Environment Variables
    print(f"PINECONE_INDEX_NAME: {config.PINECONE_INDEX_NAME}")
    print(f"PINECONE_NAMESPACE: {config.PINECONE_NAMESPACE}")
    print(f"EMBEDDING_MODEL: {config.EMBEDDING_MODEL}")
    
    # 2. Check Embedding Model
    print("\nChecking Embedding Model...")
    try:
        model = SentenceTransformer(config.EMBEDDING_MODEL)
        test_text = "This is a test sentence."
        embedding = model.encode([test_text])[0]
        dim = len(embedding)
        print(f"Model loaded successfully. Output dimension: {dim}")
    except Exception as e:
        print(f"Error loading embedding model: {e}")
        return

    # 3. Check Pinecone Connectivity
    print("\nChecking Pinecone Connectivity...")
    try:
        pc = Pinecone(api_key=config.PINECONE_API_KEY)
        index_list = pc.list_indexes().names()
        print(f"Available indexes: {index_list}")
        
        if config.PINECONE_INDEX_NAME not in index_list:
            print(f"Error: Index '{config.PINECONE_INDEX_NAME}' not found in Pinecone!")
            return
            
        index = pc.Index(config.PINECONE_INDEX_NAME)
        stats = index.describe_index_stats()
        print(f"Index stats: {stats}")
        
        index_desc = pc.describe_index(config.PINECONE_INDEX_NAME)
        index_dim = index_desc.dimension
        print(f"Index dimension: {index_dim}")
        
        if dim != index_dim:
            print(f"FAILURE: Embedding model dimension ({dim}) does NOT match Pinecone index dimension ({index_dim})!")
        else:
            print(f"SUCCESS: Embedding model dimension ({dim}) matches Pinecone index dimension ({index_dim}).")
            
        # 4. Check Namespaces
        namespaces = stats.get('namespaces', {})
        if config.PINECONE_NAMESPACE not in namespaces and config.PINECONE_NAMESPACE != "":
            print(f"Warning: Namespace '{config.PINECONE_NAMESPACE}' not found in index stats. Results may be empty.")
        else:
            vector_count = namespaces.get(config.PINECONE_NAMESPACE, {}).get('vector_count', 0)
            print(f"Namespace '{config.PINECONE_NAMESPACE}' has {vector_count} vectors.")

    except Exception as e:
        print(f"Error connecting to Pinecone: {e}")

    print("\n--- Diagnostic End ---")

if __name__ == "__main__":
    asyncio.run(diagnose())
