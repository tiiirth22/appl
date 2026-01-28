"""
Unit tests for ApplianceIQ authentication module
Tests: registration, login, password hashing
"""

import pytest
import asyncio
from datetime import datetime, timezone
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from models import User, UserSignUp, UserLogin, UserSession
from auth import hash_password, verify_password


class TestPasswordHashing:
    """Test password hashing and verification"""
    
    @pytest.mark.asyncio
    async def test_hash_password_creates_hash(self):
        """Test that hash_password creates a non-empty hash"""
        password = "test_password_123"
        hash_result = await hash_password(password)
        
        assert hash_result is not None
        assert len(hash_result) > 0
        assert hash_result != password  # Should be hashed, not plain text
    
    @pytest.mark.asyncio
    async def test_verify_password_correct(self):
        """Test that verify_password returns True for correct password"""
        password = "correct_password"
        password_hash = await hash_password(password)
        
        assert await verify_password(password, password_hash) is True
    
    @pytest.mark.asyncio
    async def test_verify_password_incorrect(self):
        """Test that verify_password returns False for incorrect password"""
        password = "original_password"
        wrong_password = "wrong_password"
        password_hash = await hash_password(password)
        
        assert await verify_password(wrong_password, password_hash) is False
    
    @pytest.mark.asyncio
    async def test_verify_password_empty_strings(self):
        """Test verify_password with empty strings"""
        hash_result = await hash_password("")
        assert await verify_password("", hash_result) is True
        assert await verify_password("any", hash_result) is False
    
    @pytest.mark.asyncio
    async def test_hash_different_for_same_password(self):
        """Test that same password produces different hashes (due to salt)"""
        password = "same_password"
        hash1 = await hash_password(password)
        hash2 = await hash_password(password)
        
        # Different hashes but both verify correctly
        assert hash1 != hash2
        assert await verify_password(password, hash1) is True
        assert await verify_password(password, hash2) is True


class TestUserModels:
    """Test User Pydantic model"""
    
    def test_user_creation_with_email(self):
        """Test creating a User with email"""
        user = User(
            email="test@example.com",
            name="Test User",
            password_hash="hashed_password",
            role="business_owner",
            created_at=datetime.now(timezone.utc)
        )
        
        assert user.email == "test@example.com"
        assert user.name == "Test User"
        assert user.role == "business_owner"
    
    def test_user_role_values(self):
        """Test that User can have valid role values"""
        admin_user = User(
            email="admin@example.com",
            name="Admin",
            password_hash="hash",
            role="admin",
            created_at=datetime.now(timezone.utc)
        )
        
        business_user = User(
            email="user@example.com",
            name="User",
            password_hash="hash",
            role="business_owner",
            created_at=datetime.now(timezone.utc)
        )
        
        assert admin_user.role == "admin"
        assert business_user.role == "business_owner"
    
    def test_user_model_validation(self):
        """Test User model field validation"""
        user = User(
            email="valid@example.com",
            name="Valid User",
            password_hash="hash",
            role="admin",
            created_at=datetime.now(timezone.utc)
        )
        
        assert user.email == "valid@example.com"
        assert user.password_hash == "hash"
        assert user.id is not None  # Should have auto-generated ID


class TestUserSignUpModel:
    """Test UserSignUp model"""
    
    def test_user_signup_creation(self):
        """Test creating a UserSignUp request"""
        signup = UserSignUp(
            email="newuser@example.com",
            name="New User",
            password="SecurePassword123",
            role="business_owner"
        )
        
        assert signup.email == "newuser@example.com"
        assert signup.name == "New User"
        assert signup.password == "SecurePassword123"
        assert signup.role == "business_owner"
    
    def test_user_signup_default_role(self):
        """Test UserSignUp defaults to business_owner role"""
        signup = UserSignUp(
            email="user@example.com",
            name="User",
            password="Password123"
        )
        
        assert signup.role == "business_owner"


class TestUserLoginModel:
    """Test UserLogin model"""
    
    def test_user_login_creation(self):
        """Test creating a UserLogin request"""
        login = UserLogin(
            email="user@example.com",
            password="Password123"
        )
        
        assert login.email == "user@example.com"
        assert login.password == "Password123"


if __name__ == "__main__":
    # Run tests with pytest
    pytest.main([__file__, "-v"])
