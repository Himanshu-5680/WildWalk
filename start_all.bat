@echo off
title WildWalk
cd /d "%~dp0"

if not exist .venv (echo [X] Pehle setup.bat chalao. & pause & exit /b)
if not exist .env (echo [X] .env nahi mila. setup.bat chalao. & pause & exit /b)

echo Starting WildWalk...

tasklist | find /i "ollama" >nul || start "" ollama serve
timeout /t 3 >nul

start "1-Temporal" cmd /k temporal server start-dev
timeout /t 8 >nul

start "2-Worker (wait for 'Worker started')" cmd /k ".venv\Scripts\python.exe -m app.worker"
timeout /t 10 >nul

start "3-Website" cmd /k ".venv\Scripts\python.exe -m uvicorn app.main:app --port 8000"
timeout /t 15 >nul

start http://localhost:8000
echo.
echo Website khul gayi: http://localhost:8000
echo Band karne ke liye teeno black windows band kar do.
pause