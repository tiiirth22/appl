from fastapi import FastAPI, APIRouter, UploadFile, File, Form, HTTPException, Depends, Response, Cookie, Header
from contextlib import asynccontextmanager
from fastapi.responses import RedirectResponse, JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta
from typing import Optional, List
import uuid
import httpx
import certifi

from dotenv import load_dotenv

from auth import get_current_user, signup_user, login_user, require_admin, require_business_owner_or_admin
from qr_handler import QRHandler
from ml_client import MLServiceClient, MLServiceError
from models import (
    User, UserSession, UserSignUp, UserLogin, Manual, ManualCreate,
    Query, ChatResponse, ChatRequest, Feedback, FeedbackCreate,
    QRCode
)

# Initialize logger
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Setup Cloudinary if available
try:
    import cloudinary
    import cloudinary.uploader
    # More robust check: require credentials to be present
    cloudinary_available = all([
        os.getenv("CLOUDINARY_CLOUD_NAME"),
        os.getenv("CLOUDINARY_API_KEY"),
        os.getenv("CLOUDINARY_API_SECRET")
    ]) or os.getenv("CLOUDINARY_URL") is not None
except Exception:
    cloudinary_available = False

# Dependency injection helpers
async def get_db_current_user(session_token: Optional[str] = Cookie(None), authorization: Optional[str] = Header(None)):
    """Dependency: Get current user."""
    if db is None or not mongo_available:
        raise HTTPException(status_code=503, detail="Database not available")
    return await get_current_user(db, session_token, authorization)

async def get_optional_user(session_token: Optional[str] = Cookie(None), authorization: Optional[str] = Header(None)):
    """Dependency: Get current user if authenticated, otherwise return None (for QR-based access)."""
    if db is None or not mongo_available:
        return None
    try:
        return await get_current_user(db, session_token, authorization)
    except Exception:
        return None

async def get_db_admin_user(session_token: Optional[str] = Cookie(None), authorization: Optional[str] = Header(None)):
    """Dependency: Get current admin user."""
    if db is None or not mongo_available:
        raise HTTPException(status_code=503, detail="Database not available")
    return await require_admin(db, session_token, authorization)

# Rate Limiter implementation
class RateLimiter:
    def __init__(self, db, limit: int = 5, window_seconds: int = 60):
        self.db = db
        self.limit = limit
        self.window = window_seconds

    async def check(self, user_id: str):
        if self.db is None: return True
        now = datetime.now(timezone.utc)
        start_period = (now - timedelta(seconds=self.window)).isoformat()
        
        # Clean old logs
        await self.db.rate_limits.delete_many({"timestamp": {"$lt": start_period}})
        
        # Count recent
        count = await self.db.rate_limits.count_documents({"user_id": user_id})
        if count >= self.limit:
            return False
        
        # Log this request
        await self.db.rate_limits.insert_one({"user_id": user_id, "timestamp": now.isoformat()})
        return True

from datetime import timedelta

async def get_db_business_user(session_token: Optional[str] = Cookie(None), authorization: Optional[str] = Header(None)):
    """Dependency: Get current business owner or admin user."""
    if db is None or not mongo_available:
        raise HTTPException(status_code=503, detail="Database not available")
    return await require_business_owner_or_admin(db, session_token, authorization)

# ============= CONFIGURATION =============
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB configuration
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'applianceiq_db')

# ML Service configuration
ml_service_url = os.environ.get('ML_SERVICE_URL', 'http://localhost:8001')

# Global clients
client = None
db = None
mongo_available = False
ml_client = MLServiceClient(ml_service_url)

