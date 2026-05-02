@echo off
setlocal enabledelayedexpansion

echo ======================================
echo Building React Frontend
echo ======================================
cd frontend
call npm install
call npm run build
if errorlevel 1 (
    echo Frontend build failed!
    exit /b 1
)
cd ..

echo.
echo ======================================
echo Running C# Backend with Frontend
echo ======================================
cd backend-csharp\ContactCenterApp.ApiGateway
dotnet run
