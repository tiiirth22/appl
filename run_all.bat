@echo off
SETLOCAL EnableDelayedExpansion

echo ========================================================
echo ApplianceIQ Local Deployment Automation (Ngrok Version)
echo ========================================================
echo.

:: Check for NGROK_AUTHTOKEN
if "%NGROK_AUTHTOKEN%"=="" (
    echo [WARNING] NGROK_AUTHTOKEN not set in environment.
    echo Please set it by running: setx NGROK_AUTHTOKEN your_token_here
    echo OR enter it now for this session:
    set /p NGROK_AUTHTOKEN="Enter ngrok authtoken: "
    ngrok config add-authtoken !NGROK_AUTHTOKEN!
)

:: 1. Start Unified ML Service (Port 8001)
echo [1/5] Starting Unified ML Service (RAG + Ingestion)...
start "ApplianceIQ-ML-Service" /D "ml_service" cmd /k "..\venv\Scripts\python server.py"

:: 2. Start Backend Server (Port 8000)
echo [2/5] Starting Backend (Router/Auth)...
start "ApplianceIQ-Backend" /D "backend" cmd /k "..\venv\Scripts\python server.py"

:: 3. Start Frontend Server (Port 3000)
echo [3/5] Starting Frontend (React App)...
start "ApplianceIQ-Frontend" /D "frontend" cmd /k "npm start"

:: 4. Start Backend Tunnel
echo [4/5] Starting Public Backend Tunnel (ngrok)...
start "ApplianceIQ-Backend-Tunnel" cmd /k "ngrok http 8000"

:: 5. Start Frontend Tunnel
echo [5/5] Starting Public Frontend Tunnel (ngrok)...
start "ApplianceIQ-Frontend-Tunnel" cmd /k "ngrok http 3000"

echo.
echo ========================================================
echo SYSTEM INITIALIZING...
echo.
echo 1. Wait for ngrok windows to show "Forwarding" URLs.
echo 2. Update backend/.env with your FRONTEND ngrok URL (APP_BASE_URL).
echo 3. Update frontend/.env with your BACKEND ngrok URL (REACT_APP_BACKEND_URL).
echo 4. Restart the servers if needed.
echo ========================================================
echo.
echo Keep all command windows open while you are testing.
pause
