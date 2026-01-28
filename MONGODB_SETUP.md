# MongoDB Setup Guide for ApplianceIQ

## Option 1: MongoDB Atlas Cloud (RECOMMENDED FOR PRODUCTION)

### Steps:
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up (free tier available)
3. Create a new project and cluster
4. In "Database Access", create a user:
   - Username: `applianceiq`
   - Password: (generate secure password)
5. In "Network Access", add your IP (or 0.0.0.0/0 for testing)
6. Go to "Clusters" → "Connect" → "Drivers"
7. Copy the connection string (looks like):
   ```
   mongodb+srv://applianceiq:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
8. Replace PASSWORD with your password
9. Update `.env` file:
   ```
   MONGO_URL="mongodb+srv://applianceiq:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority"
   ```

### Advantages:
- ✅ Works everywhere (cloud-based)
- ✅ Automatic backups
- ✅ Production-ready
- ✅ Free tier available (500MB)

---

## Option 2: MongoDB Community Local (DEVELOPMENT ONLY)

### Steps:

#### A. Windows Installation (if not already installed):
1. Download from: https://www.mongodb.com/try/download/community
2. Run installer
3. Choose "Complete" installation
4. Let it install as Windows Service (MongoDB)

#### B. Start MongoDB Service:
```powershell
# Option 1: Via PowerShell (as Admin)
net start MongoDB

# Option 2: Via Services (Win+R → services.msc) → Find MongoDB → Right-click → Start

# Option 3: Manual (if service not set up)
cd "C:\Program Files\MongoDB\Server\<version>\bin"
mongod.exe --dbpath "C:\data\db"
```

#### C. Verify it's running:
```bash
mongosh
# Should connect to: test>
```

#### D. Update `.env` file:
```
MONGO_URL="mongodb://localhost:27017"
# or with authentication:
MONGO_URL="mongodb://admin:password123@localhost:27017"
```

### Advantages:
- ✅ No internet needed
- ✅ Full control locally
- ✅ Good for development/testing

### Disadvantages:
- ❌ Only works on your machine
- ❌ No automatic backups
- ❌ Manual management needed

---

## Current Configuration

Your `.env` is set to:
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="applianceiq_db"
```

This expects MongoDB on localhost. To use it:

### Quick Test:
```bash
# In project root
cd backend
python

# In Python:
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio

async def test():
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    print(client.server_info())

asyncio.run(test())
```

---

## Troubleshooting

### Connection Refused (localhost:27017)?
- MongoDB not running locally
- Solution: Use MongoDB Atlas cloud OR start local MongoDB service

### Authentication Failed?
- Wrong credentials
- User not created in Atlas
- Solution: Verify username/password in connection string

### Network Timeout?
- MongoDB Atlas firewall issue
- Solution: Add your IP to "Network Access" in Atlas

---

## Recommendation

**For Development**: Use **MongoDB Atlas Cloud**
- No local installation hassle
- Works with authentication
- Free tier is sufficient
- Can be accessed from frontend too

**For Production**: Use **MongoDB Atlas Cloud** with proper security settings

---

## Next Steps

1. Choose your MongoDB setup:
   - [ ] Option 1: MongoDB Atlas Cloud (recommended)
   - [ ] Option 2: MongoDB Community Local

2. Get connection string

3. Update `.env` with connection string

4. Restart backend server

5. Run tests again
