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

async def check_id():
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    target_id = "e0fe862d-7c29-41d6-8a54-0ada1bd017fa"
    print(f"Searching for Manual ID: {target_id}")
    manual = await db.manuals.find_one({"id": target_id})
    if manual:
        print(f"Found manual: {manual.get('model_name')}, created_at: {manual.get('created_at')}")
    else:
        print("Manual ID NOT found in DB.")

if __name__ == "__main__":
    asyncio.run(check_id())
