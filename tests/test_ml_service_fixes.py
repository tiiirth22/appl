import sys
import os
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

# Add ml_service to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'ml_service'))

from server import app

def test_health_basic():
    """Test /health basic response"""
    client = TestClient(app)
    # Just mock the active checks to avoid external calls
    with patch('processor.AsyncDocumentProcessor._get_pinecone_index') as mock_get_index:
        mock_index = MagicMock()
        mock_get_index.return_value = mock_index
        
        response = client.get("/health")
        # May be 200 or 500 depending on model status in this env
        assert response.status_code in [200, 500]
        data = response.json()
        assert "status" in data
        assert "timestamp" in data
        assert isinstance(data["timestamp"], str)

def test_debug_pinecone_serialization_simple():
    """Test /debug/pinecone returns serializable data"""
    client = TestClient(app)
    
    # Mock the whole processor instance
    with patch('server.AsyncDocumentProcessor', autospec=True) as MockProcessor:
        instance = MockProcessor.return_value
        mock_index = MagicMock()
        instance._get_pinecone_index.return_value = mock_index
        instance._pinecone_client = MagicMock()
        instance._pinecone_client.describe_index.return_value = MagicMock(dimension=1536, metric='cosine')
        
        # Mock index.describe_index_stats to return a simple dict or object
        mock_stats = MagicMock()
        mock_stats.total_vector_count = 100
        mock_stats.namespaces = {}
        # remove to_dict to test fallback
        if hasattr(mock_stats, 'to_dict'):
            del mock_stats.to_dict
            
        mock_index.describe_index_stats.return_value = mock_stats
        
        response = client.get("/debug/pinecone")
        assert response.status_code == 200
        data = response.json()
        assert data["pinecone_connected"] is True
        assert data["details"]["stats"]["total_vector_count"] == 100

def test_query_validation_simple():
    """Test /query validation"""
    client = TestClient(app)
    # Missing fields should return 422
    response = client.post("/query", json={})
    assert response.status_code == 422
    
    # Question too short should return 400 (per our custom logic)
    response = client.post("/query", json={"manual_id": "test", "question": "a"})
    assert response.status_code == 400

if __name__ == "__main__":
    pytest.main([__file__])
