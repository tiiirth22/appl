import os
from pinecone import Pinecone
from dotenv import load_dotenv
from pathlib import Path

# Load env from backend/.env
env_path = Path("backend/.env")
load_dotenv(dotenv_path=env_path)

api_key = os.getenv("PINECONE_API_KEY")
index_name = os.getenv("PINECONE_INDEX_NAME")

pc = Pinecone(api_key=api_key)
index = pc.Index(index_name)

try:
    stats = index.describe_index_stats()
    print(f"Total Vectors: {stats.total_vector_count}")
    print(f"Namespaces: {stats.namespaces}")
    
    for ns, details in stats.namespaces.items():
        print(f"\nNamespace: '{ns}' ({details['vector_count']} vectors)")
        # Query with zero vector to see IDs in this namespace
        # Get index dimension from description
        index_desc = pc.describe_index(index_name)
        dim = index_desc.dimension
        
        # Use "" for the root namespace instead of "__default__" which is just Pinecone's display label
        actual_ns = "" if ns == "" or ns == "__default__" else ns
        
        results = index.query(
            vector=[0.0] * dim,
            top_k=5,
            include_metadata=True,
            namespace=actual_ns
        )
        for match in results.matches:
            print(f"  ID: {match.id}, Manual ID: {match.metadata.get('manual_id')}")

except Exception as e:
    print(f"Error: {e}")
