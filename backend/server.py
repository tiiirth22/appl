from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException, Depends, Response, Cookie, Header
from contextlib import asynccontextmanager
from fastapi.responses import RedirectResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from qdrant_client import QdrantClient
import os
import logging
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime, timezone
from typing import Optional, List
import uuid

from auth import get_current_user, signup_user, login_user, require_admin, require_business_owner_or_admin

from models import (
    User, UserSession, UserSignUp, UserLogin, Manual, ManualCreate,
    Query, ChatResponse, ChatRequest, Feedback, FeedbackCreate,
    QRCode
)

# Optional imports - will be None if not available
try:
    from ingestion import DocumentProcessor
    from rag import RAGEngine
    from qr_handler import QRHandler
    ml_imports_available = True
    ml_import_error = None
except Exception as e:
    print(f"Warning: Some ML services not available for import: {e}")
    DocumentProcessor = None
    RAGEngine = None
    QRHandler = None
    ml_imports_available = False
    ml_import_error = str(e)

# Dependency injection helpers
async def get_db_current_user(session_token: Optional[str] = Cookie(None), authorization: Optional[str] = Header(None)):
    """Dependency: Get current user."""
    if db is None or not mongo_available:
        raise HTTPException(status_code=503, detail="Database not available")
    return await get_current_user(db, session_token, authorization)

async def get_db_admin_user(session_token: Optional[str] = Cookie(None), authorization: Optional[str] = Header(None)):
    """Dependency: Get current admin user."""
    if db is None or not mongo_available:
        raise HTTPException(status_code=503, detail="Database not available")
    return await require_admin(db, session_token, authorization)

async def get_db_business_user(session_token: Optional[str] = Cookie(None), authorization: Optional[str] = Header(None)):
    """Dependency: Get current business owner or admin user."""
    if db is None or not mongo_available:
        raise HTTPException(status_code=503, detail="Database not available")
    return await require_business_owner_or_admin(db, session_token, authorization)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'applianceiq_db')

# Qdrant configuration
qdrant_url = os.getenv("QDRANT_URL")
qdrant_api_key = os.getenv("QDRANT_API_KEY")
qdrant_collection = os.getenv("QDRANT_COLLECTION", "appliance_manuals")

# Global clients/services
client = None
db = None
mongo_available = False
qdrant_client = None
doc_processor = None
rag_engine = None
qr_handler = None
initialization_error = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    global client, db, mongo_available, qdrant_client, doc_processor, rag_engine, qr_handler
    
    print("Starting up ApplianceIQ API...")
    
    # Initialize MongoDB
    if mongo_url:
        try:
            client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
            await client.admin.command('ping')
            db = client[db_name]
            mongo_available = True
            print(f"✅ MongoDB connected to {db_name}")
        except Exception as e:
            print(f"❌ MongoDB connection failed: {e}")
            mongo_available = False
    
    # Initialize ML Services
    if ml_imports_available:
        qr_handler = QRHandler()
        if qdrant_url and qdrant_api_key:
            try:
                qdrant_client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key, timeout=30.0)
                # Check connection
                qdrant_client.get_collections()
                
                doc_processor = DocumentProcessor(qdrant_client, qdrant_collection)
                rag_engine = RAGEngine(qdrant_client, qdrant_collection)
                print("✅ Qdrant services initialized")
            except Exception as e:
                initialization_error = f"Qdrant initialization failed: {e}"
                print(f"❌ {initialization_error}")
        else:
            initialization_error = "Qdrant URL or API Key missing in .env"
            print(f"❌ {initialization_error}")
    else:
        initialization_error = f"ML dependencies missing: {ml_import_error}"
    
    yield
    
    # Shutdown logic
    print("Shutting down ApplianceIQ API...")
    if client:
        client.close()

# Create the main app
app = FastAPI(title="ApplianceIQ API", version="1.0.0", lifespan=lifespan)
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============= AUTH ENDPOINTS =============
@api_router.post("/auth/signup")
async def auth_signup(signup_data: UserSignUp):
    """Sign up a new user."""
    if not mongo_available or db is None:
        raise HTTPException(
            status_code=503, 
            detail="MongoDB not configured. Set MONGO_URL in backend/.env and restart server."
        )
    result = await signup_user(db, signup_data)
    return result

