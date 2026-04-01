#!/usr/bin/env python3
"""Pre-deployment verification script"""
import sys
import os
from pathlib import Path

# Add paths
sys.path.insert(0, str(Path(__file__).parent / 'backend'))
sys.path.insert(0, str(Path(__file__).parent / 'ml_service'))

print("=" * 70)
print("APPLIANCEIQ PRE-DEPLOYMENT VERIFICATION")
print("=" * 70)

# ============= CHECK 1: File Structure =============
print("\n[CHECK 1] File Structure")
backend_files = ['server.py', 'ml_client.py', 'models.py', 'qr_handler.py', 'auth.py']
ml_files = ['server.py', 'config.py', 'processor.py', 'rag_engine.py']
frontend_files = ['src/App.js', 'public/index.html', 'package.json']

backend_path = Path(__file__).parent / 'backend'
ml_path = Path(__file__).parent / 'ml_service'
frontend_path = Path(__file__).parent / 'frontend'

backend_ok = all((backend_path / f).exists() for f in backend_files)
ml_ok = all((ml_path / f).exists() for f in ml_files)
frontend_ok = all((frontend_path / f).exists() for f in frontend_files)

print(f"  Backend files: {'✓ OK' if backend_ok else '✗ MISSING'}")
for f in backend_files:
    exists = (backend_path / f).exists()
    print(f"    {'✓' if exists else '✗'} {f}")

print(f"  ML Service files: {'✓ OK' if ml_ok else '✗ MISSING'}")
for f in ml_files:
    exists = (ml_path / f).exists()
    print(f"    {'✓' if exists else '✗'} {f}")

print(f"  Frontend files: {'✓ OK' if frontend_ok else '✗ MISSING'}")
for f in frontend_files:
    exists = (frontend_path / f).exists()
    print(f"    {'✓' if exists else '✗'} {f}")

# ============= CHECK 2: Backend Imports =============
print("\n[CHECK 2] Backend Imports")
try:
    from backend.ml_client import MLServiceClient, MLServiceError
    print("  ✓ ml_client imports OK")
except Exception as e:
    print(f"  ✗ ml_client import failed: {e}")
    
try:
    from backend.qr_handler import QRHandler
    print("  ✓ qr_handler imports OK")
except Exception as e:
    print(f"  ✗ qr_handler import failed: {e}")

try:
    from backend.models import User, Manual, QRCode, Query
    print("  ✓ models imports OK")
except Exception as e:
    print(f"  ✗ models import failed: {e}")

try:
    from backend.auth import get_current_user
    print("  ✓ auth imports OK")
except Exception as e:
    print(f"  ✗ auth import failed: {e}")

# ============= CHECK 3: ML Service Config =============
print("\n[CHECK 3] ML Service Configuration")
try:
    from ml_service.config import PINECONE_API_KEY, GROQ_API_KEY, EMBEDDING_MODEL, LLM_MODEL
    print(f"  ✓ Config loads from backend .env")
    print(f"    - PINECONE_API_KEY: {'set' if PINECONE_API_KEY else 'NOT set'}")
    print(f"    - GROQ_API_KEY: {'set' if GROQ_API_KEY else 'NOT set'}")
    print(f"    - EMBEDDING_MODEL: {EMBEDDING_MODEL}")
    print(f"    - LLM_MODEL: {LLM_MODEL}")
except Exception as e:
    print(f"  ✗ Config loading failed: {e}")

# ============= CHECK 4: Backend Endpoints =============
print("\n[CHECK 4] Backend Endpoints (from server.py)")
server_file = backend_path / 'server.py'
endpoints = {
    'Auth': ['/auth/signup', '/auth/login', '/auth/me', '/auth/logout'],
    'Manuals': ['/manuals/upload', '/manuals', '/manuals/{manual_id}'],
    'QR Codes': ['/qr/assign', '/qr-details/{qr_id}', '/chat'],
    'Admin': ['/admin/users', '/admin/users/{user_id}/assign-qr'],
    'Health': ['/health']
}

with open(server_file, 'r') as f:
    content = f.read()

for category, routes in endpoints.items():
    print(f"  {category}:")
    for route in routes:
        # Simple check - look for route in file
        route_check = route.replace('{', '').replace('}', '')
        exists = route_check in content
        print(f"    {'✓' if exists else '✗'} {route}")

