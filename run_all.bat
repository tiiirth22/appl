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

:: 1. Start Backend Server
echo [1/4] Starting Backend (Python Server)...
start "ApplianceIQ-Backend" /D "backend" cmd /k "..\venv\Scripts\python server.py"

:: 2. Start Frontend Server
echo [2/4] Starting Frontend (React App)...
start "ApplianceIQ-Frontend" /D "frontend" cmd /k "npm start"

:: 3. Start Backend Tunnel
echo [3/4] Starting Public Backend Tunnel (ngrok)...
start "ApplianceIQ-Backend-Tunnel" cmd /k "ngrok http 8000"

:: 4. Start Frontend Tunnel
echo [4/4] Starting Public Frontend Tunnel (ngrok)...
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