@api_router.post("/auth/login")
async def auth_login(login_data: UserLogin):
    """Log in a user."""
    if not mongo_available or db is None:
        raise HTTPException(
            status_code=503, 
            detail="MongoDB not configured. Set MONGO_URL in backend/.env and restart server."
        )
    result = await login_user(db, login_data)
    return result

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_db_current_user)):
    """Get current user info."""
    return current_user

@api_router.post("/auth/logout")
async def logout(response: Response, session_token: Optional[str] = Cookie(None)):
    """Logout user."""
    if mongo_available and db is not None and session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie("session_token")
    return {"message": "Logged out successfully"}

# ============= MANUAL ENDPOINTS =============
@api_router.post("/manuals/upload")
async def upload_manual(
    file: UploadFile = File(...),
    model_name: str = Form(...),
    version: str = Form(...),
    region: str = Form("global"),
    user_id: Optional[str] = Form(None),  # Admin can specify user_id
    current_user: dict = Depends(get_db_business_user)
):
    """Upload a manual file."""
    if not doc_processor:
        detail = "Ingestion service not available"
        if initialization_error:
            detail += f": {initialization_error}"
        raise HTTPException(status_code=503, detail=detail)
    
    # Validate file type
    file_ext = file.filename.split('.')[-1].lower()
    if file_ext not in ['pdf', 'png', 'jpg', 'jpeg']:
        raise HTTPException(status_code=400, detail="Unsupported file type")
    
    # Determine target user
    target_user_id = current_user["id"]
    if current_user.get("role") == "admin" and user_id:
        # Admin can upload for any user
        target_user_id = user_id
    elif current_user.get("role") == "business_owner":
        # Business owners can only upload for themselves
        target_user_id = current_user["id"]
    
    # Create manual record
    manual_id = str(uuid.uuid4())
    file_path = f"/tmp/{manual_id}.{file_ext}"
    
    # Save file
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # Create manual in DB
    manual = Manual(
        id=manual_id,
        user_id=target_user_id,
        model_name=model_name,
        version=version,
        region=region,
        file_path=file_path,
        file_type=file_ext,
        status="processing"
    )
    
    manual_dict = manual.model_dump()
    manual_dict['created_at'] = manual_dict['created_at'].isoformat()
    manual_dict['updated_at'] = manual_dict['updated_at'].isoformat()
    
    await db.manuals.insert_one(manual_dict)
    
    # Process document asynchronously
    try:
        chunks_count = await doc_processor.process_manual(manual_id, file_path, file_ext, db)
        
        # Generate QR code
        qr_data = qr_handler.generate_qr_code(manual_id, version)
        
        # Save QR code
        qr_code = QRCode(
            id=qr_data["qr_id"],
            manual_id=manual_id,
            short_url=qr_data["short_url"],
            payload=qr_data["payload"],
            signature=qr_data["payload"]["sig"]
        )
        
        qr_dict = qr_code.model_dump()
        qr_dict['created_at'] = qr_dict['created_at'].isoformat()
        await db.qr_codes.insert_one(qr_dict)
        
        # Update manual with QR code ID
        await db.manuals.update_one(
            {"id": manual_id},
            {"$set": {"qr_code_id": qr_data["qr_id"]}}
        )
        
        return {
            "manual_id": manual_id,
            "status": "completed",
            "chunks_count": chunks_count,
            "qr_code": {
                "id": qr_data["qr_id"],
                "url": qr_data["short_url"],
                "image": qr_data["image_base64"]
            }
        }
    except Exception as e:
        logger.error(f"Error processing manual: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/manuals")
async def get_manuals(current_user: dict = Depends(get_db_business_user)):
    """Get manuals based on user role."""
    if current_user.get("role") == "admin":
        # Admins see all manuals
        manuals = await db.manuals.find({}, {"_id": 0}).to_list(1000)
    else:
        # Business owners see only their manuals
        manuals = await db.manuals.find(
            {"user_id": current_user["id"]},
            {"_id": 0}
        ).to_list(1000)
    return {"manuals": manuals}

