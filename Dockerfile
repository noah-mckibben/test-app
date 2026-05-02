# Build frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/ .
RUN npm install && npm run build

# Build backend
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS backend-build
WORKDIR /app
COPY backend-csharp/ .
RUN dotnet publish ContactCenterApp.ApiGateway/ContactCenterApp.ApiGateway.csproj -c Release -o out

# Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=backend-build /app/out .
COPY --from=frontend-build /app/frontend/dist ./wwwroot

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 8080
ENTRYPOINT ["dotnet", "ContactCenterApp.ApiGateway.dll"]
