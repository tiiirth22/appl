import os
import asyncio
import httpx
from pinecone import Pinecone
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def check_setup():
    print("=== Checking RAG Setup ===")
    
    # 1. Check Pinecone Connection
    pinecone_api_key = os.getenv("PINECONE_API_KEY")
    index_name = os.getenv("PINECONE_INDEX_NAME", "appliance-manuals")
    
    if not pinecone_api_key:
        print("❌ PINECONE_API_KEY missing in .env")
        return

    print(f"Checking Pinecone connection...")
    try:
        pc = Pinecone(api_key=pinecone_api_key)
        indexes = pc.list_indexes()
        index_names = [i.name for i in indexes]
        print(f"✅ Pinecone Connection Successful. Found {len(index_names)} indexes: {index_names}")
        
        # Check specific index
        if index_name in index_names:
            print(f"✅ Index '{index_name}' exists.")
        else:
            print(f"⚠️ Index '{index_name}' does NOT exist (will be created by ingestion).")
            
    except Exception as e:
        print(f"❌ Pinecone Connection Failed: {e}")

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
