@echo off
title Arynox-EDU Build & Package
cd /d "%~dp0"

echo =============================================
echo   Arynox-EDU - Build & Package Script
echo =============================================
echo.

:: 1. Install dependencies
if not exist "node_modules" (
    echo [1/4] Installing dependencies...
    call npm install
) else (
    echo [1/4] Dependencies already installed
)

:: 2. Build Next.js
echo [2/4] Building Next.js production bundle...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed
    pause
    exit /b 1
)

:: 3. Create launcher EXE
echo [3/4] Building launcher EXE...

:: Check for dotnet
where dotnet >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    cd launcher
    dotnet publish -c Release -r win-x64 --self-contained false -o ..\launcher-build >nul 2>nul
    cd ..
    if exist "launcher-build\Arynox-EDU-Launcher.exe" (
        echo [OK] Launcher EXE created: launcher-build\Arynox-EDU-Launcher.exe
    ) else (
        echo [WARN] dotnet build failed. Using batch fallback.
    )
) else (
    echo [WARN] dotnet not found. Use Arynox-EDU-Launcher.bat instead.
)

:: 4. Create distribution package
echo [4/4] Creating distribution zip...

if exist "dist" rmdir /s /q dist
mkdir dist 2>nul

:: Copy essential files
xcopy /E /I /Y ".next" "dist\.next" >nul
xcopy /E /I /Y "public" "dist\public" >nul
xcopy /E /I /Y "node_modules\next" "dist\node_modules\next" >nul
xcopy /E /I /Y "node_modules\react" "dist\node_modules\react" >nul
xcopy /E /I /Y "node_modules\react-dom" "dist\node_modules\react-dom" >nul
copy "package.json" "dist\package.json" >nul
copy "next.config.ts" "dist\next.config.ts" >nul
copy "Arynox-EDU-Launcher.bat" "dist\Arynox-EDU-Launcher.bat" >nul
copy "Arynox-EDU.ps1" "dist\Arynox-EDU.ps1" >nul
copy ".env.example" "dist\.env.example" >nul

if exist "launcher-build\Arynox-EDU-Launcher.exe" (
    copy "launcher-build\Arynox-EDU-Launcher.exe" "dist\Arynox-EDU-Launcher.exe" >nul
)

:: Zip it
if exist "dist.zip" del "dist.zip"
powershell -Command "Compress-Archive -Path dist\* -DestinationPath dist.zip -Force" >nul

echo.
echo =============================================
echo   BUILD COMPLETE!
echo =============================================
echo   Production build:  .next\
echo   Launcher EXE:      launcher-build\Arynox-EDU-Launcher.exe
echo   Distribution zip:  dist.zip
echo =============================================
echo.
echo To distribute:
echo   1. Copy dist.zip to target machine
echo   2. Extract and run Arynox-EDU-Launcher.exe
echo   3. Or run Arynox-EDU-Launcher.bat
echo.

pause