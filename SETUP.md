# Detailed Setup and Deployment Guide

This guide provides step-by-step instructions for setting up the Contact Center Platform locally and deploying to Azure.

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Database Configuration](#database-configuration)
3. [Twilio Configuration](#twilio-configuration)
4. [Running the Application](#running-the-application)
5. [Docker Setup](#docker-setup)
6. [Azure Deployment](#azure-deployment)
7. [Environment Variables Reference](#environment-variables-reference)
8. [Troubleshooting](#troubleshooting)

---

## Local Development Setup

### Prerequisites

#### Windows
- **.NET 10 SDK**: https://dotnet.microsoft.com/download
- **Node.js 18+**: https://nodejs.org/
- **Docker Desktop** (optional): https://www.docker.com/products/docker-desktop
- **SQL Server** (or Docker container)
- **Git**: https://git-scm.com/

#### macOS
```bash
# Using Homebrew
brew install dotnet node
```

#### Linux (Ubuntu/Debian)
```bash
# Install .NET
wget https://dot.net/v1/dotnet-install.sh -O dotnet-install.sh
chmod +x dotnet-install.sh
./dotnet-install.sh

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd test-app

# Verify .NET installation
dotnet --version

# Verify Node.js installation
node --version
npm --version
```

---

## Database Configuration

### Option 1: SQL Server in Docker (Recommended for Development)

```bash
# Pull and run SQL Server image
docker run -d \
  -e ACCEPT_EULA=Y \
  -e MSSQL_SA_PASSWORD=YourPassword123! \
  -p 1433:1433 \
  --name sqlserver \
  mcr.microsoft.com/mssql/server:2022-latest

# Verify it's running
docker ps | grep sqlserver
```

Connection string for local development:
```
Server=localhost;Database=ContactCenterApp;User Id=sa;Password=YourPassword123!;TrustServerCertificate=true;
```

### Option 2: Local SQL Server Installation

**Windows:**
- Download from: https://www.microsoft.com/sql-server/sql-server-downloads
- Use SQL Server Express (free) or Developer Edition

**macOS/Linux:**
```bash
# Docker is the recommended approach on non-Windows systems
docker run -d -e ACCEPT_EULA=Y -e MSSQL_SA_PASSWORD=YourPassword123! \
  -p 1433:1433 mcr.microsoft.com/mssql/server:2022-latest
```

### Option 3: Azure SQL Database

For production, use Azure SQL Database:
1. Create a new Azure SQL Database resource in the Azure Portal
2. Obtain the connection string from the "Connection strings" section
3. Format: `Server=tcp:<server>.database.windows.net,1433;Initial Catalog=<database>;Persist Security Info=False;User ID=<user>;Password=<password>;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;`

---

## Twilio Configuration

### Create a Twilio Account

1. Sign up at https://www.twilio.com/
2. Verify your email and phone number
3. Get your Account SID and Auth Token from the Twilio Console

### Purchase a Phone Number

1. Go to Phone Numbers → Manage Numbers → Buy a Number
2. Select a number and confirm purchase
3. Note the phone number in E.164 format (e.g., `+15550001234`)

### Create a TwiML App

1. Go to Programmable Voice → TwiML Apps
2. Click "Create a new TwiML App"
3. Set these URLs (replace `<YOUR_DOMAIN>` with your deployment domain):
   - **Voice Request URL**: `https://<YOUR_DOMAIN>/api/twilio/voice`
   - **Status Callback URL**: `https://<YOUR_DOMAIN>/api/twilio/status-callback`
4. Save and note the TwiML App SID

### Create API Key

1. Go to Account → API Keys & Tokens
2. Create a new API Key
3. Note the SID (starts with `SK`) and Secret

### Environment Variables

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+15550001234
```

---

## Running the Application

### Quick Start (Using Build Scripts)

**Unix/macOS:**
```bash
chmod +x build-and-run.sh
./build-and-run.sh
```

**Windows:**
```cmd
build-and-run.cmd
```

This script:
1. Installs frontend dependencies
2. Builds the React app
3. Starts the C# backend on `http://localhost:5000`

### Manual Setup

#### Step 1: Set Environment Variables

Create `.env` file in `backend-csharp/` directory:

```bash
# Copy the template
cp backend-csharp/.env.example backend-csharp/.env

# Edit with your values
nano backend-csharp/.env  # or use your editor
```

`.env` file contents:
```
ASPNETCORE_ENVIRONMENT=Development
ConnectionStrings__DefaultConnection=Server=localhost;Database=ContactCenterApp;User Id=sa;Password=YourPassword123!;TrustServerCertificate=true;
Jwt__Secret=your-development-secret-key-minimum-32-characters-long
Twilio__AccountSid=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Twilio__AuthToken=your_auth_token_here
Twilio__PhoneNumber=+15550001234
```

#### Step 2: Build Frontend

```bash
cd frontend
npm install
npm run build
cd ..
```

This compiles the React app into `backend-csharp/ContactCenterApp.ApiGateway/wwwroot/`.

#### Step 3: Run Backend

```bash
cd backend-csharp/ContactCenterApp.ApiGateway
dotnet run
```

The application starts on `http://localhost:5000`.

#### Step 4: Database Initialization

On first run, Entity Framework Core automatically:
- Creates the database if it doesn't exist
- Runs all pending migrations
- Seeds initial data (if configured)

Check the console for migration messages.

### Development Mode (with Hot Reload)

For faster development iteration, run frontend and backend separately:

**Terminal 1 - Backend:**
```bash
cd backend-csharp/ContactCenterApp.ApiGateway
dotnet run
# Runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173 with Vite dev server
```

Open `http://localhost:5173` in your browser. Vite proxies `/api` requests to `http://localhost:5000`.

---

## Docker Setup

### Local Development with Docker Compose

```bash
cd backend-csharp

# Start services (SQL Server + API)
docker-compose up --build

# Verify services are running
docker-compose ps
```

Access:
- API: `http://localhost:5000`
- SQL Server: `localhost:1433`

Connection string for containers:
```
Server=mssql;Database=ContactCenterApp;User Id=sa;Password=YourPassword123!;TrustServerCertificate=true;
```

### Build Docker Image

```bash
cd backend-csharp

# Build image
docker build -t contact-center-app:latest .

# Run container
docker run -d \
  -p 5000:5000 \
  -e ConnectionStrings__DefaultConnection="..." \
  -e Jwt__Secret="..." \
  -e Twilio__AccountSid="..." \
  -e Twilio__AuthToken="..." \
  -e Twilio__PhoneNumber="..." \
  contact-center-app:latest
```

### View Logs

```bash
# Docker Compose
docker-compose logs -f api

# Docker
docker logs -f <container-id>
```

---

## Azure Deployment

### Prerequisites

- Azure subscription
- GitHub account with repository access
- Azure CLI installed: https://learn.microsoft.com/cli/azure/

### Step 1: Create Azure Resources

#### 1.1 Create Resource Group
```bash
az group create \
  --name contact-center-rg \
  --location eastus
```

#### 1.2 Create Azure Container Registry
```bash
az acr create \
  --resource-group contact-center-rg \
  --name contactcenteracr \
  --sku Basic
```

Get credentials:
```bash
az acr credential show \
  --name contactcenteracr \
  --resource-group contact-center-rg
```

Note the username, password, and login server URL.

#### 1.3 Create Azure SQL Database

```bash
# Create SQL server
az sql server create \
  --name contact-center-sql \
  --resource-group contact-center-rg \
  --admin-user sqladmin \
  --admin-password <strong-password>

# Create database
az sql db create \
  --resource-group contact-center-rg \
  --server contact-center-sql \
  --name ContactCenterApp

# Allow Azure services to access (required for Container Apps)
az sql server firewall-rule create \
  --resource-group contact-center-rg \
  --server contact-center-sql \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

Get connection string:
```bash
az sql db show-connection-string \
  --client ado.net \
  --server contact-center-sql \
  --name ContactCenterApp \
  --auth-type SqlPassword
```

#### 1.4 Create Container App Environment

```bash
az containerapp env create \
  --resource-group contact-center-rg \
  --name contact-center-env \
  --location eastus
```

#### 1.5 Create Container App

This will be done by GitHub Actions. Configure it manually first:

```bash
az containerapp create \
  --resource-group contact-center-rg \
  --name contact-center-app \
  --environment contact-center-env \
  --image contactcenteracr.azurecr.io/contact-center-app:latest \
  --target-port 5000 \
  --ingress external \
  --query properties.configuration.ingress.fqdn
```

Note the FQDN (fully qualified domain name).

### Step 2: Configure GitHub Secrets

In your GitHub repository settings, add these secrets:

1. **AZURE_CREDENTIALS** (Service Principal JSON)
   ```bash
   az ad sp create-for-rbac --name contact-center-sp --role contributor \
     --scopes /subscriptions/{subscription-id}/resourceGroups/contact-center-rg
   ```
   Copy the entire JSON output as the secret value.

2. **AZURE_SUBSCRIPTION_ID**
   ```bash
   az account show --query id -o tsv
   ```

3. **AZURE_RESOURCE_GROUP**: `contact-center-rg`

4. **AZURE_CONTAINER_REGISTRY_NAME**: `contactcenteracr`

5. **AZURE_CONTAINER_REGISTRY_USERNAME** & **PASSWORD**
   (From ACR credentials step above)

6. **SQL_SERVER_CONNECTION_STRING**
   (From Azure SQL connection string step above, with actual password)

7. **JWT_SECRET**: Generate a strong 32+ character secret
   ```bash
   openssl rand -base64 32
   ```

8. **TWILIO_ACCOUNT_SID**, **TWILIO_AUTH_TOKEN**, **TWILIO_PHONE_NUMBER**
   (From Twilio setup)

### Step 3: Enable GitHub Actions

Ensure GitHub Actions is enabled in your repository:
1. Go to Settings → Actions → General
2. Ensure "Allow all actions and reusable workflows" is selected

### Step 4: Deploy

Push to the main branch to trigger automatic deployment:

```bash
git add .
git commit -m "Deploy to Azure"
git push origin main
```

Monitor the deployment:
1. Go to GitHub → Actions tab
2. Watch the "Deploy C# Backend to Azure Container Apps" workflow
3. Check logs for any issues

### Step 5: Verify Deployment

```bash
# Get the Container App URL
az containerapp show \
  --resource-group contact-center-rg \
  --name contact-center-app \
  --query properties.configuration.ingress.fqdn

# Test health endpoint
curl https://<container-app-url>/health

# View logs
az containerapp logs show \
  --resource-group contact-center-rg \
  --name contact-center-app
```

### Step 6: Update Twilio TwiML App

Update your Twilio TwiML App settings with the new domain:
1. Go to Twilio Console → Programmable Voice → TwiML Apps
2. Update Voice Request URL to: `https://<container-app-url>/api/twilio/voice`
3. Update Status Callback URL to: `https://<container-app-url>/api/twilio/status-callback`
4. Save changes

### Step 7: Configure Custom Domain (Optional)

To use a custom domain instead of the Azure-generated URL:

```bash
# Add custom domain
az containerapp hostname bind \
  --resource-group contact-center-rg \
  --name contact-center-app \
  --hostname yourdomain.com \
  --certificate-id <cert-resource-id>
```

---

## Environment Variables Reference

### ASP.NET Core Settings

| Variable | Default | Description |
|---|---|---|
| `ASPNETCORE_ENVIRONMENT` | `Development` | Environment (Development/Production) |
| `ASPNETCORE_URLS` | `http://+:5000` | Server URLs |
| `ASPNETCORE_HTTPS_PORT` | `5001` | HTTPS port |

### Database

| Variable | Required | Description |
|---|---|---|
| `ConnectionStrings__DefaultConnection` | Yes | SQL Server connection string |

### JWT / Security

| Variable | Required | Min Length | Description |
|---|---|---|---|
| `Jwt__Secret` | Yes | 32 | JWT signing secret |
| `Jwt__Issuer` | No | — | JWT issuer claim |
| `Jwt__Audience` | No | — | JWT audience claim |
| `Jwt__ExpirationMinutes` | No | — | Token expiration (default: 24h) |

### Twilio

| Variable | Required | Description |
|---|---|---|
| `Twilio__AccountSid` | Yes | Twilio Account SID (AC...) |
| `Twilio__AuthToken` | Yes | Twilio Auth Token |
| `Twilio__PhoneNumber` | Yes | Default Twilio phone number (E.164) |
| `Twilio__TwiMLAppSid` | No | TwiML App SID (optional) |

### Logging

| Variable | Options | Description |
|---|---|---|
| `Serilog__MinimumLevel__Default` | Debug, Information, Warning, Error, Fatal | Minimum log level |

---

## Troubleshooting

### Port Already in Use

```bash
# Change port
export ASPNETCORE_URLS=http://+:5001
dotnet run
```

### Database Connection Failed

1. Verify SQL Server is running:
   ```bash
   sqlcmd -S localhost -U sa -P YourPassword123!
   ```

2. Check connection string format

3. Verify firewall rules (for Azure SQL)

### Frontend Not Serving

1. Verify React build completed:
   ```bash
   ls backend-csharp/ContactCenterApp.ApiGateway/wwwroot/
   ```

2. Rebuild frontend:
   ```bash
   cd frontend
   npm run build
   ```

3. Restart backend

### Docker Build Fails

```bash
# Clean Docker
docker system prune -a

# Rebuild with no cache
docker build --no-cache -t contact-center-app:latest .
```

### GitHub Actions Workflow Fails

1. Check workflow logs in GitHub Actions tab
2. Verify all secrets are configured correctly
3. Check Azure resource limits (quotas)
4. Review Azure Container Apps metrics

### Authentication Issues

1. Verify JWT secret is same between environments
2. Check token expiration time
3. Ensure Authorization header format: `Bearer <token>`

### Twilio Integration Not Working

1. Verify Account SID and Auth Token are correct
2. Check TwiML App URLs are pointing to correct domain
3. Test webhook with: `curl -X POST https://<domain>/api/twilio/voice`
4. Check Twilio Console → Debugger for errors

### Performance Issues

1. Monitor Container App CPU and Memory:
   ```bash
   az containerapp show \
     --resource-group contact-center-rg \
     --name contact-center-app \
     --query properties.template.containers[0].resources
   ```

2. Increase resources:
   ```bash
   az containerapp update \
     --resource-group contact-center-rg \
     --name contact-center-app \
     --cpu 2.0 --memory 4Gi
   ```

3. Enable auto-scaling:
   ```bash
   az containerapp update \
     --resource-group contact-center-rg \
     --name contact-center-app \
     --min-replicas 2 --max-replicas 10
   ```

---

## Getting Help

- **GitHub Issues**: Create an issue in the repository
- **Twilio Support**: https://support.twilio.com/
- **Azure Support**: https://portal.azure.com/

---

**Last Updated:** May 2026
