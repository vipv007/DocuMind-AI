@echo off
SETLOCAL EnableDelayedExpansion

echo ==========================================
echo    DocuMind AI - Professional Setup
echo ==========================================
echo.

:: Check for Node.js
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed! 
    echo Please download it from https://nodejs.org
    pause
    exit /b
)

echo [1/3] Installing dependencies...
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed. Please check your internet connection.
    pause
    exit /b
)

echo.
echo [2/3] Checking environment variables...
if not exist .env.local (
    echo [INFO] .env.local not found. Creating a template...
    echo GOOGLE_API_KEY=PASTE_YOUR_GEMINI_API_KEY_HERE > .env.local
    echo [SUCCESS] .env.local created. 
    echo Please open it and add your Gemini API Key.
) else (
    echo [SUCCESS] .env.local already exists.
)

echo.
echo [3/3] Finalizing...
echo.
echo ==========================================
echo    SETUP COMPLETE! 
echo ==========================================
echo.
echo Instructions to run:
echo 1. Open .env.local and paste your Gemini API Key.
echo 2. Run: npm run dev
echo 3. Open: http://localhost:3000
echo.
echo Happy coding!
pause