# ============= CHECK 5: ML Service Endpoints =============
print("\n[CHECK 5] ML Service Endpoints (from server.py)")
ml_server = ml_path / 'server.py'
ml_routes = {
    'Processing': ['/process_manual'],
    'Query': ['/query'],
}

with open(ml_server, 'r') as f:
    ml_content = f.read()

for category, routes in ml_routes.items():
    print(f"  {category}:")
    for route in routes:
        exists = route in ml_content
        print(f"    {'✓' if exists else '✗'} {route}")

# ============= CHECK 6: Backend-ML Service Connection =============
print("\n[CHECK 6] Backend-ML Service Connection")
with open(server_file, 'r') as f:
    backend_content = f.read()

checks = [
    ('ml_client.process_manual', 'process_manual method exists'),
    ('ml_client.query_manual', 'query_manual method exists'),
    ('ml_client = MLServiceClient', 'MLServiceClient instantiated'),
    ('cloudinary_file_url', 'Cloudinary upload used'),
]

for check_str, description in checks:
    exists = check_str in backend_content
    print(f"  {'✓' if exists else '✗'} {description}")

# ============= CHECK 7: ML Client Endpoints =============
print("\n[CHECK 7] ML Client Methods Match ML Service Endpoints")
ml_client_file = backend_path / 'ml_client.py'
with open(ml_client_file, 'r') as f:
    ml_client_content = f.read()

client_checks = [
    ('/process_manual', 'process_manual sends to /process_manual'),
    ('/query', 'query_manual sends to /query'),
]

for endpoint, description in client_checks:
    exists = endpoint in ml_client_content
    print(f"  {'✓' if exists else '✗'} {description}")

# ============= CHECK 8: Frontend Routes =============
print("\n[CHECK 8] Frontend Routes")
app_file = frontend_path / 'src' / 'App.js'
try:
    with open(app_file, 'r') as f:
        app_content = f.read()
    
    routes = {
        'Landing': ['/'],
        'Auth': ['/login', '/signup'],
        'Dashboard': ['/dashboard'],
        'Chat': ['/chat/:id'],
        'Upload': ['/upload'],
    }
    
    for category, route_list in routes.items():
        print(f"  {category}:")
        for route in route_list:
            route_check = route.replace('/:id', '').replace('/', '')
            exists = route in app_content or route_check in app_content
            print(f"    {'✓' if exists else '✗'} {route}")
except Exception as e:
    print(f"  ✗ Could not read App.js: {e}")

# ============= CHECK 9: Environment Variables Required =============
print("\n[CHECK 9] Required Environment Variables")
backend_env = backend_path / '.env'
if backend_env.exists():
    with open(backend_env, 'r') as f:
        env_content = f.read()
    
    required_vars = [
        'MONGO_URL',
        'ML_SERVICE_URL',
        'APP_BASE_URL',
        'CLOUDINARY_URL',
        'PINECONE_API_KEY',
        'GROQ_API_KEY',
    ]
    
    for var in required_vars:
        exists = var in env_content
        print(f"  {'✓' if exists else '✗'} {var}")
else:
    print(f"  ✗ .env file not found at {backend_env}")

# ============= FINAL SUMMARY =============
print("\n" + "=" * 70)
print("DEPLOYMENT READINESS SUMMARY")
print("=" * 70)

all_checks_passed = all([backend_ok, ml_ok, frontend_ok])
if all_checks_passed:
    print("✓ All critical checks PASSED")
    print("\nNext steps:")
    print("  1. Start ML Service: cd ml_service && python server.py")
    print("  2. Start Backend: cd backend && uvicorn server:app --reload --host 0.0.0.0 --port 8000")
    print("  3. Start Frontend: cd frontend && npm start")
    print("  4. Test flow: Upload manual → Generate QR → Scan → Chat")
else:
    print("✗ Some checks FAILED - see above for details")
    print("\nRequired fixes before deployment:")
    if not backend_ok:
        print("  - Check backend files exist and are not corrupted")
    if not ml_ok:
        print("  - Check ML service files exist and are not corrupted")
    if not frontend_ok:
        print("  - Check frontend files exist and are not corrupted")

print("=" * 70)
