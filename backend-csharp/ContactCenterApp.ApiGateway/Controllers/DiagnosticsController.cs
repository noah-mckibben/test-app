using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ContactCenterApp.Data;

namespace ContactCenterApp.ApiGateway.Controllers
{
    [ApiController]
    [Route("api/admin/diagnostics")]
    [Authorize]
    public class DiagnosticsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DiagnosticsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("health")]
        public ActionResult<DiagnosticsResponse> GetHealth()
        {
            try
            {
                var canConnectDb = _context.Database.CanConnect();
                var userCount = _context.Users.Count();

                return Ok(new DiagnosticsResponse
                {
                    Status = "healthy",
                    DatabaseConnected = canConnectDb,
                    UserCount = userCount,
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new DiagnosticsResponse
                {
                    Status = "unhealthy",
                    DatabaseConnected = false,
                    Error = ex.Message,
                    Timestamp = DateTime.UtcNow
                });
            }
        }
    }

    public class DiagnosticsResponse
    {
        public string Status { get; set; } = string.Empty;
        public bool DatabaseConnected { get; set; }
        public int UserCount { get; set; }
        public string? Error { get; set; }
        public DateTime Timestamp { get; set; }
    }
}
