@echo off
title Arynox-EDU Launcher
cd /d "%~dp0"

echo =============================================
echo   Arynox-EDU - Quick Start Launcher
echo =============================================
echo.

:: Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found!
    echo   Install from: https://nodejs.org
    echo   After installing, reopen this launcher.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo [OK] Node.js %NODE_VER%

:: Check / install dependencies
if not exist "node_modules\next\package.json" (
    echo [*] Installing dependencies (this may take 1-2 minutes)...
    call npm install --no-audit --no-fund 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] npm install failed.
        echo Try running manually: npm install
        pause
        exit /b 1
    )
    echo [OK] Dependencies installed
) else (
    echo [OK] Dependencies found
)

:: Check .env
if not exist ".env" (
    if exist ".env.example" (
        copy .env.example .env >nul
        echo [OK] Created .env from .env.example
    ) else (
        echo [WARN] No .env or .env.example found. Create .env manually.
    )
)

:: Kill port 3000
echo [*] Freeing port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 " ^| findstr LISTENING') do (
    taskkill /f /pid %%a >nul 2>nul
)
timeout /t 1 /nobreak >nul

:: Open browser (short delay so server has time)
start http://localhost:3000

:: Start server using the local Next.js binary
echo [*] Starting Arynox-EDU on http://localhost:3000
echo [*] Press Ctrl+C to stop the server
echo.

:: Use node directly with local next dist, not npx
if exist ".next\BUILD_ID" (
    echo [*] Production mode (run 'npm run build' to update)
    node "node_modules\next\dist\bin\next" start --port 3000
) else (
    echo [*] Dev mode (first-time setup or after code changes)
    echo [*] Tip: run 'npm run build' once for faster starts
    node "node_modules\next\dist\bin\next" dev --port 3000
)

echo.
echo [INFO] Server stopped.
pause