@echo off
echo ========================================
echo  Arynox-EDU Launcher - Build Script
echo ========================================
echo.

REM Check for dotnet
where dotnet >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] dotnet SDK not found.
    echo [INFO] Install from: https://dotnet.microsoft.com/download
    echo.
    echo [INFO] Trying alternative: Build with csc.exe (netfx)
    where csc >nul 2>nul
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] No C# compiler found.
        echo Install Visual Studio Build Tools or dotnet SDK.
        echo.
        echo As fallback, copy Arynox-EDU-Launcher.bat to the same folder.
        pause
        exit /b 1
    )
    echo Compiling with csc.exe...
    csc.exe -target:winexe -out:"..\Arynox-EDU-Launcher.exe" -win32icon:icons\app.ico -reference:System.Windows.Forms.dll -reference:System.Drawing.dll Program.cs
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo SUCCESS: ..\Arynox-EDU-Launcher.exe created!
    ) else (
        echo FAILED to compile.
    )
    pause
    exit /b
)

REM dotnet found - build
echo [INFO] dotnet SDK found. Building...
dotnet restore
if %ERRORLEVEL% NEQ 0 (
    echo Restore failed
    pause
    exit /b 1
)

dotnet publish -c Release -r win-x64 --self-contained true -o ..\launcher-build
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo  SUCCESS!
    echo  EXE: ..\launcher-build\Arynox-EDU-Launcher.exe
    echo  Size: ~30MB (self-contained .NET 8)
    echo ========================================
    echo.
    echo To create a smaller EXE (requires .NET runtime):
    dotnet publish -c Release -r win-x64 --self-contained false -o ..\launcher-build-small
    echo.
) else (
    echo Build failed
)
pause