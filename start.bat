@echo off
title MR-Fit Launcher
echo.
echo  ███╗   ███╗██████╗       ███████╗██╗████████╗
echo  ████╗ ████║██╔══██╗      ██╔════╝██║╚══██╔══╝
echo  ██╔████╔██║██████╔╝█████╗█████╗  ██║   ██║
echo  ██║╚██╔╝██║██╔══██╗╚════╝██╔══╝  ██║   ██║
echo  ██║ ╚═╝ ██║██║  ██║      ██║     ██║   ██║
echo  ╚═╝     ╚═╝╚═╝  ╚═╝      ╚═╝     ╚═╝   ╚═╝
echo.
echo  Starting MR-Fit full stack...
echo.

set ROOT=%~dp0
set AI_DIR=%ROOT%ai
set FRONTEND_DIR=%ROOT%frontend

:: --- Launch AI (uvicorn) in a new PowerShell tab ---
echo [1/3] Starting FastAPI AI Coach (port 8000)...
start "MR-Fit AI" powershell -NoExit -Command "cd '%AI_DIR%'; Write-Host '=== MR-Fit AI Coach ===' -ForegroundColor Cyan; uvicorn coach:app --host 127.0.0.1 --port 8000 --reload"

:: --- Wait 3 seconds for uvicorn to boot ---
timeout /t 3 /nobreak >nul

:: --- Launch Next.js in a new PowerShell tab ---
echo [2/3] Starting Next.js frontend (port 3000)...
start "MR-Fit Frontend" powershell -NoExit -Command "cd '%FRONTEND_DIR%'; Write-Host '=== MR-Fit Frontend ===' -ForegroundColor Green; npm run dev"

:: --- Wait for Next.js to be ready (poll until port 3000 responds) ---
echo [3/3] Waiting for Next.js to be ready...
:WAIT_LOOP
timeout /t 2 /nobreak >nul
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
if errorlevel 1 goto WAIT_LOOP

:: --- Open browser ---
echo.
echo  All systems go! Opening http://localhost:3000
echo.
start http://localhost:3000

echo  Press any key to close this launcher window...
pause >nul
