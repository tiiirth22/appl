# ApplianceIQ API Reference

**Base URL**: `http://localhost:8000/api`  
**Authentication**: Session token in cookies (first-party)

---

## Authentication Endpoints

### Sign Up (Create Account)
```http
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "secure_password",
  "role": "business_owner"  // or "admin"
}
```

**Response** (201):
```json
{
  "id": "uuid-here",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "business_owner",
  "session_token": "token-here",
  "created_at": "2026-01-28T10:00:00Z"
}
```

---

### Log In
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response** (200):
```json
{
  "id": "uuid-here",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "business_owner",
  "session_token": "token-here",
  "created_at": "2026-01-28T10:00:00Z"
}
```

---

### Get Current User
```http
GET /auth/me
Cookie: session_token=token-here
```

**Response** (200):
```json
{
  "id": "uuid-here",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "business_owner"
}
```

**Response** (401):
```json
{
  "detail": "Not authenticated"
}
```

---

### Logout
```http
POST /auth/logout
Cookie: session_token=token-here
```

**Response** (200):
```json
{
  "message": "Logged out successfully"
}
```

---

## Manual Management Endpoints

### List User's Manuals
```http
GET /manuals
Cookie: session_token=token-here
```

**Response** (200):
```json
{
  "manuals": [
    {
      "id": "manual-uuid",
      "title": "Washing Machine Manual",
      "description": "Complete manual for XYZ model",
      "owner_id": "user-uuid",
      "file_path": "path/to/file.pdf",
      "file_type": "pdf",
      "created_at": "2026-01-28T10:00:00Z",
      "updated_at": "2026-01-28T10:00:00Z"
    }
  ]
}
```

---

### Upload Manual
```http
POST /manuals/upload
Cookie: session_token=token-here
Content-Type: multipart/form-data

file: <PDF or image file>
title: "Washing Machine Manual"
description: "Complete manual for XYZ model"
```

**Response** (201):
```json
{
  "id": "manual-uuid",
  "title": "Washing Machine Manual",
  "description": "Complete manual for XYZ model",
  "owner_id": "user-uuid",
  "file_type": "pdf",
  "status": "pending",
  "created_at": "2026-01-28T10:00:00Z",
  "message": "Manual uploaded successfully. Processing started."
}
```

**Response** (400):
```json
{
  "detail": "ML services not available - manual upload disabled"
}
```

---

### Get Manual Details
```http
GET /manuals/{manual_id}
Cookie: session_token=token-here
```

**Response** (200):
```json
{
  "id": "manual-uuid",
  "title": "Washing Machine Manual",
  "description": "Complete manual for XYZ model",
  "owner_id": "user-uuid",
  "file_type": "pdf",
  "created_at": "2026-01-28T10:00:00Z",
  "chunks_count": 45,
  "qr_codes": ["qr-uuid-1", "qr-uuid-2"]
}
```

---

### Delete Manual
```http
DELETE /manuals/{manual_id}
Cookie: session_token=token-here
```

**Response** (200):
```json
{
  "message": "Manual deleted successfully"
}
```

---

## Chat/Query Endpoints

### Submit Query (RAG)
```http
POST /chat
Cookie: session_token=token-here
Content-Type: application/json

{
  "manual_id": "manual-uuid",
  "question": "How do I reset the machine?"
}
```

**Response** (200):
```json
{
  "answer": "To reset the machine, press and hold the power button for 10 seconds...",
  "sources": [
    {
      "chunk_id": "chunk-1",
      "text": "To reset the machine...",
      "page": 15,
      "confidence": 0.95
    }
  ],
  "manual_info": {
    "id": "manual-uuid",
    "title": "Washing Machine Manual"
  }
}
```

**Response** (400):
```json
{
  "detail": "RAG services not available - chat feature disabled"
}
```

---

### Get Query History
```http
GET /queries/{manual_id}
Cookie: session_token=token-here
```

**Response** (200):
```json
{
  "queries": [
    {
      "id": "query-uuid",
      "manual_id": "manual-uuid",
      "question": "How do I reset the machine?",
      "answer": "To reset the machine...",
      "created_at": "2026-01-28T10:00:00Z"
    }
  ]
}
```

---

## Admin Endpoints

### List All Users
```http
GET /admin/users
Cookie: session_token=token-here
```

**Response** (200, admin only):
```json
{
  "users": [
    {
      "id": "user-uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "business_owner",
      "created_at": "2026-01-28T10:00:00Z"
    }
  ]
}
```

**Response** (403, not admin):
```json
{
  "detail": "Not authorized"
}
```

---

### List All Manuals
```http
GET /admin/manuals
Cookie: session_token=token-here
```

**Response** (200, admin only):
```json
{
  "manuals": [
    {
      "id": "manual-uuid",
      "title": "Washing Machine Manual",
      "owner_id": "user-uuid",
      "owner_email": "user@example.com",
      "created_at": "2026-01-28T10:00:00Z"
    }
  ]
}
```

---

### Update User Role
```http
PUT /admin/users/{user_id}/role
Cookie: session_token=token-here
Content-Type: application/json

{
  "role": "admin"
}
```

**Response** (200, admin only):
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "role": "admin",
  "message": "User role updated successfully"
}
```

---

### Delete User
```http
DELETE /admin/users/{user_id}
Cookie: session_token=token-here
```

**Response** (200, admin only):
```json
{
  "message": "User deleted successfully"
}
```

---

## System Endpoints

### Health Check
```http
GET /health
```

**Response** (200):
```json
{
  "status": "ok",
  "services": {
    "api": "ok",
    "mongodb": "connected",
    "qdrant": "not_configured",
    "ml_services": "disabled"
  },
  "timestamp": "2026-01-28T10:00:00Z"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid input data"
}
```

### 401 Unauthorized
```json
{
  "detail": "Not authenticated"
}
```

### 403 Forbidden
```json
{
  "detail": "Not authorized"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

---

## Testing with cURL

### Sign Up
```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "password": "password123",
    "role": "business_owner"
  }'
```

### Login
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Get Current User
```bash
curl -X GET http://localhost:8000/api/auth/me \
  -b cookies.txt
```

### List Manuals
```bash
curl -X GET http://localhost:8000/api/manuals \
  -b cookies.txt
```

### Health Check
```bash
curl -X GET http://localhost:8000/api/health
```

---

## Testing with Python

```python
import requests
import json

BASE_URL = "http://localhost:8000/api"

# Signup
response = requests.post(f"{BASE_URL}/auth/signup", json={
    "email": "test@example.com",
    "name": "Test User",
    "password": "password123",
    "role": "business_owner"
})
print(response.json())

# Login
response = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "test@example.com",
    "password": "password123"
})
data = response.json()
token = data.get("session_token")

# Get current user
headers = {"Cookie": f"session_token={token}"}
response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
print(response.json())

# List manuals
response = requests.get(f"{BASE_URL}/manuals", headers=headers)
print(response.json())
```

---

## Notes

1. **Authentication**: All protected endpoints require valid session token
2. **Admin endpoints**: Only accessible to users with `role: "admin"`
3. **Data isolation**: Business owners can only access their own manuals
4. **Optional services**: Some endpoints may return 400 if ML services unavailable
5. **CORS**: Configured to allow requests from frontend origin

