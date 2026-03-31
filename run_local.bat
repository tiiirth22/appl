@echo off
SETLOCAL EnableDelayedExpansion

echo ========================================================
echo ApplianceIQ LOCAL ONLY STARTUP
echo ========================================================
echo.

:: 1. Start Backend Server
echo [1/2] Starting Backend (Python Server)...
start "ApplianceIQ-Backend" /D "backend" cmd /k "..\venv\Scripts\python server.py"

:: 2. Start Frontend Server
echo [2/2] Starting Frontend (React App)...
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
