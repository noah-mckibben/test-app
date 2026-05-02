# ContactCenterApp - C# ASP.NET Core Backend

Complete microservices backend rebuilt in C# ASP.NET Core with .NET 10.

## Project Structure

- **ContactCenterApp.Shared**: Domain entities, DTOs, security
- **ContactCenterApp.Data**: Entity Framework Core database context
- **ContactCenterApp.ApiGateway**: Main API Gateway (Controllers)
- **ContactCenterApp.AuthService**: Authentication microservice
- **ContactCenterApp.UserService**: User management microservice
- **ContactCenterApp.CampaignService**: Campaign management microservice
- **ContactCenterApp.ContactService**: Personal contacts microservice
- **ContactCenterApp.CallService**: Call recording and management
- **ContactCenterApp.WorkTypeService**: Work type management
- **ContactCenterApp.AdminService**: Admin operations

## Getting Started

### Prerequisites
- .NET 10 SDK
- SQL Server (local or Docker)
- Docker & Docker Compose (optional, for containerized setup)

### Local Development

1. Create database:
   ```bash
   dotnet ef database update --project ContactCenterApp.Data --startup-project ContactCenterApp.ApiGateway
   ```

2. Run API Gateway:
   ```bash
   dotnet run --project ContactCenterApp.ApiGateway
   ```

The API will be available at `http://localhost:5000`

### Docker Setup

```bash
docker-compose up -d
```

## API Endpoints

### Authentication
- POST /api/auth/login
- POST /api/auth/register

### Users
- GET /api/users/me
- GET /api/users/online
- PUT /api/users/status
- PUT /api/users/me/avatar
- PUT /api/users/me/profile

### Contacts
- GET /api/contacts
- POST /api/contacts
- PUT /api/contacts/{id}
- DELETE /api/contacts/{id}

### Campaigns
- GET /api/admin/campaigns
- POST /api/admin/campaigns
- PUT /api/admin/campaigns/{id}
- DELETE /api/admin/campaigns/{id}

## Configuration

Set environment variables in `appsettings.json`:
- `ConnectionStrings:DefaultConnection` - SQL Server connection string
- `Jwt:Secret` - JWT signing secret (min 32 characters in production)

## Technology Stack

- .NET 10
- ASP.NET Core
- Entity Framework Core 8.0
- SQL Server
- JWT Authentication
- BCrypt for password hashing

## License

All rights reserved