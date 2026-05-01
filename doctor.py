import socket
import os
import subprocess
import time
from pymongo import MongoClient
from pathlib import Path
from dotenv import load_dotenv

load_dotenv("backend/.env")

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0

def check_mongodb():
    print("[1/4] Checking MongoDB...")
    url = os.getenv("MONGO_URL")
    try:
        client = MongoClient(url, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        print("✓ MongoDB: Connected!")
        return True
    except Exception as e:
        print(f"✗ MongoDB: FAILED - {e}")
        return False

def start_and_monitor(name, directory, command, port):
    if is_port_in_use(port):
        print(f"⚠ WARNING: Port {port} is ALREADY in use. Using existing process for {name}.")
        return "ALREADY_IN_USE"

    print(f"\n[LAUNCHING] {name} on port {port}...")
    
    # Use python for backend/ml, npm for frontend
    if "Frontend" in name:
        cmd = "npm start"
    else:
        venv_python = str(Path("venv/Scripts/python.exe").absolute())
        cmd = f'"{venv_python}" {command}'
    
    # Start in a new window so the user can see logs
    # Using 'start' command for Windows
    full_cmd = f'start "{name}" /D "{directory}" {cmd}'
    os.system(full_cmd)
    
    time.sleep(3)
    if is_port_in_use(port):
        print(f"✓ {name} is running.")
        return True
    else:
        print(f"✗ {name} failed to bind to port {port} within 3 seconds.")
        return False

if __name__ == "__main__":
    print("=== ApplianceIQ Full System Launcher ===")
    if check_mongodb():
        # Start the stack
        ml = start_and_monitor("ML Service", "ml_service", "server.py", 8001)
        bk = start_and_monitor("Backend", "backend", "server.py", 8000)
        fe = start_and_monitor("Frontend", "frontend", "npm start", 3000)
        
        print("\n=== SYSTEM INITIALIZED ===")
        print("1. ML Service (8001)")
        print("2. Backend API (8000)")
        print("3. Frontend UI (3000)")
        print("\nWait for the React tab to open in your browser.")
        print("Once it opens, try the PDF upload again.")
