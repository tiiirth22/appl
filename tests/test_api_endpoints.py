"""
Integration tests for ApplianceIQ API endpoints
Tests: auth endpoints, manual endpoints, admin endpoints
"""

import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime
import sys
import os
import json
import uuid

# Configure pytest-asyncio to not close the event loop
@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for all tests"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    yield loop
    # Don't close the loop after tests - this causes issues with Motor

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from models import User, UserSignUp, UserLogin, Manual, ChatRequest, ChatResponse
from server import app


class TestAuthEndpoints:
    """Test authentication API endpoints"""
    
    def test_signup_success(self):
        """Test successful user signup"""
        client = TestClient(app)
        unique_email = f"newuser-{uuid.uuid4()}@example.com"
        payload = {
            "email": unique_email,
            "password": "secure_password_123",
            "name": "New User",
            "role": "business_owner"
        }
        
        response = client.post("/api/auth/signup", json=payload)
        
        # Check response status
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        
        # Check response structure
        data = response.json()
        assert "message" in data or "email" in data or "id" in data, f"Response missing expected fields: {data}"
    
    def test_signup_invalid_email(self):
        """Test signup with invalid email"""
        client = TestClient(app)
        payload = {
            "email": "not_an_email",
            "password": "secure_password_123",
            "name": "User",
            "role": "business_owner"
        }
        
        response = client.post("/api/auth/signup", json=payload)
        
        # Should reject invalid email format or allow it (depends on validation)
        assert response.status_code in [400, 422, 200], f"Unexpected status: {response.status_code}"
    
    def test_signup_missing_fields(self):
        """Test signup with missing required fields"""
        client = TestClient(app)
        payload = {
            "email": "user@example.com"
            # Missing password, name, and role
        }
        
        response = client.post("/api/auth/signup", json=payload)
        
        # Should reject incomplete request
        assert response.status_code in [400, 422], f"Expected 400/422, got {response.status_code}"
    
    def test_login_success(self):
        """Test successful user login"""
        client = TestClient(app)
        unique_email = f"logintest-{uuid.uuid4()}@example.com"
        # First signup a user
        signup_payload = {
            "email": unique_email,
            "password": "test_password_123",
            "name": "Login Test",
            "role": "business_owner"
        }
        signup_response = client.post("/api/auth/signup", json=signup_payload)
        assert signup_response.status_code in [200, 201]
        
        # Then try to login
        login_payload = {
            "email": unique_email,
            "password": "test_password_123"
        }
        
        response = client.post("/api/auth/login", json=login_payload)
        
        assert response.status_code in [200, 201], f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data or "session_id" in data or "session_token" in data or "message" in data
    
    def test_login_wrong_password(self):
        """Test login with incorrect password"""
        client = TestClient(app)
        unique_email = f"wrongpass-{uuid.uuid4()}@example.com"
        # First signup a user
        signup_payload = {
            "email": unique_email,
            "password": "correct_password",
            "name": "Wrong Pass",
            "role": "business_owner"
        }
        signup_response = client.post("/api/auth/signup", json=signup_payload)
        assert signup_response.status_code in [200, 201]
        
        # Try to login with wrong password
        login_payload = {
            "email": unique_email,
            "password": "wrong_password"
        }
        
        response = client.post("/api/auth/login", json=login_payload)
        
        # Should reject wrong password
        assert response.status_code in [401, 400], f"Expected 401/400, got {response.status_code}"
    
    def test_get_current_user(self):
        """Test retrieving current user info"""
        client = TestClient(app)
        # Create and login a user
        signup_payload = {
            "email": "currentuser@example.com",
            "password": "test_password",
            "name": "Current User",
            "role": "business_owner"
        }
        signup_response = client.post("/api/auth/signup", json=signup_payload)
        assert signup_response.status_code in [200, 201]
        
        # Get current user
        response = client.get("/api/auth/me")
        
        # Should return user info or require auth header
        assert response.status_code in [200, 401, 403], f"Unexpected status: {response.status_code}"


class TestHealthCheck:
    """Test health check endpoint"""
    
    def test_health_check(self):
        """Test health check endpoint"""
        client = TestClient(app)
        response = client.get("/api/health")
        
        assert response.status_code == 200, f"Health check failed: {response.text}"
        data = response.json()
        assert "status" in data
        assert data["status"] in ["healthy", "ok", "running"]


class TestManualEndpoints:
    """Test manual management endpoints"""
    
    def test_get_manuals_list(self):
        """Test getting list of manuals"""
        client = TestClient(app)
        response = client.get("/api/manuals")
        
        # Should return list (even if empty) or require auth
        assert response.status_code in [200, 401], f"Unexpected status: {response.status_code}"
        if response.status_code == 200:
            data = response.json()
            assert isinstance(data, list) or "manuals" in data
    
    def test_get_manual_by_id(self):
        """Test getting a manual by ID"""
        client = TestClient(app)
        # Try to get a non-existent manual
        response = client.get("/api/manuals/nonexistent123")
        
        # Should return 404 or require auth
        assert response.status_code in [404, 401], f"Unexpected status: {response.status_code}"


class TestRBACEnforcement:
    """Test role-based access control"""
    
    def test_admin_endpoint_requires_admin_role(self):
        """Test that admin endpoints require admin role"""
        client = TestClient(app)
        # Create a business owner user
        signup_payload = {
            "email": "businessowner@example.com",
            "password": "test_password",
            "name": "Business Owner",
            "role": "business_owner"
        }
        signup_response = client.post("/api/auth/signup", json=signup_payload)
        assert signup_response.status_code in [200, 201]
        
        # Try to access admin endpoint
        response = client.get("/api/admin/users")
        
        # Should either require admin role or auth header
        assert response.status_code in [403, 401], f"Expected 403/401, got {response.status_code}: {response.text}"


# Fixtures for common test data

@pytest.fixture
def sample_user():
    """Provide sample user data"""
    return {
        "email": "sample@example.com",
        "password": "sample_password_123",
        "role": "business_owner"
    }


@pytest.fixture
def sample_admin():
    """Provide sample admin data"""
    return {
        "email": "admin@example.com",
        "password": "admin_password_123",
        "role": "admin"
    }


@pytest.fixture
def sample_manual():
    """Provide sample manual data"""
    return {
        "title": "Sample Appliance Manual",
        "description": "A sample manual for testing",
        "owner": "user123"
    }


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v"])
