@echo off
SETLOCAL EnableDelayedExpansion

echo ========================================================
echo ApplianceIQ LOCAL ONLY STARTUP
echo ========================================================
echo.

:: 1. Start Unified ML Service (Port 8001)
echo [1/3] Starting Unified ML Service (RAG + Ingestion)...
start "ApplianceIQ-ML-Service" /D "ml_service" cmd /k "..\venv\Scripts\python server.py"

:: 2. Start Backend Server (Port 8000)
echo [2/3] Starting Backend (Router/Auth)...
start "ApplianceIQ-Backend" /D "backend" cmd /k "..\venv\Scripts\python server.py"

:: 3. Start Frontend Server (Port 3000)
echo [3/3] Starting Frontend (React App)...
start "ApplianceIQ-Frontend" /D "frontend" cmd /k "npm start"

echo.
echo ========================================================
echo SYSTEM INITIALIZING...
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo ML Service: http://localhost:8001
echo ========================================================
echo.
echo Press any key to close this launcher...
pause > nul