@api_router.get("/manuals/{manual_id}")
async def get_manual(manual_id: str, current_user: dict = Depends(get_db_business_user)):
    """Get specific manual."""
    if current_user.get("role") == "admin":
        manual = await db.manuals.find_one({"id": manual_id}, {"_id": 0})
    else:
        manual = await db.manuals.find_one(
            {"id": manual_id, "user_id": current_user["id"]},
            {"_id": 0}
        )
    
    if not manual:
        raise HTTPException(status_code=404, detail="Manual not found")
    
    return manual

@api_router.get("/manuals/{manual_id}/qr")
async def get_manual_qr(manual_id: str, current_user: dict = Depends(get_db_business_user)):
    """Get QR code image for a manual."""
    if current_user.get("role") == "admin":
        manual = await db.manuals.find_one({"id": manual_id}, {"_id": 0})
    else:
        manual = await db.manuals.find_one(
            {"id": manual_id, "user_id": current_user["id"]},
            {"_id": 0}
        )
    
    if not manual:
        raise HTTPException(status_code=404, detail="Manual not found")
    
    if not manual.get("qr_code_id"):
        raise HTTPException(status_code=404, detail="QR code not assigned to this manual")
    
    qr_code = await db.qr_codes.find_one({"id": manual["qr_code_id"]}, {"_id": 0})
    if not qr_code:
        raise HTTPException(status_code=404, detail="QR code record not found")
    
    qr_data = qr_handler.generate_qr_code(manual_id, manual["version"])
    
    return {
        "qr_id": manual["qr_code_id"],
        "url": qr_code["short_url"],
        "image": qr_data["image_base64"]
    }

@api_router.get("/admin/users")
async def get_users(current_user: dict = Depends(get_db_admin_user)):
    """Get all users (admin only)."""
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return {"users": users}

@api_router.post("/admin/users/{user_id}/assign-qr")
async def assign_qr_to_user(user_id: str, manual_id: str, current_user: dict = Depends(get_db_admin_user)):
    """Assign QR code to a user's manual (admin only)."""
    # Verify manual exists
    manual = await db.manuals.find_one({"id": manual_id}, {"_id": 0})
    if not manual:
        raise HTTPException(status_code=404, detail="Manual not found")
    
    # Generate QR code if not exists
    if not manual.get("qr_code_id"):
        qr_data = qr_handler.generate_qr_code(manual_id, manual["version"])
        
        qr_code = QRCode(
            id=qr_data["qr_id"],
            manual_id=manual_id,
            short_url=qr_data["short_url"],
            payload=qr_data["payload"],
            signature=qr_data["payload"]["sig"]
        )
        
        qr_dict = qr_code.model_dump()
        qr_dict['created_at'] = qr_dict['created_at'].isoformat()
        await db.qr_codes.insert_one(qr_dict)
        
        # Update manual
        await db.manuals.update_one(
            {"id": manual_id},
            {"$set": {"qr_code_id": qr_data["qr_id"]}}
        )
    
    return {"message": "QR code assigned successfully"}
