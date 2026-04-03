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

async def check_manuals():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print(f"Checking for manual statuses...")
    manuals = await db.manuals.find({}, {"id": 1, "model_name": 1, "status": 1, "error": 1}).to_list(100)
    for m in manuals:
        print(f"ID: {m.get('id')}, Name: {m.get('model_name')}, Status: {m.get('status')}")
        if m.get('error'):
            print(f"  Error: {m.get('error')}")

if __name__ == "__main__":
    asyncio.run(check_manuals())