# ============= LIFESPAN & STARTUP =============
@asynccontextmanager
async def lifespan(app: FastAPI):
    
    global client, db, mongo_available
    
    # Initialize MongoDB client WITHOUT verification (connection lazy on first use)
    if mongo_url:
        # Check for production misconfiguration
        is_production = os.environ.get("PORT") or os.environ.get("RENDER")
        if "localhost" in mongo_url or "127.0.0.1" in mongo_url:
            if is_production:
                logger.error("🛑 CRITICAL: MONGO_URL is set to localhost in production!")
                if os.environ.get("RENDER"):
                    logger.error("👉 ACTION REQUIRED: Add MONGO_URL to your Render Environment Variables.")
                elif os.environ.get("RAILWAY_STATIC_URL"):
                    logger.error("👉 ACTION REQUIRED: Add MONGO_URL to your Railway Variables dashboard.")
        try:
            # Use certifi for explicit CA verification (better for Railway/slim images)
            ca = certifi.where()
            client = AsyncIOMotorClient(
                mongo_url, 
                serverSelectionTimeoutMS=5000,
                tlsCAFile=ca
            )
            db = client[db_name]
            mongo_available = True
            safe_url = mongo_url.split('@')[-1] if '@' in mongo_url else mongo_url
            logger.info(f"[MongoDB] Client initialized with certifi CA (Target: {safe_url})")
        except Exception as e:
            # If client creation itself fails, log but don't block startup
            mongo_available = False
            logger.warning(f"[MongoDB] Client initialization failed: {str(e)}")
    else:
        mongo_available = False
        logger.error("🛑 CRITICAL: MONGO_URL is NOT configured in environment!")
        if os.environ.get("RENDER"):
            logger.error("👉 ACTION REQUIRED: Go to Render Dashboard > Environment and add MONGO_URL.")
    
    # Initialize Cloudinary (lightweight, non-blocking)
    if cloudinary_available:
        try:
            # Use explicit credentials if available, falling back to URL
            cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
            api_key = os.getenv("CLOUDINARY_API_KEY")
            api_secret = os.getenv("CLOUDINARY_API_SECRET")
            cloudinary_url = os.getenv("CLOUDINARY_URL")

            if cloud_name and api_key and api_secret:
                cloudinary.config(
                    cloud_name=cloud_name,
                    api_key=api_key,
                    api_secret=api_secret,
                    secure=True
                )
                logger.info(f"[Cloudinary] Configured with explicit credentials (Cloud: {cloud_name})")
            elif cloudinary_url:
                cloudinary.config(cloudinary_url=cloudinary_url, secure=True)
                logger.info("[Cloudinary] Configured via CLOUDINARY_URL")
            else:
                logger.warning("[Cloudinary] Configuration skipped: No credentials provided")
                mongo_available = False # Not really, but Cloudinary is not
        except Exception as e:
            logger.warning(f"[Cloudinary] Configuration failed: {str(e)}")
    
    # Log initialization status
    logger.info("[Startup] Connected to ML Service: " + ("Available" if ml_service_url else "Not configured"))
    logger.info("✓ API ready to handle requests (startup completed in <1 second)")
    
    yield
    
    # Shutdown logic
    logger.info("🛑 Shutting down ApplianceIQ API...")
    if client:
        client.close()
        logger.info("[MongoDB] Connection closed")
    logger.info("✓ Shutdown complete")

# Create the main app
app = FastAPI(title="ApplianceIQ API", version="1.0.0", lifespan=lifespan)

# Include router
# api_router prefix is set as "/api" earlier
# Routes are defined here...

# Root route - Redirects to /docs and provides a quick API welcome
@app.get("/", include_in_schema=False)
async def root():
    """Welcome to ApplianceIQ API - Redirects to Swagger UI."""
    return RedirectResponse(url="/docs")

api_router = APIRouter(prefix="/api")

