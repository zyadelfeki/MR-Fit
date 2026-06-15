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

:: --- Ensure WSL PostgreSQL database is running ---
echo [0/4] Ensuring PostgreSQL database is active in WSL...
wsl -d Ubuntu -u root service postgresql start

:: --- Start PostgreSQL relay (bridges WSL2 PostgreSQL to Windows localhost:5432) ---
echo [1/4] Starting PostgreSQL relay (WSL2 bridge)...
start "MR-Fit PG Relay" powershell -NoExit -Command "cd '%ROOT%'; Write-Host '=== MR-Fit PG Relay ===' -ForegroundColor Yellow; node pg-proxy.js"

:: --- Wait 3 seconds for relay to bind ---
timeout /t 3 /nobreak >nul

:: --- Launch AI (uvicorn) in a new PowerShell tab ---
echo [2/4] Starting FastAPI AI Coach (port 8000)...
start "MR-Fit AI" powershell -NoExit -Command "cd '%AI_DIR%'; Write-Host '=== MR-Fit AI Coach ===' -ForegroundColor Cyan; uvicorn coach:app --host 127.0.0.1 --port 8000 --reload"

:: --- Wait 3 seconds for uvicorn to boot ---
timeout /t 3 /nobreak >nul

:: --- Launch Next.js in a new PowerShell tab ---
echo [3/4] Starting Next.js frontend (port 3000)...
start "MR-Fit Frontend" powershell -NoExit -Command "cd '%FRONTEND_DIR%'; Write-Host '=== MR-Fit Frontend ===' -ForegroundColor Green; npm run dev"

:: --- Wait for Next.js to be ready (poll until port 3000 responds) ---
echo [4/4] Waiting for Next.js to be ready...
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
