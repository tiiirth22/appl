@echo off
SETLOCAL EnableDelayedExpansion

echo ========================================================
echo ApplianceIQ LOCAL ONLY STARTUP
echo ========================================================
echo.

:: 1. Start Chat Service (Port 8001)
echo [1/4] Starting Chat Service (RAG)...
start "ApplianceIQ-Chat-Service" /D "chat_service" cmd /k "..\venv\Scripts\python server.py"

:: 2. Start Ingestion Service (Port 8002)
echo [2/4] Starting Ingestion Service (Indexing)...
start "ApplianceIQ-Ingestion-Service" /D "ingestion_service" cmd /k "..\venv\Scripts\python server.py"

:: 3. Start Backend Server (Port 8000)
echo [3/4] Starting Backend (Router/Auth)...
start "ApplianceIQ-Backend" /D "backend" cmd /k "..\venv\Scripts\python server.py"

:: 4. Start Frontend Server (Port 3000)
echo [4/4] Starting Frontend (React App)...
start "ApplianceIQ-Frontend" /D "frontend" cmd /k "npm start"

echo.
echo ========================================================
echo SYSTEM INITIALIZING...
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo ========================================================
echo.
echo Press any key to close this launcher...
pause > nul
