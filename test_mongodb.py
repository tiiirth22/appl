"""
Test MongoDB Connection
Run this to verify MongoDB is working
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys

async def test_mongodb():
    try:
        # Test local connection
        print("Testing MongoDB connection...")
        print("Connecting to: mongodb://localhost:27017")
        
        client = AsyncIOMotorClient("mongodb://localhost:27017", serverSelectionTimeoutMS=5000)
        
        # Try to get server info
        server_info = await client.admin.command('ping')
        print("✅ MongoDB is running and connected!")
        print(f"Server response: {server_info}")
        
        # List databases
        databases = await client.admin.command('listDatabases')
        print(f"Databases found: {len(databases.get('databases', []))}")
        
        # Try to access applianceiq database
        db = client["applianceiq_db"]
        print(f"✅ Connected to 'applianceiq_db' database")
        
        return True
    except Exception as e:
        print(f"❌ MongoDB connection failed!")
        print(f"Error: {e}")
        print("\n" + "="*50)
        print("To fix this, choose ONE option:")
        print("="*50)
        print("\n1. START MONGODB LOCALLY (Windows):")
        print("   - Open PowerShell as Administrator")
        print("   - Run: net start MongoDB")
        print("   - Then run this script again")
        print("\n2. USE MONGODB ATLAS CLOUD (RECOMMENDED):")
        print("   - Go to: https://www.mongodb.com/cloud/atlas")
        print("   - Create free account")
        print("   - Create cluster and get connection string")
        print("   - Update backend/.env with the connection string")
        print("   - Restart backend server")
        print("\n" + "="*50)
        return False

async def test_with_atlas(connection_string):
    """Test connection with MongoDB Atlas"""
    try:
        print(f"\nTesting MongoDB Atlas connection...")
        client = AsyncIOMotorClient(connection_string, serverSelectionTimeoutMS=5000)
        server_info = await client.admin.command('ping')
        print("✅ MongoDB Atlas connection successful!")
        return True
    except Exception as e:
        print(f"❌ MongoDB Atlas connection failed: {e}")
        return False

if __name__ == "__main__":
    print("ApplianceIQ MongoDB Connection Test\n")
    print("="*50)
    
    # Test local connection first
    result = asyncio.run(test_mongodb())
    
    if not result:
        print("\n💡 Hint: If using MongoDB Atlas, update the connection string in backend/.env")
        sys.exit(1)
    else:
        print("\n✅ All good! MongoDB is ready for ApplianceIQ")
        sys.exit(0)
