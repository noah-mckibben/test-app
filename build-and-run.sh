#!/bin/bash

set -e

echo "======================================"
echo "Building React Frontend"
echo "======================================"
cd frontend
npm install
npm run build
cd ..

echo ""
echo "======================================"
echo "Running C# Backend with Frontend"
echo "======================================"
cd backend-csharp/ContactCenterApp.ApiGateway
dotnet run
