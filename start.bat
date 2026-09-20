@echo off
echo ============================================
echo    OmniDoc - Starting All Services...
echo ============================================
echo.

:: Start Backend
echo [1/2] Starting Backend ...
start "Backend" cmd /k "cd /d %~dp0backend && .\mvnw spring-boot:run"

:: Wait a moment for backend to begin initializing
timeout /t 5 /nobreak >nul

:: Start Frontend
echo [2/2] Starting Frontend ...
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ============================================
echo    All services started!
echo    Backend:  http://localhost:8080
echo    Frontend: http://localhost:5173
echo ============================================
echo.
echo You can close this window. The services
echo are running in their own windows.
pause
