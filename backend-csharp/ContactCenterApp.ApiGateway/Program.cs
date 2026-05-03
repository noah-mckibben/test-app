using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using ContactCenterApp.Data;
using ContactCenterApp.Shared.Security;

var builder = WebApplication.CreateBuilder(args);

var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "your-secret-key-change-in-production";
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// Replace password placeholder if running in Azure
var dbPassword = builder.Configuration["DbPassword"];
if (!string.IsNullOrEmpty(dbPassword) && connectionString!.Contains("{PASSWORD_PLACEHOLDER}"))
{
    connectionString = connectionString.Replace("{PASSWORD_PLACEHOLDER}", dbPassword);
}

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

builder.Services.AddScoped<IJwtTokenProvider>(sp =>
    new JwtTokenProvider(jwtSecret, 86400000));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = true,
            ValidIssuer = "ContactCenterApp",
            ValidateAudience = true,
            ValidAudience = "ContactCenterApp",
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var allowedOrigins = new List<string>
        {
            "http://localhost:3000",
            "http://localhost:5000",
            "http://localhost:5173",
            "http://127.0.0.1:5000",
            "http://127.0.0.1:5173"
        };

        // Add Azure Container Apps URLs if configured
        var azureUrl = builder.Configuration["AzureUrl"];
        if (!string.IsNullOrEmpty(azureUrl))
        {
            allowedOrigins.Add(azureUrl);
        }

        // In production, allow same-origin requests
        if (!builder.Environment.IsDevelopment())
        {
            policy.AllowAnyOrigin();
        }
        else
        {
            policy.WithOrigins(allowedOrigins.ToArray());
        }

        policy.AllowAnyMethod()
            .AllowAnyHeader();

        if (builder.Environment.IsDevelopment())
        {
            policy.AllowCredentials();
        }
    });

    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

var app = builder.Build();

// Note: Migrations disabled since using shared database with Java application
// Uncomment only if needed for C# schema updates
// using (var scope = app.Services.CreateScope())
// {
//     var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
//     context.Database.Migrate();
// }

app.UseRouting();

// Health endpoint with permissive CORS
app.MapGet("/health", context => context.Response.WriteAsJsonAsync(new { status = "healthy" }))
    .WithName("Health")
    .WithOpenApi()
    .AllowAnonymous();

// CORS middleware - apply before authentication
app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.UseStaticFiles();

app.MapControllers();

app.MapFallbackToFile("index.html");

app.Run();