import os
from pinecone import Pinecone
from dotenv import load_dotenv
from pathlib import Path

# Load env from backend/.env
env_path = Path("backend/.env")
load_dotenv(dotenv_path=env_path)

api_key = os.getenv("PINECONE_API_KEY")
index_name = os.getenv("PINECONE_INDEX_NAME")

print(f"API Key: {api_key[:10]}...")
print(f"Index Name: {index_name}")

if not api_key or not index_name:
    print("Error: Pinecone API Key or Index Name not found in .env")
    exit(1)

try:
    pc = Pinecone(api_key=api_key)
    index = pc.Index(index_name)
    stats = index.describe_index_stats()
    print("\n--- Index Stats ---")
    print(stats)
    
    # Check index dimension
    index_desc = pc.describe_index(index_name)
    print(f"\nIndex Dimension: {index_desc.dimension}")
    print(f"Index Metric: {index_desc.metric}")
    print(f"Index Cloud: {index_desc.cloud}")
    print(f"Index Region: {index_desc.region}")
    
except Exception as e:
    print(f"\nError: {e}")
