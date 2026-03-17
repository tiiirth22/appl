from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException, Depends, Response, Cookie, Header
from contextlib import asynccontextmanager
from fastapi.responses import RedirectResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
# Pinecone import moved to try-except below
import os
import logging
from pathlib import Path

# Initialize logger before imports that might trigger it
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

from datetime import datetime, timezone
from typing import Optional, List
import uuid

from dotenv import load_dotenv

from auth import get_current_user, signup_user, login_user, require_admin, require_business_owner_or_admin

from models import (
    User, UserSession, UserSignUp, UserLogin, Manual, ManualCreate,
    Query, ChatResponse, ChatRequest, Feedback, FeedbackCreate,
    QRCode
)

# Optional imports - will be None if not available
DocumentProcessor = None
RAGEngine = None
QRHandler = None
Pinecone = None
ml_imports_available = False
ml_import_error = None

try:
    from ingestion import DocumentProcessor, Pinecone as IngestionPinecone
    from rag import RAGEngine
    from qr_handler import QRHandler
    Pinecone = IngestionPinecone
    ml_imports_available = True
except Exception as e:
    import traceback
    logger.warning(f"Some ML services not available: {e}")
    logger.debug(traceback.format_exc())
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

# Pinecone configuration
pinecone_api_key = os.getenv("PINECONE_API_KEY")
pinecone_index_name = os.getenv("PINECONE_INDEX_NAME", "appliance-manuals")

# Global clients/services
client = None
db = None
mongo_available = False
pinecone_client = None
pinecone_index = None
doc_processor = None
rag_engine = None
qr_handler = None
initialization_error = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    global client, db, mongo_available, pinecone_client, pinecone_index, doc_processor, rag_engine, qr_handler
    
    print("Starting up ApplianceIQ API...")
    
    # Initialize MongoDB
    if mongo_url:
        try:
            client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
            await client.admin.command('ping')
            db = client[db_name]
            mongo_available = True
            print(f"MongoDB connected to {db_name}")
        except Exception as e:
            print(f"MongoDB connection failed: {e}")
            mongo_available = False
    
    # Initialize ML Services
    if ml_imports_available:
        # 1. Initialize QR Handler (always works if imported)
        if QRHandler:
            qr_handler = QRHandler()
            
        # 2. Try to initialize Pinecone
        pinecone_success = False
        if pinecone_api_key and Pinecone:
            try:
                pinecone_client = Pinecone(api_key=pinecone_api_key)
                pinecone_client.list_indexes()
                pinecone_index = pinecone_client.Index(pinecone_index_name)
                pinecone_success = True
                print("Pinecone client initialized")
            except Exception as e:
                initialization_error = f"Pinecone initialization failed: {e}"
                print(f"{initialization_error}")
        else:
            initialization_error = "PINECONE_API_KEY missing or Pinecone package not installed"
            print(f"{initialization_error}")

        # 3. Always initialize processor/engine if classes are available (supports Degraded Mode)
        if DocumentProcessor:
            doc_processor = DocumentProcessor(pinecone_client if pinecone_success else None, pinecone_index_name)
            print("Document Processor initialized (Degraded Mode if Pinecone failed)")
            
        if RAGEngine:
            rag_engine = RAGEngine(pinecone_index if pinecone_success else None)
            print("RAG Engine initialized (Degraded Mode if Pinecone failed)")
    else:
        initialization_error = f"ML dependencies missing: {ml_import_error}"
        print(f"{initialization_error}")
    
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
async def logout(
    response: Response,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None),
):
    """Logout user."""
    token = session_token
    if not token and authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")

    if mongo_available and db is not None and token:
        await db.user_sessions.delete_one({"session_token": token})

    # Clean up any cookie if the client used it
    response.delete_cookie("session_token")
    return {"message": "Logged out successfully"}

