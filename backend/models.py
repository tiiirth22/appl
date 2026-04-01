from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid

# User Models
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    password_hash: str  # For first-party auth
    role: str = "business_owner"  # "admin" or "business_owner"
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserSignUp(BaseModel):
    email: str
    name: str
    password: str
    role: str = "business_owner"  # Default to business_owner

class UserLogin(BaseModel):
    email: str
    password: str

# Manual Models
class Manual(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    model_name: str
    version: str
    region: Optional[str] = "global"
    file_path: Optional[str] = None
    cloudinary_url: Optional[str] = None
    file_type: str  # pdf or image
    status: str = "processing"  # processing, completed, failed
    qr_code_id: Optional[str] = None
    chunks_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ManualCreate(BaseModel):
    model_name: str
    version: str
    region: Optional[str] = "global"

# QR Code Models
class QRCode(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    manual_id: str
    qr_url: str
    cloudinary_url: Optional[str] = None
    payload: Dict[str, Any]
    signature: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# Query Models
class Query(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    manual_id: str
    qr_code_id: str
    question: str
    answer: str
    sources: List[Dict[str, Any]] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChatRequest(BaseModel):
    manual_id: str
    question: str
    qr_id: Optional[str] = None

class ChatResponse(BaseModel):
    query_id: str
    answer: str
    sources: List[Dict[str, Any]]
    manual_info: Dict[str, Any]

# Feedback Models
class Feedback(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    query_id: str
    manual_id: str
    rating: int  # 1-5
    comment: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FeedbackCreate(BaseModel):
    query_id: str
    rating: int
    comment: Optional[str] = None
