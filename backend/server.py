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
    import cloudinary
    import cloudinary.uploader
    Pinecone = IngestionPinecone
    ml_imports_available = True
except Exception as e:
    import traceback
    logger.warning(f"Some production services not available: {e}")
    logger.debug(traceback.format_exc())
    ml_import_error = str(e)

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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'applianceiq_db')

# Pinecone configuration
pinecone_api_key = os.getenv("PINECONE_API_KEY")
pinecone_index_name = os.getenv("PINECONE_INDEX_NAME", "appliance-manuals")

# Global clients/services - Lazy initialization pattern
client = None
db = None
mongo_available = False

# These will be initialized lazily (on first use)
_pinecone_client = None
_pinecone_index = None
_doc_processor = None
_rag_engine = None
_qr_handler = None

# Initialization state tracking
_pinecone_initialized = False
_doc_processor_initialized = False
_rag_engine_initialized = False
_qr_handler_initialized = False
_initialization_errors = {}

import asyncio
import threading

# Lock for thread-safe lazy initialization
_init_lock = threading.Lock()

def _log_initialization(service_name: str, success: bool, message: str = ""):
    """Log initialization events."""
    status = "✓" if success else "✗"
    msg = f"[{service_name}] {status} {message}" if message else f"[{service_name}] {status}"
    if success:
        logger.info(msg)
    else:
        logger.warning(msg)

def get_qr_handler():
    """Lazy initialization for QR Handler."""
    global _qr_handler, _qr_handler_initialized
    
    if _qr_handler is not None:
        return _qr_handler
    
    if _qr_handler_initialized:
        return None  # Already tried and failed
    
    with _init_lock:
        if _qr_handler is not None:
            return _qr_handler
        
        if _qr_handler_initialized:
            return None
        
        try:
            if QRHandler:
                _qr_handler = QRHandler()
                _log_initialization("QRHandler", True, "Initialized on-demand")
            else:
                _log_initialization("QRHandler", False, "QRHandler class not available")
        except Exception as e:
            _initialization_errors["qr_handler"] = str(e)
            _log_initialization("QRHandler", False, f"Failed: {str(e)}")
        finally:
            _qr_handler_initialized = True
    
    return _qr_handler

def get_pinecone_client():
    """Lazy initialization for Pinecone client."""
    global _pinecone_client, _pinecone_initialized
    
    if _pinecone_client is not None:
        return _pinecone_client
    
    if _pinecone_initialized:
        return None  # Already tried and failed
    
    with _init_lock:
        if _pinecone_client is not None:
            return _pinecone_client
        
        if _pinecone_initialized:
            return None
        
        try:
            if not pinecone_api_key:
                raise Exception("PINECONE_API_KEY environment variable not set")
            
            if not Pinecone:
                raise Exception("Pinecone package not imported")
            
            _pinecone_client = Pinecone(api_key=pinecone_api_key)
            # Non-blocking check - don't call list_indexes() as it might timeout
            _log_initialization("Pinecone", True, "Client initialized on-demand")
        except Exception as e:
            _initialization_errors["pinecone"] = str(e)
            _log_initialization("Pinecone", False, f"Failed: {str(e)}")
        finally:
            _pinecone_initialized = True
    
    return _pinecone_client

def get_pinecone_index():
    """Lazy initialization for Pinecone index."""
    global _pinecone_index
    
    if _pinecone_index is not None:
        return _pinecone_index
    
    client = get_pinecone_client()
    if client is None:
        return None
    
    with _init_lock:
        if _pinecone_index is not None:
            return _pinecone_index
        
        try:
            _pinecone_index = client.Index(pinecone_index_name)
            _log_initialization("PineconeIndex", True, f"Index '{pinecone_index_name}' initialized")
        except Exception as e:
            _initialization_errors["pinecone_index"] = str(e)
            _log_initialization("PineconeIndex", False, f"Failed to get index: {str(e)}")
    
    return _pinecone_index

