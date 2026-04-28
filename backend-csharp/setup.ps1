Write-Host "🚀 Creating C# Microservices Backend with .NET 10..."

# Create solution
dotnet new sln -n ContactCenterApp
dotnet new globaljson --sdk-version 10.0.0 --roll-forward feature

# Create all projects
Write-Host "📦 Creating projects..."
dotnet new classlib -n ContactCenterApp.Shared
dotnet new classlib -n ContactCenterApp.Data
dotnet new webapi -n ContactCenterApp.AuthService
dotnet new webapi -n ContactCenterApp.UserService
dotnet new webapi -n ContactCenterApp.CampaignService
dotnet new webapi -n ContactCenterApp.CallService
dotnet new webapi -n ContactCenterApp.ContactService
dotnet new webapi -n ContactCenterApp.AdminService
dotnet new webapi -n ContactCenterApp.RealtimeService
dotnet new webapi -n ContactCenterApp.ApiGateway

# Add to solution
Write-Host "🔗 Adding projects to solution..."
dotnet sln add ContactCenterApp.Shared\ContactCenterApp.Shared.csproj
dotnet sln add ContactCenterApp.Data\ContactCenterApp.Data.csproj
dotnet sln add ContactCenterApp.AuthService\ContactCenterApp.AuthService.csproj
dotnet sln add ContactCenterApp.UserService\ContactCenterApp.UserService.csproj
dotnet sln add ContactCenterApp.CampaignService\ContactCenterApp.CampaignService.csproj
dotnet sln add ContactCenterApp.CallService\ContactCenterApp.CallService.csproj
dotnet sln add ContactCenterApp.ContactService\ContactCenterApp.ContactService.csproj
dotnet sln add ContactCenterApp.AdminService\ContactCenterApp.AdminService.csproj
dotnet sln add ContactCenterApp.RealtimeService\ContactCenterApp.RealtimeService.csproj
dotnet sln add ContactCenterApp.ApiGateway\ContactCenterApp.ApiGateway.csproj

# Add NuGet packages
Write-Host "📚 Installing NuGet packages..."
$projects = @("ContactCenterApp.Shared", "ContactCenterApp.Data", "ContactCenterApp.AuthService", "ContactCenterApp.UserService", "ContactCenterApp.CampaignService", "ContactCenterApp.CallService", "ContactCenterApp.ContactService", "ContactCenterApp.AdminService", "ContactCenterApp.RealtimeService", "ContactCenterApp.ApiGateway")

foreach ($project in $projects) {
  dotnet add "$project\$project.csproj" package "Serilog" --version 3.1.1 2>$null
  dotnet add "$project\$project.csproj" package "Serilog.AspNetCore" --version 8.0.1 2>$null
  dotnet add "$project\$project.csproj" package "System.IdentityModel.Tokens.Jwt" --version 7.6.0 2>$null
  dotnet add "$project\$project.csproj" package "Microsoft.IdentityModel.Tokens" --version 7.6.0 2>$null
}

dotnet add ContactCenterApp.Data\ContactCenterApp.Data.csproj package "Microsoft.EntityFrameworkCore" --version 8.0.4
dotnet add ContactCenterApp.Data\ContactCenterApp.Data.csproj package "Microsoft.EntityFrameworkCore.SqlServer" --version 8.0.4
dotnet add ContactCenterApp.Data\ContactCenterApp.Data.csproj package "Microsoft.EntityFrameworkCore.Design" --version 8.0.4

dotnet add ContactCenterApp.ApiGateway\ContactCenterApp.ApiGateway.csproj package "Microsoft.AspNetCore.Authentication.JwtBearer" --version 8.0.4
dotnet add ContactCenterApp.ApiGateway\ContactCenterApp.ApiGateway.csproj package "Microsoft.EntityFrameworkCore.SqlServer" --version 8.0.4
dotnet add ContactCenterApp.ApiGateway\ContactCenterApp.ApiGateway.csproj package "BCrypt.Net-Next" --version 4.0.3

# Add project references
Write-Host "🔀 Adding project references..."
dotnet add ContactCenterApp.Data\ContactCenterApp.Data.csproj reference ContactCenterApp.Shared\ContactCenterApp.Shared.csproj

foreach ($project in $projects) {
  dotnet add "$project\$project.csproj" reference ContactCenterApp.Shared\ContactCenterApp.Shared.csproj
  dotnet add "$project\$project.csproj" reference ContactCenterApp.Data\ContactCenterApp.Data.csproj
}

Write-Host "✅ Setup complete! Now run: dotnet build"