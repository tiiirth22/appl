import httpx
import asyncio
import json
import motor.motor_asyncio
import os
from dotenv import load_dotenv

load_dotenv()

async def test_streaming_and_tracing():
    # 1. Start Chat Stream
    url = "http://localhost:8000/api/chat"
    payload = {
        "manual_id": "any-id", # Replaced by server if mock or actually exists
        "question": "How to save energy?"
    }
    
    print("\n[TEST] --> Starting Chat Stream...")
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            async with client.stream("POST", url, json=payload) as r:
                if r.status_code != 200:
                    print(f"[ERROR] Chat failed with {r.status_code}")
                    if r.status_code == 401: print("   (Token required for chat - skip stream test in terminal)")
                    return

                async for chunk in r.aiter_text():
                    print(chunk, end="", flush=True)
            print("\n[SUCCESS] Stream ended.")
        except Exception as e:
            print(f"[ERROR] {e}")

    # 2. Check Traces in DB
    print("\n[TEST] --> Checking RAG Traces in DB...")
    client = motor.motor_asyncio.AsyncIOMotorClient(os.getenv("MONGODB_URI", "mongodb://localhost:27017"))
    db = client.applianceiq_db
    
    trace = await db.rag_traces.find_one(sort=[("timestamp", -1)])
    if trace:
        print(f"[SUCCESS] Trace Found! Latency: {trace.get('retrieval_time', 0):.4f}s, Sources: {trace.get('source_count', 0)}")
    else:
        print("[FAIL] No recent RAG traces found.")

if __name__ == "__main__":
    asyncio.run(test_streaming_and_tracing())
