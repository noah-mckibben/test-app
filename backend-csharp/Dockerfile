FROM node:18-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS dotnet-build
WORKDIR /src

COPY ["ContactCenterApp.Shared/ContactCenterApp.Shared.csproj", "ContactCenterApp.Shared/"]
COPY ["ContactCenterApp.Data/ContactCenterApp.Data.csproj", "ContactCenterApp.Data/"]
COPY ["ContactCenterApp.ApiGateway/ContactCenterApp.ApiGateway.csproj", "ContactCenterApp.ApiGateway/"]
COPY ["ContactCenterApp.AuthService/ContactCenterApp.AuthService.csproj", "ContactCenterApp.AuthService/"]
COPY ["ContactCenterApp.UserService/ContactCenterApp.UserService.csproj", "ContactCenterApp.UserService/"]
COPY ["ContactCenterApp.CampaignService/ContactCenterApp.CampaignService.csproj", "ContactCenterApp.CampaignService/"]
COPY ["ContactCenterApp.ContactService/ContactCenterApp.ContactService.csproj", "ContactCenterApp.ContactService/"]
COPY ["ContactCenterApp.CallService/ContactCenterApp.CallService.csproj", "ContactCenterApp.CallService/"]
COPY ["ContactCenterApp.WorkTypeService/ContactCenterApp.WorkTypeService.csproj", "ContactCenterApp.WorkTypeService/"]
COPY ["ContactCenterApp.AdminService/ContactCenterApp.AdminService.csproj", "ContactCenterApp.AdminService/"]

RUN dotnet restore "ContactCenterApp.ApiGateway/ContactCenterApp.ApiGateway.csproj"

COPY . .
RUN dotnet build "ContactCenterApp.ApiGateway/ContactCenterApp.ApiGateway.csproj" -c Release -o /app/build

FROM dotnet-build AS dotnet-publish
RUN dotnet publish "ContactCenterApp.ApiGateway/ContactCenterApp.ApiGateway.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM dotnet-publish AS final
COPY --from=frontend-build /frontend/dist /app/publish/wwwroot

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=final /app/publish .
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1
ENTRYPOINT ["dotnet", "ContactCenterApp.ApiGateway.dll"]