# Contact Center Platform

A full-stack contact center platform built with **C# ASP.NET Core** and **React 18**. It supports inbound and outbound voice calling via the Twilio Programmable Voice SDK, agent management, outbound campaign dialing with configurable recycling, work type queues with DNIS/TFN numbering plans, visual call flow (IVR) design, and a real-time agent presence system.

---

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Configuration](#configuration)
- [Running Locally](#running-locally)
- [Docker Setup](#docker-setup)
- [Deployment to Azure](#deployment-to-azure)
- [API Reference](#api-reference)
- [Development](#development)

---

## Architecture

```
Browser (React 18 / Vite)
  │
  ├── REST (HTTPS)           ──►  C# API Gateway  ──►  Microservices  ──►  SQL Server (Azure)
  │   Static Files (SPA)
  │
  ├── WebSocket (/ws/signal) ──►  SignalingHandler  (WebRTC offer/answer/ICE relay)
  │
  └── Twilio Voice SDK  ──►  Twilio Cloud
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
             Inbound PSTN               Outbound campaigns
          (route by DNIS to            (CampaignService
           WorkType agents)             scheduled tasks)
```

- **Frontend**: React SPA compiled into C# backend's static files, served directly from ASP.NET Core
- **Backend**: Microservices architecture with API Gateway as the main entry point
- **In-app calls** use WebRTC (peer-to-peer audio after signaling handshake)
- **PSTN calls** route through Twilio; audio flows via Twilio's infrastructure
- **Inbound routing** matches the dialed number (DNIS) to a WorkType and rings only the agents staffed in that queue
- **Outbound campaigns** are driven by scheduled tasks that dial contacts according to the campaign's dialing mode

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | C# 13, .NET 10, ASP.NET Core 10 |
| **Architecture** | Microservices (API Gateway, Auth, User, Campaign, Contact, Call, WorkType, Admin services) |
| **Database** | Microsoft SQL Server (Azure SQL), Entity Framework Core 8 |
| **Auth** | JWT (stateless sessions) |
| **Real-time** | WebSocket for WebRTC signaling |
| **Voice** | Twilio Programmable Voice SDK (browser + REST) |
| **Frontend** | React 18, Vite 4, React Router 6, Tailwind CSS, Lucide icons |
| **Containerization** | Docker (multi-stage build: Node + .NET) |
| **CI/CD** | GitHub Actions → Azure Container Registry → Azure Container Apps |

---

## Features

### Agent Experience
- **Profile dropdown** — embedded dialpad, contacts manager, and settings panel
- **Profile picture** — upload and display from the profile dropdown
- **Agent status** — ONLINE / BUSY / OFFLINE with live presence tracking
- **Embedded dialpad** — full keypad with name/number lookup, call controls, and history
- **Contacts** — add, search, and delete personal contacts; click-to-dial
- **In-app calls** — call other agents via WebRTC (no PSTN cost)

### Outbound Campaigns
- **Dialing modes**: PREVIEW, POWER, PREDICTIVE, BLASTER
- **Recycling**: configurable multi-pass recycling with customizable outcomes
- **Auto-completion**: campaigns auto-complete when all contacts reach terminal state
- **Live campaign management**: change dialing mode, monitor progress, recycle passes
- **CSV contact upload**: bulk-import contacts by name and phone

### Work Types & Numbering Plan
- **Work Types**: queues that agents are staffed in
- **DNIS / TFN**: assign Twilio numbers to work types for routing
- **Call Flow assignment**: link IVR flows to work types
- **Agent staffing**: manage agent assignments per work type

### Call Flows (IVR Builder)
- Visual node-based IVR designer
- Store entire graph (nodes + edges) as JSON
- Assign to work types for inbound call handling

### Admin Panel
- **Users**: create, edit, delete agents; assign roles
- **Work Types**: manage queues, numbering plans, call flows, staffing
- **Campaigns**: create and manage campaigns with recycling
- **Call Flows**: design IVR flows
- **Integrations**: manage third-party integrations
- **Diagnostics**: view system events, health dashboard, manual testing

### Security
- Stateless JWT authentication
- Role-based access control (ADMIN, SUPERVISOR, AGENT)
- TLS/HTTPS for all communications
- Secure credential management via environment variables

---

## Project Structure

```
test-app/
├── frontend/                        # React 18 + Vite SPA
│   ├── package.json
│   ├── vite.config.js              # Outputs to backend-csharp wwwroot
│   ├── src/
│   │   ├── App.jsx                 # Router setup
│   │   ├── components/             # React components
│   │   ├── context/                # State management (Twilio, calls, etc.)
│   │   ├── lib/                    # API client wrapper
│   │   └── pages/                  # Page components
│   └── public/
│
├── backend-csharp/                  # C# ASP.NET Core backend
│   ├── ContactCenterApp.sln         # Solution file
│   ├── Dockerfile                   # Multi-stage: Node (frontend) + .NET (backend)
│   ├── docker-compose.yml           # Local development with SQL Server
│   ├── .dockerignore
│   │
│   ├── ContactCenterApp.ApiGateway/
│   │   ├── Program.cs               # Entry point, middleware, routing
│   │   ├── Controllers/             # REST API endpoints
│   │   ├── wwwroot/                 # React compiled assets (auto-populated)
│   │   └── ContactCenterApp.ApiGateway.csproj
│   │
│   ├── ContactCenterApp.Shared/     # Domain models, DTOs, security
│   ├── ContactCenterApp.Data/       # Entity Framework Core DbContext
│   ├── ContactCenterApp.AuthService/
│   ├── ContactCenterApp.UserService/
│   ├── ContactCenterApp.CampaignService/
│   ├── ContactCenterApp.ContactService/
│   ├── ContactCenterApp.CallService/
│   ├── ContactCenterApp.WorkTypeService/
│   └── ContactCenterApp.AdminService/
│
├── build-and-run.sh                 # Unix/Mac build and run script
├── build-and-run.cmd                # Windows build and run script
├── README.md                         # This file
└── SETUP.md                         # Detailed setup and deployment guide
```

---

## Prerequisites

### Local Development
- **.NET 10 SDK** ([Download](https://dotnet.microsoft.com/download))
- **Node.js 18+** ([Download](https://nodejs.org/))
- **Docker** (optional, for containerized development)
- **Microsoft SQL Server** (local or container)

### Twilio
- Twilio account with:
  - A purchased phone number
  - A TwiML App with Voice Request URL pointing to `/api/twilio/voice`
  - API Key credentials

### Azure (for deployment)
- Azure subscription
- Azure Container Registry
- Azure Container Apps
- Azure SQL Database (or on-premises SQL Server)

---

## Configuration

All secrets are injected via environment variables.

### Environment Variables

| Variable | Description | Example |
|---|---|---|
| `ASPNETCORE_ENVIRONMENT` | Environment (Development/Production) | `Production` |
| `ConnectionStrings__DefaultConnection` | SQL Server connection string | `Server=myserver;Database=ContactCenterApp;...` |
| `Jwt__Secret` | JWT signing secret (≥32 chars) | Random string |
| `Twilio__AccountSid` | Twilio Account SID | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `Twilio__AuthToken` | Twilio Auth Token | Token value |
| `Twilio__PhoneNumber` | Default Twilio number | `+15550001234` |

### Local Development
Create a `.env` file in `backend-csharp/` (git-ignored):
```
ASPNETCORE_ENVIRONMENT=Development
ConnectionStrings__DefaultConnection=Server=localhost;Database=ContactCenterApp;User Id=sa;Password=YourPassword123!;TrustServerCertificate=true;
Jwt__Secret=your-dev-secret-key-at-least-32-characters-long
Twilio__AccountSid=your_account_sid
Twilio__AuthToken=your_auth_token
Twilio__PhoneNumber=+15550001234
```

---

## Running Locally

### Option 1: Quick Start (with scripts)

**Unix/Mac:**
```bash
chmod +x build-and-run.sh
./build-and-run.sh
```

**Windows:**
```cmd
build-and-run.cmd
```

This builds the React frontend and starts the C# backend on `http://localhost:5000`.

### Option 2: Manual Setup

**Start SQL Server (if using Docker):**
```bash
docker run -e ACCEPT_EULA=Y -e MSSQL_SA_PASSWORD=YourPassword123! \
  -p 1433:1433 mcr.microsoft.com/mssql/server:2022-latest
```

**Build and run the backend:**
```bash
cd backend-csharp

# Build frontend
cd ../frontend
npm install
npm run build
cd ../backend-csharp

# Run backend
dotnet run
```

Access the app at `http://localhost:5000`.

### Option 3: Development Mode (with hot reload)

**Terminal 1 - Backend:**
```bash
cd backend-csharp/ContactCenterApp.ApiGateway
dotnet run
# Runs on http://localhost:5000
```

**Terminal 2 - Frontend (Vite dev server with proxy):**
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173, proxies /api to localhost:5000
```

Open `http://localhost:5173` for frontend with hot reload.

---

## Docker Setup

### Build and Run

```bash
cd backend-csharp

# Build image
docker build -t contact-center-app:latest .

# Run with SQL Server
docker-compose up
```

The app will be available at `http://localhost:5000`.

### Using Docker Compose

```bash
cd backend-csharp
docker-compose up --build
```

SQL Server will be on `localhost:1433`, API on `localhost:5000`.

---

## Deployment to Azure

### Prerequisites
1. Azure subscription with appropriate permissions
2. Azure CLI installed
3. GitHub secrets configured in your repository

### Setup Steps

1. **Create Azure resources:**
   - Resource Group
   - Azure Container Registry (ACR)
   - Azure Container Apps environment
   - Azure SQL Database

2. **Configure GitHub secrets:**
   ```
   AZURE_CREDENTIALS              # Azure login JSON
   AZURE_CONTAINER_REGISTRY_NAME  # Registry name
   AZURE_CONTAINER_REGISTRY_USERNAME
   AZURE_CONTAINER_REGISTRY_PASSWORD
   AZURE_RESOURCE_GROUP           # Resource group name
   SQL_SERVER_CONNECTION_STRING   # Production connection string
   JWT_SECRET                     # Production JWT secret (min 32 chars)
   TWILIO_ACCOUNT_SID
   TWILIO_AUTH_TOKEN
   TWILIO_PHONE_NUMBER
   ```

3. **Push to main branch:**
   ```bash
   git push origin main
   ```
   This triggers the GitHub Actions workflow which will:
   - Build the Docker image (React + .NET)
   - Push to Azure Container Registry
   - Deploy to Azure Container Apps

4. **Monitor deployment:**
   - Check GitHub Actions for workflow status
   - View logs in Azure Container Apps
   - Test health endpoint: `https://<app-url>/health`

---

## API Reference

All endpoints require `Authorization: Bearer <token>` except where noted as **public**.

### Auth (public)

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Authenticate user |

### Users

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/users/me` | Current user profile |
| `GET` | `/api/users/online` | All online users |
| `GET` | `/api/users/search?q=` | Search users |
| `PUT` | `/api/users/status` | Update user status |
| `PUT` | `/api/users/me/avatar` | Upload profile picture |
| `PUT` | `/api/users/me/profile` | Update profile |

### Contacts

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/contacts` | List user's contacts |
| `GET` | `/api/contacts/search?name=` | Search contacts |
| `POST` | `/api/contacts` | Add contact |
| `DELETE` | `/api/contacts/{id}` | Delete contact |

### Campaigns

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/campaigns` | List campaigns |
| `POST` | `/api/campaigns` | Create campaign |
| `GET` | `/api/campaigns/{id}` | Get campaign details |
| `PUT` | `/api/campaigns/{id}` | Update campaign |
| `DELETE` | `/api/campaigns/{id}` | Delete campaign |
| `POST` | `/api/campaigns/{id}/activate` | Activate campaign |
| `POST` | `/api/campaigns/{id}/pause` | Pause campaign |

### Work Types

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/work-types` | List work types |
| `POST` | `/api/work-types` | Create work type |
| `PUT` | `/api/work-types/{id}` | Update work type |
| `DELETE` | `/api/work-types/{id}` | Delete work type |

### Call Flows

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/call-flows` | List call flows |
| `POST` | `/api/call-flows` | Create call flow |
| `PUT` | `/api/call-flows/{id}` | Update call flow |
| `DELETE` | `/api/call-flows/{id}` | Delete call flow |

### Health (public)

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Service health check |

---

## Development

### Technology Stack Details

**C# Backend:**
- ASP.NET Core 10 with minimal APIs and controllers
- Entity Framework Core 8 for ORM
- JWT for stateless authentication
- Microservices architecture with API Gateway pattern
- Async/await for scalable I/O

**React Frontend:**
- Modern React 18 with hooks
- Vite for fast development and optimized builds
- React Router for SPA routing
- Tailwind CSS for styling
- Recharts for data visualization
- Twilio SDK for voice integration

### Code Organization

- **Controllers**: REST API endpoints handling HTTP requests
- **Services**: Business logic layer
- **Repositories**: Data access layer (Entity Framework)
- **DTOs**: Data transfer objects for API contracts
- **Entities**: Domain models mapped to database tables
- **Middleware**: Request/response processing (auth, logging, etc.)

### Running Tests

```bash
cd backend-csharp
dotnet test
```

### Building for Production

The GitHub Actions workflow automatically:
1. Builds the React frontend with optimizations
2. Compiles the C# backend in Release mode
3. Creates an optimized Docker image
4. Deploys to Azure Container Apps

For local production build:
```bash
cd frontend
npm run build

cd ../backend-csharp
dotnet publish -c Release -o ./publish
```

---

## Troubleshooting

### Port already in use
If port 5000 is already in use, modify the `ASPNETCORE_URLS` environment variable:
```bash
export ASPNETCORE_URLS=http://+:5001
dotnet run
```

### Database migration issues
Migrations run automatically on startup. If issues occur:
```bash
cd backend-csharp
dotnet ef database update
```

### Docker build fails
Ensure you're in the correct directory and Docker is running:
```bash
cd backend-csharp
docker build -t contact-center-app:latest .
```

### Frontend not serving
Check that the React build was placed in `backend-csharp/ContactCenterApp.ApiGateway/wwwroot/`.

---

## Support

For issues, questions, or feature requests, please open a GitHub issue in this repository.

---

**Last Updated:** May 2026  
**License:** MIT
