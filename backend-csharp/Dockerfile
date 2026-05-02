FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
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

FROM build AS publish
RUN dotnet publish "ContactCenterApp.ApiGateway/ContactCenterApp.ApiGateway.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=publish /app/publish .
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENTRYPOINT ["dotnet", "ContactCenterApp.ApiGateway.dll"]