@echo off
echo ===================================================
echo   AL-MOUSTACHAR - Chatbot Juridique Marocain
echo ===================================================

echo.
echo [1/2] Starting Backend (FastAPI)...
start "Backend API" cmd /k "cd backend && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

echo.
echo [2/2] Starting Frontend (Vite)...
start "Frontend UI" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo   App running at: http://localhost:3000
echo   API running at: http://localhost:8000
echo ===================================================
echo.
pause