@api_router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Chat endpoint for asking questions about a manual."""
    if not rag_engine:
        raise HTTPException(status_code=503, detail="RAG service not available - ML dependencies not installed")
    
    # Get manual info
    manual = await db.manuals.find_one({"id": request.manual_id}, {"_id": 0})
    if not manual:
        raise HTTPException(status_code=404, detail="Manual not found")
    
    # Generate answer
    result = await rag_engine.answer_question(request.manual_id, request.question)
    
    # Save query
    query = Query(
        manual_id=request.manual_id,
        qr_code_id=manual.get("qr_code_id", ""),
        question=request.question,
        answer=result["answer"],
        sources=result["sources"]
    )
    
    query_dict = query.model_dump()
    query_dict['created_at'] = query_dict['created_at'].isoformat()
    await db.queries.insert_one(query_dict)
    
    return ChatResponse(
        query_id=query.id,
        answer=result["answer"],
        sources=result["sources"],
        manual_info={
            "model_name": manual["model_name"],
            "version": manual["version"]
        }
    )

# ============= QR DETAILS & REDIRECT =============
@api_router.get("/qr-details/{qr_id}")
async def get_qr_details(qr_id: str):
    """Get manual details for a QR code."""
    qr_code = await db.qr_codes.find_one({"id": qr_id}, {"_id": 0})
    
    if not qr_code:
        raise HTTPException(status_code=404, detail="QR code not found")
    
    # Verify signature
    payload = qr_code["payload"].copy()
    signature = payload.pop("sig", "")
    
    if not qr_handler.verify_signature(payload, signature):
        raise HTTPException(status_code=400, detail="Invalid QR code signature")
    
    # Get manual info
    manual = await db.manuals.find_one({"id": qr_code["manual_id"]}, {"_id": 0})
    if not manual:
        raise HTTPException(status_code=404, detail="Manual not found")
    
    return {
        "manual_id": qr_code["manual_id"],
        "model_name": manual["model_name"],
        "version": manual["version"],
        "qr_id": qr_id
    }

@api_router.get("/device/{qr_id}")
async def redirect_to_chat(qr_id: str):
    """Redirect from QR code to chat interface (deprecated, frontend handles /device/:qrId)."""
    qr_code = await db.qr_codes.find_one({"id": qr_id}, {"_id": 0})
    
    if not qr_code:
        raise HTTPException(status_code=404, detail="QR code not found")
    
    manual_id = qr_code["manual_id"]
    return RedirectResponse(url=f"/chat?manual_id={manual_id}")

# ============= ANALYTICS ENDPOINTS =============
@api_router.get("/analytics/queries")
async def get_queries_analytics(current_user: dict = Depends(lambda: require_business_owner_or_admin(db))):
    """Get query analytics based on user role."""
    if current_user.get("role") == "admin":
        # Admins see all queries
        queries = await db.queries.find({}, {"_id": 0}).sort("created_at", -1).limit(100).to_list(100)
    else:
        # Business owners see queries for their manuals
        manuals = await db.manuals.find(
            {"user_id": current_user["id"]},
            {"id": 1, "_id": 0}
        ).to_list(1000)
        
        manual_ids = [m["id"] for m in manuals]
        
        queries = await db.queries.find(
            {"manual_id": {"$in": manual_ids}},
            {"_id": 0}
        ).sort("created_at", -1).limit(100).to_list(100)
    
    return {"queries": queries, "count": len(queries)}

# ============= FEEDBACK ENDPOINTS =============
@api_router.post("/feedback")
async def submit_feedback(feedback: FeedbackCreate):
    """Submit feedback for a query."""
    # Verify query exists
    query = await db.queries.find_one({"id": feedback.query_id})
    if not query:
        raise HTTPException(status_code=404, detail="Query not found")
    
    feedback_obj = Feedback(
        query_id=feedback.query_id,
        manual_id=query["manual_id"],
        rating=feedback.rating,
        comment=feedback.comment
    )
    
    feedback_dict = feedback_obj.model_dump()
    feedback_dict['created_at'] = feedback_dict['created_at'].isoformat()
    
    await db.feedback.insert_one(feedback_dict)
    
    return {"message": "Feedback submitted successfully"}

@api_router.get("/feedback")
async def get_feedback(current_user: dict = Depends(lambda: require_business_owner_or_admin(db))):
    """Get feedback based on user role."""
    if current_user.get("role") == "admin":
        # Admins see all feedback
        feedback_list = await db.feedback.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    else:
        # Business owners see feedback for their manuals
        manuals = await db.manuals.find(
            {"user_id": current_user["id"]},
            {"id": 1, "_id": 0}
        ).to_list(1000)
        
        manual_ids = [m["id"] for m in manuals]
        
        feedback_list = await db.feedback.find(
            {"manual_id": {"$in": manual_ids}},
            {"_id": 0}
        ).sort("created_at", -1).to_list(100)
    
    return {"feedback": feedback_list, "count": len(feedback_list)}

# ============= HEALTH CHECK =============
@api_router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "services": {
            "mongodb": "connected",
            "qdrant": "connected" if qdrant_client else "not configured",
            "rag": "ready" if rag_engine else "not configured",
            "ingestion": "ready" if doc_processor else "not configured"
        }
    }

# Include router
app.include_router(api_router)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[o.strip() for o in os.environ.get('CORS_ORIGINS', '*').split(',')],
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
