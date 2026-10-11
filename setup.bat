@echo off
title WildWalk Setup
cd /d "%~dp0"
echo ==============================
echo   WildWalk ONE-TIME SETUP
echo ==============================

where python >nul 2>nul || (echo [X] Python nahi mila. python.org se install karo ^(Add to PATH tick karo^). & pause & exit /b)
where ollama >nul 2>nul || (echo [X] Ollama nahi mila. ollama.com se install karo. & pause & exit /b)

if not exist .venv (echo [1/4] Python environment bana raha hoon... & python -m venv .venv)
call .venv\Scripts\activate.bat

echo [2/4] Libraries install ho rahi hain (2-5 min)...
python -m pip install --upgrade pip >nul
pip install -r requirements.txt || (echo [X] pip install fail hua. Upar ka error bhejo. & pause & exit /b)

if not exist .env (echo [3/4] .env file bana raha hoon... & copy .env.example .env >nul)

echo [4/4] Gemma model download ho raha hai (2-3 min)...
ollama pull gemma3:1b
ollama pull nomic-embed-text

echo.
echo ==============================
echo   SETUP COMPLETE
echo ==============================
echo Ab .env file mein keys bharo. Notepad khul raha hai.
echo Save karke band karo, phir start_all.bat chalao.
notepad .env
pause