@api_router.get("/welcome")
async def welcome():
    """Manual status check."""
    return {
        "message": "Welcome to ApplianceIQ API - Backend is LIVE",
        "docs": "/docs",
        "health": "/api/health",
        "endpoints": [
            {"path": route.path, "name": route.name} 
            for route in app.routes if hasattr(route, 'path')
        ]
    }

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
    
    # Note: Pinecone deletion handled by ML Service
    # Manual data will be cleaned up by ML Service when manual is accessed
            
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
    user_id: Optional[str] = Form(None),
    current_user: dict = Depends(get_db_business_user)
):
    """Upload a manual file and process via ML Service."""
    # Validate file type
    original_filename = file.filename
    file_ext = original_filename.split('.')[-1].lower()
    if file_ext not in ['pdf', 'png', 'jpg', 'jpeg']:
        raise HTTPException(status_code=400, detail="Unsupported file type. Use PDF or image.")
    
    # Determine target user
    target_user_id = current_user["id"]
    if current_user.get("role") == "admin" and user_id:
        target_user_id = user_id
    
    manual_id = str(uuid.uuid4())
    cloudinary_file_url = None
    
    try:
        # Read file content
        content = await file.read()
        
        # Upload to Cloudinary
        if cloudinary_available:
            try:
                res_type = "raw" if file_ext == "pdf" else "image"
                upload_result = cloudinary.uploader.upload(
                    content,
                    public_id=f"manual_{manual_id}",
                    folder="appliance_iq/manuals",
                    resource_type=res_type,
                    overwrite=True
                )
                cloudinary_file_url = upload_result.get("secure_url")
                
                if not cloudinary_file_url:
                    logger.error(f"[Cloudinary] Upload returned empty secure_url for manual {manual_id}")
                    # Try to get the URL from the response some other way
                    cloudinary_file_url = upload_result.get("url")
                
                if cloudinary_file_url:
                    logger.info(f"Uploaded to Cloudinary: {cloudinary_file_url}")
                else:
                    logger.error(f"[Cloudinary] Critical failure: No URL in upload result for {manual_id}. Result: {upload_result}")
            except Exception as e:
                logger.error(f"Cloudinary upload failed: {str(e)}", exc_info=True)
                # We'll catch this in the validation below
        else:
            logger.warning(f"Cloudinary not available for upload of manual {manual_id}")
        
        # Create manual record in DB
        manual = Manual(
            id=manual_id,
            user_id=target_user_id,
            model_name=model_name,
            version=version,
            region=region,
            cloudinary_url=cloudinary_file_url,
            file_type=file_ext,
            status="processing"
        )
        
        manual_dict = manual.model_dump()
        manual_dict['filename'] = original_filename
        manual_dict['created_at'] = manual_dict['created_at'].isoformat()
        manual_dict['updated_at'] = manual_dict['updated_at'].isoformat()
        await db.manuals.insert_one(manual_dict)
        
        # Validate that we have a valid file URL before calling ML Service
        if not cloudinary_file_url:
            logger.error(f"[Upload] ✗ Cloudinary file URL is None for manual {manual_id} — ML Service cannot process without a downloadable URL")
            await db.manuals.update_one(
                {"id": manual_id},
                {"$set": {"status": "failed", "error": "File upload to Cloudinary failed — no public URL"}}
            )
            raise HTTPException(
                status_code=500,
                detail="File upload failed: Could not generate a public URL for the manual. Check Cloudinary configuration."
            )
        
        # Call ML Service to process file
        try:
            ml_payload = {
                "manual_id": manual_id,
                "manual_name": model_name,
                "version": version,
                "file_url": cloudinary_file_url,
                "file_type": file_ext
            }
            logger.info(f"[Upload] Sending to ML Service: {ml_payload}")
            
            ml_response = await ml_client.process_manual(
                manual_id=manual_id,
                manual_name=model_name,
                version=version,
                file_url=cloudinary_file_url,
                file_type=file_ext
            )
            logger.info(f"[Upload] ✓ ML Service processing initiated for manual {manual_id}")
        except MLServiceError as e:
            logger.error(f"[Upload] ✗ ML Service error: {str(e)}")
            await db.manuals.update_one(
                {"id": manual_id},
                {"$set": {"status": "failed", "error": str(e)}}
            )
            raise HTTPException(status_code=503, detail=f"ML Service error: {str(e)}")
        
        # Generate QR code
        qr_handler = QRHandler()
        qr_data = qr_handler.generate_qr_code(manual_id, version)
        
        # Save QR code to DB
        qr_code = QRCode(
            id=qr_data["qr_id"],
            manual_id=manual_id,
            qr_url=qr_data["qr_url"],
            cloudinary_url=qr_data.get("cloudinary_url"),
            payload=qr_data["payload"],
            signature=qr_data["payload"]["sig"]
        )
        
        qr_dict = qr_code.model_dump()
        qr_dict['created_at'] = qr_dict['created_at'].isoformat()
        await db.qr_codes.insert_one(qr_dict)
        
        # Update manual with QR code
        await db.manuals.update_one(
            {"id": manual_id},
            {"$set": {"qr_code_id": qr_data["qr_id"]}}
        )
        
        return {
            "manual_id": manual_id,
            "status": "processing",
            "file_url": cloudinary_file_url,
            "qr_code": {
                "id": qr_data["qr_id"],
                "url": qr_data["qr_url"],
                "image": qr_data["cloudinary_url"] or qr_data["image_base64"]
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

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
    qr_handler = QRHandler()
    if not qr_handler:
        raise HTTPException(status_code=503, detail="QR code service not available")
    
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
        # Fallback: Generate the QR record if missing but assigned (data integrity fix)
        logger.warning(f"QR code record {manual['qr_code_id']} missing for manual {manual_id}. Auto-regenerating.")
        qr_data = qr_handler.generate_qr_code(manual_id, manual.get("version", "1.0"))
        
        # Re-verify/Update the manual's qr_code_id if it changed
        await db.manuals.update_one(
            {"id": manual_id},
            {"$set": {"qr_code_id": qr_data["qr_id"]}}
        )
        
        # Create the record
        qr_code_doc = {
            "id": qr_data["qr_id"],
            "manual_id": manual_id,
            "qr_url": qr_data["qr_url"],
            "cloudinary_url": qr_data.get("cloudinary_url"),
            "payload": qr_data["payload"],
            "signature": qr_data["payload"]["sig"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.qr_codes.insert_one(qr_code_doc)
        
        return {
            "qr_id": qr_data["qr_id"],
            "url": qr_data["qr_url"],
            "image": qr_data["image_base64"]
        }
    
    # Regenerate QR image for the manual
    qr_image = qr_handler.regenerate_qr_image(manual_id)
    
    return {
        "qr_id": manual["qr_code_id"],
        "url": qr_code.get("qr_url"),
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
        qr_handler = QRHandler()
        qr_data = qr_handler.generate_qr_code(manual_id, manual["version"])
        
        qr_code = QRCode(
            id=qr_data["qr_id"],
            manual_id=manual_id,
            qr_url=qr_data["qr_url"],
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

@api_router.post("/chat")
async def chat(request: ChatRequest, current_user: Optional[dict] = Depends(get_optional_user)):
    """Chat endpoint - Query manual using ML Service.
    
    Returns a streaming response compatible with the frontend's getReader() protocol:
    1. First line: __METADATA__:{sources, confidence} 
    2. Remaining: answer text streamed as chunks
    """
    from fastapi.responses import StreamingResponse
    import json as _json
    
    # Access Control
    if current_user:
        # Authenticated user - verify ownership (admins can access all)
        if current_user.get("role") != "admin":
            manual = await db.manuals.find_one({"id": request.manual_id, "user_id": current_user["id"]})
            if not manual:
                raise HTTPException(status_code=403, detail="Access denied")
    else:
        # Unauthenticated access — must have a valid QR code
        if not request.qr_id:
            raise HTTPException(
                status_code=403,
                detail="Authentication required. Please log in or scan a QR code."
            )
        qr_record = await db.qr_codes.find_one({"id": request.qr_id, "manual_id": request.manual_id})
        if not qr_record:
            raise HTTPException(status_code=403, detail="Invalid QR code or manual ID")
    
    # Call ML Service
    try:
        logger.info(f"[Chat] Query: manual_id={request.manual_id}, question='{request.question[:80]}...', user={'authenticated' if current_user else 'qr-based'}")
        
        ml_response = await ml_client.query_manual(
            manual_id=request.manual_id,
            question=request.question,
            top_k=request.top_k
        )
        
        # Log query to DB
        query = Query(
            id=str(uuid.uuid4()),
            manual_id=request.manual_id,
            question=request.question,
            user_id=current_user["id"] if current_user else None,
            response=ml_response.get("answer", ""),
            confidence=ml_response.get("confidence", 0.0)
        )
        
        query_dict = query.model_dump()
        query_dict['created_at'] = query_dict['created_at'].isoformat()
        await db.queries.insert_one(query_dict)
        
        # Build streaming response matching frontend getReader() protocol
        answer_text = ml_response.get("answer", "No answer available.")
        sources = ml_response.get("sources", [])
        confidence = ml_response.get("confidence", 0.0)
        
        async def stream_response():
            # 1. Send metadata line first
            metadata = _json.dumps({"sources": sources, "confidence": confidence})
            yield f"__METADATA__:{metadata}\n"
            # 2. Stream the answer text
            yield answer_text
        
        return StreamingResponse(stream_response(), media_type="text/plain")
    
    except MLServiceError as e:
        logger.error(f"[Chat] ML Service error: {str(e)}")
        raise HTTPException(status_code=503, detail=f"Service error: {str(e)}")

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
    qr_handler = QRHandler()
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
async def get_queries_analytics(current_user: dict = Depends(get_db_business_user)):
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
async def get_feedback(current_user: dict = Depends(get_db_business_user)):
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

# ============= DEBUG & DIAGNOSTIC ENDPOINTS =============
@api_router.get("/debug/qr-test/{manual_id}")
async def debug_qr_test(manual_id: str):
    """Debug endpoint: Test QR code generation independently.
    
    Tests the full QR pipeline (image generation + Cloudinary upload)
    without requiring authentication or a real manual record.
    """
    qr_handler = QRHandler()
    result = qr_handler.generate_qr_code_safe(manual_id, "debug-v1")
    return {
        "test": "qr_generation",
        "manual_id": manual_id,
        "result": result,
    }


@api_router.get("/debug/ml-test")
async def debug_ml_test():
    """Debug endpoint: Test ML service connectivity with a hardcoded valid URL.
    
    Bypasses QR/Cloudinary entirely to verify the ML + Pinecone pipeline
    works independently. Uses a known-good test URL.
    """
    # Hardcoded test: verify ML service is reachable
    test_results = {
        "ml_service_url": ml_service_url,
        "ml_service_reachable": False,
        "health_response": None,
        "query_test": None,
    }
    
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            # 1. Check ML service health
            health_resp = await client.get(f"{ml_service_url}/health")
            test_results["ml_service_reachable"] = True
            test_results["health_response"] = health_resp.json()
            
            # 2. Try a test query against Pinecone (use a dummy manual_id)
            try:
                query_resp = await client.post(
                    f"{ml_service_url}/query",
                    json={
                        "manual_id": "test-debug-manual",
                        "question": "What is this appliance?",
                        "top_k": 1
                    },
                    timeout=30
                )
                test_results["query_test"] = {
                    "status_code": query_resp.status_code,
                    "response": query_resp.json() if query_resp.status_code < 500 else query_resp.text[:500]
                }
            except Exception as e:
                test_results["query_test"] = {"error": str(e)}
                
    except Exception as e:
        test_results["error"] = str(e)
        logger.error(f"[Debug] ML service test failed: {e}")
    
    return test_results


# ============= HEALTH CHECK =============
@api_router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "services": {
            "mongodb": "connected" if mongo_available else "not configured",
            "ml_service": "configured" if ml_service_url else "not configured",
            "qr_handler": "available",
            "cloudinary": "available" if cloudinary_available else "not configured"
        }
    }

# Include router
app.include_router(api_router)

# Add CORS middleware
cors_origins_str = os.environ.get('CORS_ORIGINS', '')
if cors_origins_str:
    allowed_origins = [o.strip() for o in cors_origins_str.split(',')]
else:
    # If credentials are allowed, we CANNOT use "*" for Origins
    # Add common origins including production as fallbacks
    allowed_origins = [
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "https://appliance-iq.vercel.app",
        "https://appliance-iq.vercel.app/",
        "https://www.appliance-iq.vercel.app",
        "https://www.appliance-iq.vercel.app/",
        "https://applianceiq-production.up.railway.app",
        "https://applianceiq-production.up.railway.app/",
        "https://upbeat-contentment-production-ed5c.up.railway.app",
        "https://upbeat-contentment-production-ed5c.up.railway.app/"
    ]

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Incoming request: {request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

@app.exception_handler(405)
async def method_not_allowed_handler(request: Request, exc):
    logger.warning(f"Method Not Allowed: {request.method} {request.url.path}")
    return JSONResponse(
        status_code=405,
        content={
            "detail": f"Method {request.method} not allowed for this endpoint. Check if you are sending POST to a GET-only route or if there is a trailing slash issue.",
            "method": request.method,
            "path": request.url.path
        }
    )

# Global Error Handler for 500s to see them in logs
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global error caught: {str(exc)}", exc_info=True)
    
    # Manually add CORS headers to ensure the browser doesn't block the error response
    origin = request.headers.get("origin")
    
    response = Response(
        content=f"Internal Server Error: {str(exc)}",
        status_code=500
    )
    
    # If we have an origin, echo it back (this is generally safe for error responses)
    # Browsers require specific origin if credentials are included
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    
    return response

if __name__ == "__main__":
    import uvicorn
    # Print a clear message about where the API is running
    print("\n" + "="*50)
    print("ApplianceIQ API is starting...")
    print(f"Docs: http://localhost:8000/docs")
    print(f"Health: http://localhost:8000/api/health")
    print("="*50 + "\n")
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
