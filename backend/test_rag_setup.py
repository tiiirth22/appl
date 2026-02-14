import os
import asyncio
import httpx
from qdrant_client import QdrantClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def check_setup():
    print("=== Checking RAG Setup ===")
    
    # 1. Check Qdrant Connection
    qdrant_url = os.getenv("QDRANT_URL")
    qdrant_api_key = os.getenv("QDRANT_API_KEY")
    collection_name = os.getenv("QDRANT_COLLECTION")
    
    if not qdrant_url or not qdrant_api_key:
        print("❌ QDRANT_URL or QDRANT_API_KEY missing in .env")
        return

    print(f"Checking Qdrant at '{qdrant_url}'...")
    try:
        client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
        collections = client.get_collections()
        print(f"✅ Qdrant Connection Successful. Found {len(collections.collections)} collections.")
        
        # Check specific collection
        collection_names = [c.name for c in collections.collections]
        if collection_name in collection_names:
            print(f"✅ Collection '{collection_name}' exists.")
        else:
            print(f"⚠️ Collection '{collection_name}' does NOT exist (will be created by ingestion).")
            
    except Exception as e:
        print(f"❌ Qdrant Connection Failed: {e}")

    # 2. Check Embedding Model
    print("\nChecking Embedding Model...")
    try:
        from sentence_transformers import SentenceTransformer
        model_name = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
        print(f"Loading model: {model_name}...")
        model = SentenceTransformer(model_name)
        embedding = model.encode("test string")
        print(f"✅ Embedding Model Loaded Successfully. Vector dimension: {len(embedding)}")
    except ImportError:
        print("❌ sentence-transformers not installed.")
    except Exception as e:
        print(f"❌ Embedding Model Load Failed: {e}")

    # 3. Check Ollama
    ollama_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    print(f"\nChecking Ollama at {ollama_url}...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{ollama_url}/api/tags")
            if response.status_code == 200:
                models = response.json().get('models', [])
                model_names = [m['name'] for m in models]
                print(f"✅ Ollama Running. Available models: {model_names}")
                
                required_model = os.getenv("OLLAMA_MODEL", "llama3.1")
                # partial match check because ollama tags can have :latest
                if any(required_model in m for m in model_names):
                    print(f"✅ Required model '{required_model}' found.")
                else:
                    print(f"⚠️ Required model '{required_model}' NOT found. Please run `ollama pull {required_model}`.")
            else:
                print(f"❌ Ollama responded with status: {response.status_code}")
    except httpx.ConnectError:
        print("❌ Ollama Connection Failed (Is Ollama running locally?)")
    except Exception as e:
        print(f"❌ Ollama Check Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_setup())