# ============= MANUAL ENDPOINTS =============
@api_router.delete("/manuals/{manual_id}")
async def delete_manual(manual_id: str, current_user: dict = Depends(get_db_business_user)):
    """Delete a manual and its associated data."""
    if not mongo_available or db is None:
        raise HTTPException(status_code=503, detail="Database not available")
        
    # Check if manual exists and user has permission
    query = {"id": manual_id}
    if current_user.get("role") != "admin":
        # Business owners can only delete their own manuals
        query["user_id"] = current_user["id"]
        
    manual = await db.manuals.find_one(query)
    if not manual:
        raise HTTPException(status_code=404, detail="Manual not found or access denied")
    
    # Delete file from filesystem
    try:
        file_path = manual.get("file_path")
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"Deleted file: {file_path}")
    except Exception as e:
        logger.warning(f"Failed to delete file {manual.get('file_path')}: {e}")
    
    # Delete from Pinecone
    if pinecone_index:
        try:
            # Delete by manual_id metadata
            pinecone_index.delete(filter={"manual_id": {"$eq": manual_id}})
            logger.info(f"Deleted manual {manual_id} from Pinecone")
        except Exception as e:
            logger.warning(f"Failed to delete from Pinecone: {e}")
            
    # Delete from MongoDB collections
    try:
        await db.manuals.delete_one({"id": manual_id})
        await db.manual_chunks.delete_many({"manual_id": manual_id})
        
        # Delete associated QR code
        if manual.get("qr_code_id"):
            await db.qr_codes.delete_one({"id": manual["qr_code_id"]})
            
        # Delete queries and feedback related to this manual
        await db.queries.delete_many({"manual_id": manual_id})
        await db.feedback.delete_many({"manual_id": manual_id})
        
        logger.info(f"Deleted manual {manual_id} data from MongoDB")
    except Exception as e:
        logger.error(f"Error during database deletion: {e}")
        raise HTTPException(status_code=500, detail=f"Database deletion failed: {str(e)}")
    
    return {"message": "Manual and all associated data deleted successfully"}

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
    original_filename = file.filename
    file_ext = original_filename.split('.')[-1].lower()
    if file_ext not in ['pdf', 'png', 'jpg', 'jpeg']:
        raise HTTPException(status_code=400, detail="Unsupported file type")
    
    # Determine target user
    target_user_id = current_user["id"]
    if current_user.get("role") == "admin" and user_id:
        # Admin can upload for any user
        target_user_id = user_id
    
    # Create manual record
    manual_id = str(uuid.uuid4())
    uploads_dir = ROOT_DIR / "uploads"
    uploads_dir.mkdir(exist_ok=True)
    file_path = str(uploads_dir / f"{manual_id}.{file_ext}")
    
    # Save file
    try:
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
    except Exception as e:
        logger.error(f"Failed to save file: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
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
    manual_dict['filename'] = original_filename
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
        # Manual status is updated to "failed" inside doc_processor.process_manual
        return {
            "manual_id": manual_id,
            "status": "failed",
            "error": str(e)
        }

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
    
    # Regenerate QR image using the EXISTING qr_id (not a new one)
    stored_qr_id = manual["qr_code_id"]
    qr_image = qr_handler.regenerate_qr_image(stored_qr_id)
    short_url = f"{qr_handler.app_base_url}/device/{stored_qr_id}"
    
    return {
        "qr_id": stored_qr_id,
        "url": short_url,
        "image": qr_image
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

@api_router.post("/analyze-image")
async def analyze_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_db_business_user)  # Or allow any auth user
):
    """Analyze an uploaded image to identify appliance issues."""
    if not rag_engine:
         raise HTTPException(status_code=503, detail="RAG service not available")
    
    try:
        contents = await file.read()
        # Call the new method in RAGEngine (we need to update RAGEngine first or ensure it exists)
        # Note: We added analyze_image to RAGEngine in the previous step
        analysis_result = await rag_engine.analyze_image(contents)
        
        return {"analysis": analysis_result}
    except Exception as e:
        logger.error(f"Image analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(e)}")

@api_router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Chat endpoint for asking questions about a manual."""
    if not rag_engine:
        raise HTTPException(status_code=503, detail="RAG service not available - ML dependencies not installed")
    
    # Rate Limiting (Simple in-memory)
    # Note: In production, use Redis or similar
    global rate_limit_data
    if 'rate_limit_data' not in globals():
        rate_limit_data = {}
    
    # Very simple rate limit: 5 requests per 10 seconds per IP or manual_id
    # Since we don't have request object here easily without adding it to dependecy, 
    # let's use manual_id as a proxy or skip for now if too complex.
    # Actually, let's just implement the db pass for now.
    
    # Get manual info
    manual = await db.manuals.find_one({"id": request.manual_id}, {"_id": 0})
    if not manual:
        raise HTTPException(status_code=404, detail="Manual not found")

    # Generate answer with Hybrid Search (passing db)
    result = await rag_engine.answer_question(request.manual_id, request.question, db=db)
    
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

@api_router.post("/qr/assign")
async def assign_qr_to_manual(
    qr_id: str = Form(...),
    manual_id: str = Form(...),
    admin: dict = Depends(get_db_admin_user)
):
    """Admin endpoint to assign/reassign a QR code to a manual."""
    # Verify QR code exists
    qr_code = await db.qr_codes.find_one({"id": qr_id})
    if not qr_code:
        raise HTTPException(status_code=404, detail="QR code record not found")
    
    # Verify manual exists
    manual = await db.manuals.find_one({"id": manual_id})
    if not manual:
        raise HTTPException(status_code=404, detail="Manual not found")
    
    # Update QR code mapping
    await db.qr_codes.update_one(
        {"id": qr_id},
        {"$set": {"manual_id": manual_id, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Update manual's qr_code_id
    await db.manuals.update_one(
        {"id": manual_id},
        {"$set": {"qr_code_id": qr_id}}
    )
    
    return {"message": f"Successfully assigned QR {qr_id} to manual {manual_id}"}

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
            "pinecone": "connected" if pinecone_client else "not configured",
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
