import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

async def check_qr_db():
    load_dotenv('backend/.env')
    mongo_url = os.getenv('MONGO_URL')
    db_name = os.getenv('DB_NAME', 'applianceiq_db')
    
    print(f"Connecting to {db_name}...")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    qr = await db.qr_codes.find_one({})
    print("--- FIRST QR CODE IN DB ---")
    print(qr)
    
    manual = await db.manuals.find_one({})
    print("\n--- FIRST MANUAL IN DB ---")
    print(manual)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_qr_db())
