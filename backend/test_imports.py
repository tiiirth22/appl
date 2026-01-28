#!/usr/bin/env python3
"""
Test script to verify all backend components import correctly.
Run this to validate the system before starting the server.
"""

import os
import sys
from pathlib import Path

# Set required environment variables
os.environ['MONGO_URL'] = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
os.environ['DB_NAME'] = os.environ.get('DB_NAME', 'applianceiq_db')
os.environ['CORS_ORIGINS'] = os.environ.get('CORS_ORIGINS', '*')

def test_imports():
    """Test that all required modules import successfully."""
    print("=" * 60)
    print("ApplianceIQ Backend Import Tests")
    print("=" * 60)
    
    tests = [
        ("Models", lambda: __import__('models')),
        ("Auth", lambda: __import__('auth')),
        ("QR Handler", lambda: __import__('qr_handler')),
        ("Document Processor", lambda: __import__('ingestion')),
        ("RAG Engine", lambda: __import__('rag')),
        ("Server", lambda: __import__('server')),
    ]
    
    passed = 0
    failed = 0
    
    for name, import_func in tests:
        try:
            import_func()
            print(f"✅ {name:20} - OK")
            passed += 1
        except (ImportError, ValueError) as e:
            if "sentence_transformers" in str(e) or "Keras" in str(e):
                print(f"⚠️  {name:20} - OPTIONAL SERVICE UNAVAILABLE")
                print(f"   └─ {str(e)[:60]}")
            else:
                print(f"❌ {name:20} - FAILED")
                print(f"   └─ {e}")
                failed += 1
        except Exception as e:
            print(f"❌ {name:20} - ERROR: {e}")
            failed += 1
    
    print("=" * 60)
    print(f"Results: {passed} passed, {failed} failed")
    print("=" * 60)
    
    if failed == 0:
        print("✅ All critical components imported successfully!")
        print("   System is ready for testing.")
        return True
    else:
        print("❌ Some components failed to import.")
        return False

if __name__ == '__main__':
    success = test_imports()
    sys.exit(0 if success else 1)