def get_doc_processor():
    """Lazy initialization for Document Processor."""
    global _doc_processor, _doc_processor_initialized
    
    if _doc_processor is not None:
        return _doc_processor
    
    if _doc_processor_initialized:
        return None  # Already tried and failed
    
    with _init_lock:
        if _doc_processor is not None:
            return _doc_processor
        
        if _doc_processor_initialized:
            return None
        
        try:
            if not DocumentProcessor:
                raise Exception("DocumentProcessor class not available")
            
            # Get Pinecone client but don't fail if it's None
            pinecone_client = get_pinecone_client()
            _doc_processor = DocumentProcessor(pinecone_client, pinecone_index_name)
            _log_initialization("DocumentProcessor", True, "Initialized on-demand")
        except Exception as e:
            _initialization_errors["doc_processor"] = str(e)
            _log_initialization("DocumentProcessor", False, f"Failed: {str(e)}")
        finally:
            _doc_processor_initialized = True
    
    return _doc_processor

def get_rag_engine():
    """Lazy initialization for RAG Engine."""
    global _rag_engine, _rag_engine_initialized
    
    if _rag_engine is not None:
        return _rag_engine
    
    if _rag_engine_initialized:
        return None  # Already tried and failed
    
    with _init_lock:
        if _rag_engine is not None:
            return _rag_engine
        
        if _rag_engine_initialized:
            return None
        
        try:
            if not RAGEngine:
                raise Exception("RAGEngine class not available")
            
            # Get Pinecone index but don't fail if it's None
            pinecone_index = get_pinecone_index()
            _rag_engine = RAGEngine(pinecone_index)
            _log_initialization("RAGEngine", True, "Initialized on-demand")
        except Exception as e:
            _initialization_errors["rag_engine"] = str(e)
            _log_initialization("RAGEngine", False, f"Failed: {str(e)}")
        finally:
            _rag_engine_initialized = True
    
    return _rag_engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lightweight startup/shutdown for FastAPI.
    NO BLOCKING OPERATIONS - Heavy initialization is deferred to lazy getters.
    MongoDB connection verified on first request, not at startup.
    """
    logger.info("🚀 Starting ApplianceIQ API (fast initialization)...")
    
    global client, db, mongo_available
    
    # Initialize MongoDB client WITHOUT verification (connection lazy on first use)
    if mongo_url:
        try:
            client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
            db = client[db_name]
            mongo_available = True
            logger.info("[MongoDB] Client initialized (connection verified on first request)")
        except Exception as e:
            # If client creation itself fails, log but don't block startup
            mongo_available = False
            logger.warning(f"[MongoDB] Client initialization failed: {str(e)}")
    else:
        mongo_available = False
        logger.warning("[MongoDB] MONGO_URL not configured")
    
    # Initialize Cloudinary (lightweight, non-blocking)
    cloudinary_url = os.getenv("CLOUDINARY_URL")
    if cloudinary_url:
        try:
            cloudinary.config(secure=True)
            logger.info("[Cloudinary] Configured")
        except Exception as e:
            logger.warning(f"[Cloudinary] Configuration failed: {str(e)}")
    
    # Log lazy initialization notice
    if ml_imports_available:
        logger.info("[Startup] Heavy services (Pinecone, DocumentProcessor, RAGEngine) will initialize on-demand")
    else:
        logger.warning(f"[Startup] ML services not available: {ml_import_error}")
    
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

# Root route - Redirects to /docs and provides a quick API welcome
@app.get("/", include_in_schema=False)
async def root():
    """Welcome to ApplianceIQ API - Redirects to Swagger UI."""
    return RedirectResponse(url="/docs")

@app.get("/api/welcome")
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
    pinecone_index = get_pinecone_index()
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
    # Rate Limiting
    limiter = RateLimiter(db, limit=3) # 3 uploads per min
    if not await limiter.check(current_user["id"]):
        raise HTTPException(status_code=429, detail="Upload rate limit exceeded. Please wait a minute.")

    # Lazy initialize DocumentProcessor
    doc_processor = get_doc_processor()
    if not doc_processor:
        detail = "Ingestion service not available"
        if "doc_processor" in _initialization_errors:
            detail += f": {_initialization_errors['doc_processor']}"
        raise HTTPException(status_code=503, detail=detail)
    
    # Lazy initialize QR Handler
    qr_handler = get_qr_handler()
    if not qr_handler:
        raise HTTPException(status_code=503, detail="QR code service not available")
    
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
    # Save file to Memory/Temp then Cloudinary
    file_path = None
    cloudinary_file_url = None
    
    try:
        content = await file.read()
        # Upload to Cloudinary
        if os.getenv("CLOUDINARY_URL"):
            try:
                # Determine resource type based on extension
                res_type = "raw" if file_ext == "pdf" else "image"
                upload_result = cloudinary.uploader.upload(
                    content,
                    public_id=f"manual_{manual_id}",
                    folder="appliance_iq/manuals",
                    resource_type=res_type,
                    overwrite=True
                )
                cloudinary_file_url = upload_result.get("secure_url")
                logger.info(f"Uploaded {file_ext} to Cloudinary: {cloudinary_file_url}")
            except Exception as e:
                logger.error(f"Cloudinary upload failed: {e}")
                # Fallback to local if Cloudinary fails (mostly for local dev)
                pass

        # Always save a local copy for ingestion processing (DocumentProcessor expects a path or stream)
        # In production, we might want to pass the buffer directly, but keeping file_path for now
        # to minimize changes to ingestion.py
        uploads_dir = ROOT_DIR / "uploads"
        uploads_dir.mkdir(exist_ok=True)
        file_path = str(uploads_dir / f"{manual_id}.{file_ext}")
        with open(file_path, "wb") as f:
            f.write(content)
            
    except Exception as e:
        logger.error(f"Failed to handle file storage/upload: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Create manual in DB
    manual = Manual(
        id=manual_id,
        user_id=target_user_id,
        model_name=model_name,
        version=version,
        region=region,
        file_path=file_path,
        cloudinary_url=cloudinary_file_url, # Add this to your model if not present!
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
        # Pass either the local path or the content
        chunks_count = await doc_processor.process_manual(manual_id, file_path, file_ext, db)
        
        # Generate QR code (now supports Cloudinary)
        qr_data = qr_handler.generate_qr_code(manual_id, version)
        
        # Save QR code
        qr_code = QRCode(
            id=qr_data["qr_id"],
            manual_id=manual_id,
            short_url=qr_data["short_url"],
            cloudinary_url=qr_data.get("cloudinary_url"), # Add to model if needed
            payload=qr_data["payload"],
            signature=qr_data["payload"]["sig"]
        )
        
        qr_dict = qr_code.model_dump()
        qr_dict['created_at'] = qr_dict['created_at'].isoformat()
        await db.qr_codes.insert_one(qr_dict)
        
        # Update manual with QR code ID and final status
        await db.manuals.update_one(
            {"id": manual_id},
            {"$set": {
                "qr_code_id": qr_data["qr_id"],
                "status": "completed",
                "chunks_count": chunks_count
            }}
        )
        
        return {
            "manual_id": manual_id,
            "status": "completed",
            "chunks_count": chunks_count,
            "file_url": cloudinary_file_url,
            "qr_code": {
                "id": qr_data["qr_id"],
                "url": qr_data["short_url"],
                "image": qr_data["cloudinary_url"] or qr_data["image_base64"]
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
    qr_handler = get_qr_handler()
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
    qr_handler = get_qr_handler()
    if not qr_handler:
        raise HTTPException(status_code=503, detail="QR code service not available")
    
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
    rag_engine = get_rag_engine()
    if not rag_engine:
        detail = "RAG service not available"
        if "rag_engine" in _initialization_errors:
            detail += f": {_initialization_errors['rag_engine']}"
        raise HTTPException(status_code=503, detail=detail)
    
    try:
        contents = await file.read()
        # Call the new method in RAGEngine (we need to update RAGEngine first or ensure it exists)
        # Note: We added analyze_image to RAGEngine in the previous step
        analysis_result = await rag_engine.analyze_image(contents)
        
        return {"analysis": analysis_result}
    except Exception as e:
        logger.error(f"Image analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(e)}")

@api_router.post("/chat")
async def chat(request: ChatRequest, current_user: Optional[dict] = Depends(get_optional_user)):
    """Chat endpoint with streaming. Works for both authenticated users and QR-based (unauthenticated) access."""
    rag_engine = get_rag_engine()
    if not rag_engine:
        detail = "RAG service not available"
        if "rag_engine" in _initialization_errors:
            detail += f": {_initialization_errors['rag_engine']}"
        raise HTTPException(status_code=503, detail=detail)
    
    # Access Control: Ensure user has rights to this manual
    if not current_user:
        if not request.qr_id:
            raise HTTPException(status_code=403, detail="Security Required: Please scan a valid QR code to start chatting.")
        
        # Verify the QR ID matches the manual ID
        qr_record = await db.qr_codes.find_one({"id": request.qr_id, "manual_id": request.manual_id})
        if not qr_record:
            raise HTTPException(status_code=403, detail="Invalid Session: This QR code is not valid for this device.")
    else:
        # Authenticated user - check if they own the manual or are admin
        if current_user.get("role") != "admin":
            manual = await db.manuals.find_one({"id": request.manual_id, "user_id": current_user["id"]})
            if not manual:
                raise HTTPException(status_code=403, detail="Access Denied: You do not have permission to access this manual.")

    # Rate Limiting (only for authenticated users)
    if current_user:
        limiter = RateLimiter(db, limit=10)  # 10 queries per min
        if not await limiter.check(current_user["id"]):
            raise HTTPException(status_code=429, detail="Too many requests. Please slow down.")

    from fastapi.responses import StreamingResponse
    return StreamingResponse(
        rag_engine.answer_question_stream(request.manual_id, request.question, db=db),
        media_type="text/event-stream"
    )

@api_router.post("/qr/assign")
async def assign_qr_to_manual(
    qr_id: str = Form(...),
    manual_id: str = Form(...),
    admin: dict = Depends(get_db_admin_user)
):
    """Admin endpoint to assign/reassign a QR code to a manual."""
    qr_handler = get_qr_handler()
    if not qr_handler:
        raise HTTPException(status_code=503, detail="QR code service not available")
    
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
    qr_handler = get_qr_handler()
    if not qr_handler:
        raise HTTPException(status_code=503, detail="QR code service not available")
    
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

# ============= HEALTH CHECK =============
@api_router.get("/health")
async def health_check():
    """Health check endpoint."""
    # Lazy check - services are initialized only if accessed
    return {
        "status": "healthy",
        "startup_time": "< 5 seconds",
        "services": {
            "mongodb": "connected" if mongo_available else "not configured",
            "pinecone": "initialized" if _pinecone_initialized and _pinecone_client else "not yet initialized",
            "rag": "initialized" if _rag_engine_initialized and _rag_engine else "not yet initialized",
            "ingestion": "initialized" if _doc_processor_initialized and _doc_processor else "not yet initialized",
            "qr_handler": "initialized" if _qr_handler_initialized and _qr_handler else "not yet initialized"
        },
        "initialization_errors": _initialization_errors if _initialization_errors else None
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
    # Print a clear message about where the API is running
    print("\n" + "="*50)
    print("ApplianceIQ API is starting...")
    print(f"Docs: http://localhost:8000/docs")
    print(f"Health: http://localhost:8000/api/health")
    print("="*50 + "\n")
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
