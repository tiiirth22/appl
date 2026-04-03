import os
import sys
from pathlib import Path

# Add ml_service to path
sys.path.append(str(Path(__file__).parent / "ml_service"))

# Set environment for testing
os.environ["PINECONE_NAMESPACE"] = "default"

# Import config (force reload or just check first import)
from ml_service.config import PINECONE_NAMESPACE, PINECONE_INDEX_NAME

print(f"--- Configuration Test ---")
print(f"PINECONE_NAMESPACE: '{PINECONE_NAMESPACE}'")
if PINECONE_NAMESPACE == "default":
    print("SUCCESS: 'default' is NO LONGER normalized to ''.")
else:
    print("FAILURE: 'default' was still normalized.")

print(f"\n--- Connectivity Test (Internal) ---")
try:
    from ml_service.rag_engine import RAGQueryEngine
    import asyncio

    async def test_conn():
        engine = RAGQueryEngine()
        index = await engine._get_pinecone_index()
        print(f"SUCCESS: Connected to index '{PINECONE_INDEX_NAME}'")
        
        stats = await asyncio.to_thread(index.describe_index_stats)
        print(f"Index Stats: {stats.namespaces}")
        
        # Check if records exist in the default namespace (which is displayed as __default__)
        if "__default__" in stats.namespaces:
             print(f"Found {stats.namespaces['__default__'].vector_count} records in '__default__' namespace.")
        else:
             print("No records found in '__default__' (root) namespace.")
             
        if "default" in stats.namespaces:
             print(f"Found {stats.namespaces['default'].vector_count} records in 'default' namespace.")
        else:
             print("No records found in literal 'default' namespace.")
        
    asyncio.run(test_conn())
except Exception as e:
    print(f"FAILURE: {str(e)}")
