@echo off
echo Starting Voyager Ecosystem...
echo ==============================================

REM Check if AI Engine dependencies are installed
if not exist "ai-engine\venv" (
    echo [1/3] Setting up Python for AI Engine - First time setup...
    cd ai-engine
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
    cd ..
)

REM Check if Backend dependencies are installed
if not exist "backend\node_modules" (
    echo [2/3] Installing Node.js dependencies for Backend...
    cd backend
    call npm install
    cd ..
)

REM Check if Frontend dependencies are installed
if not exist "frontend\node_modules" (
    echo [3/3] Installing Node.js dependencies for Frontend...
    cd frontend
    call npm install
    cd ..
)

echo.
echo Launching services in separate windows...
echo ==============================================

:: Start AI Engine (Port 8000)
echo Starting AI Engine (FastAPI) on port 8000...
start "Voyager AI Engine" cmd /k "cd ai-engine && call venv\Scripts\activate.bat && python main.py"

:: Start Backend (Port 5000)
echo Starting Backend (Node.js) on port 5000...
start "Voyager Backend" cmd /k "cd backend && npm run dev"

:: Start Frontend (Port 5173)
echo Starting Frontend (React/Vite) on port 5173...
start "Voyager Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo All services launched! You can interact with the app at:
echo frontend  - http://localhost:5173
echo backend   - http://localhost:5000
echo ai-engine - http://localhost:8000
echo.
echo Press any key to exit this launcher window...
pause >nul
