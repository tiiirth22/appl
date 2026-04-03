import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

# Load env from backend/.env
env_path = Path("backend/.env")
load_dotenv(dotenv_path=env_path)

mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME', 'applianceiq_db')

async def check_db():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"Checking DB: {db_name}")
    manuals = await db.manuals.find({}, {"id": 1, "model_name": 1}).to_list(10)
    print(f"Recent manuals in DB:")
    for m in manuals:
        print(f"ID: {m.get('id')}, Name: {m.get('model_name')}")
    
    # Check if there are any queries
    query_count = await db.queries.count_documents({})
    print(f"Total queries in DB: {query_count}")
    
    if query_count > 0:
        last_query = await db.queries.find_one(sort=[("created_at", -1)])
        print(f"Last query: {last_query.get('question')}")
        print(f"Manual ID used: {last_query.get('manual_id')}")
        print(f"Response snippet: {last_query.get('response', '')[:50]}...")

if __name__ == "__main__":
    asyncio.run(check_db())
