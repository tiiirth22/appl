
from fastapi import HTTPException, Cookie, Header, Depends
from datetime import datetime, timezone, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os
import bcrypt
from typing import Optional
from models import UserSignUp, UserLogin

async def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

async def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash."""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

async def get_current_user(db, session_token: Optional[str] = Cookie(None), authorization: Optional[str] = Header(None)):
    """Get current authenticated user from session token."""
    
    # Try to get token from cookie first, then from authorization header
    token = session_token
    if not token and authorization:
        if authorization.startswith("Bearer "):
            token = authorization.replace("Bearer ", "")
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check session in database
    session = await db.user_sessions.find_one({"session_token": token})
    
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check if session expired
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user = await db.users.find_one({"id": session["user_id"]}, {"_id": 0, "password_hash": 0})  # Exclude password hash
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

async def signup_user(db, signup_data: UserSignUp):
    """Create a new user account."""
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": signup_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    # Validate role
    if signup_data.role not in ["admin", "business_owner"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    # Hash password
    password_hash = await hash_password(signup_data.password)
    
    # Create user
    user_data = {
        "id": signup_data.email,  # Use email as ID for simplicity
        "email": signup_data.email,
        "name": signup_data.name,
        "password_hash": password_hash,
        "role": signup_data.role,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    try:
        await db.users.insert_one(user_data)
        
        # Create session
        session_token = os.urandom(32).hex()
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        session_data = {
            "user_id": user_data["id"],
            "session_token": session_token,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.user_sessions.insert_one(session_data)
    except Exception as e:
        logger.error(f"[SIGNUP ERROR] {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Database error during signup: {str(e)}")
    
    return {
        "session_token": session_token,
        "user": {
            "id": user_data["id"],
            "email": user_data["email"],
            "name": user_data["name"],
            "role": user_data["role"]
        }
    }

async def login_user(db, login_data: UserLogin):
    """Authenticate user and create session."""
    try:
        # Find user
        user = await db.users.find_one({"email": login_data.email}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Verify password
        if not await verify_password(login_data.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Create session
        session_token = os.urandom(32).hex()
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        session_data = {
            "user_id": user["id"],
            "session_token": session_token,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.user_sessions.insert_one(session_data)
        
        return {
            "session_token": session_token,
            "user": {
                "id": user["id"],
                "email": user["email"],
                "name": user["name"],
                "role": user["role"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[LOGIN ERROR] {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Database error during login: {str(e)}")

async def require_admin(db, session_token: Optional[str] = Cookie(None), authorization: Optional[str] = Header(None)):
    """Require admin role."""
    user = await get_current_user(db, session_token, authorization)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def require_business_owner_or_admin(db, session_token: Optional[str] = Cookie(None), authorization: Optional[str] = Header(None)):
    """Require business owner or admin role."""
    user = await get_current_user(db, session_token, authorization)
    if user.get("role") not in ["admin", "business_owner"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return user