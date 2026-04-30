# ApplianceIQ Quick Start Guide

## Prerequisites
- Python 3.8+
- Node.js 14+
- MongoDB (recommended but optional for basic testing)
- npm or yarn

## Quick Setup & Run

### 1. Backend Setup (Python)

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/Scripts/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Verify imports (optional but recommended)
python test_imports.py

# Expected output:
# All critical components imported successfully!
# System is ready for testing.
```

### 2. Frontend Setup (Node.js)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env.local for backend URL
echo "REACT_APP_BACKEND_URL=http://localhost:8000" > .env.local

# On Windows PowerShell:
# Add-Content -Path .env.local -Value "REACT_APP_BACKEND_URL=http://localhost:8000"
```

**Terminal 1 - ML Service (Port 8001):**
```bash
cd ml_service
# Activation: .\venv\Scripts\activate
python server.py
```

**Terminal 2 - Backend Server (Port 8000):**
```bash
cd backend
# Activation: .\venv\Scripts\activate
python server.py
```

**Terminal 3 - Frontend Dev Server (Port 3000):**
```bash
cd frontend
npm start
```

Expected output:
```
Compiled successfully!
You can now view applianceiq in the browser.
Local: http://localhost:3000
```

### 4. Test the Application

1. **Open Browser**: http://localhost:3000
2. **Create Account**:
   - Click "Sign Up"
   - Enter email, name, password
   - Select role: "business_owner" (for testing) or "admin" (for admin features)
   - Click "Register"

3. **Login**:
   - Use credentials from signup
   - Should redirect to appropriate dashboard

4. **Test Dashboard**:
   - Admin dashboard: See all users and manuals
   - Business owner dashboard: See personal manuals and QR codes

## Environment Variables

### Backend (.env)
```dotenv
# Required
MONGO_URL=mongodb://localhost:27017
DB_NAME=applianceiq_db

# Optional (for advanced features)
PINECONE_API_KEY=your-api-key
PINECONE_INDEX_NAME=appliance-manuals
PINECONE_ENVIRONMENT=us-east-1
PINECONE_CLOUD=aws

# Optional (QR code settings)
QR_SECRET_KEY=your-secret-key
APP_BASE_URL=http://localhost:3000

# Unified ML Service
ML_SERVICE_URL=http://localhost:8001
INGESTION_SERVICE_URL=http://localhost:8001

# Optional (CORS)
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

### Frontend (.env.local)
```
REACT_APP_BACKEND_URL=http://localhost:8000
```

## Troubleshooting

### Issue: "MONGO_URL not provided"
**Solution**: Add to backend/.env:
```
MONGO_URL=mongodb://localhost:27017
DB_NAME=applianceiq_db
```

#### Using MongoDB Atlas Cloud (Recommended):
1. Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster and a database user
3. Allow access from your IP in Network Access
4. Use connection string: `MONGO_URL="mongodb+srv://user:pass@cluster.mongodb.net/dbname"`

#### Using Local MongoDB:
1. Install MongoDB Community Edition
2. Start the service: `net start MongoDB` (Windows)
3. Use connection string: `MONGO_URL="mongodb://localhost:27017"`

### Issue: Backend won't start
**Solution**: Check if port 8000 is in use:
```bash
# Windows
netstat -ano | findstr :8000

# macOS/Linux
lsof -i :8000
```

### Issue: Frontend can't reach backend
**Solution**: Ensure .env.local in frontend has correct backend URL:
```
REACT_APP_BACKEND_URL=http://localhost:8000
```

### Issue: "ML services not available"
**This is normal** - Core auth and dashboards work without ML.
To enable RAG features, install tf-keras:
```bash
pip install tf-keras
```

## API Endpoints Quick Reference

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### User/Manual Management
- `GET /api/manuals` - List user's manuals
- `POST /api/manuals/upload` - Upload manual (requires auth)
- `GET /api/admin/users` - List all users (admin only)

### System Status
- `GET /api/health` - Check service availability

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend compiles without errors
- [ ] Can sign up new user
- [ ] Can login with credentials
- [ ] Admin user sees admin dashboard
- [ ] Business owner user sees business owner dashboard
- [ ] Can navigate between pages
- [ ] Backend log shows requests

## Architecture Overview

```
ApplianceIQ
├── Backend (FastAPI)
│   ├── Authentication (first-party, bcrypt)
│   ├── Role-based access control
│   ├── REST API endpoints
│   └── MongoDB integration
│
├── Frontend (React)
│   ├── Login/Signup pages
│   ├── Role-based dashboards
│   ├── Manual management
│   └── Chat interface
│
└── Optional Services
    ├── Document processing (PDF/images)
    ├── RAG (vector search + generation)
    └── QR code generation
```

## Next Steps

After successful startup:

1. **Test Authentication** - Create admin and business owner accounts
2. **Test Data Isolation** - Verify business owners can't see each other's data
3. **Setup MongoDB** - Store data persistently
4. **Enable ML Services** - Install tf-keras, test document upload
5. **QR Codes** - Test QR generation and assignment
6. **Customer Chatbot** - Test QR-based public access

## Support

Check these files for more information:
- `IMPLEMENTATION_STATUS.md` - Detailed implementation status
- `backend/models.py` - Data model definitions
- `backend/auth.py` - Authentication functions
- `frontend/src/App.js` - Frontend routing setup

