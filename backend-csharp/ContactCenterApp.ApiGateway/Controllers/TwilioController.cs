using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace ContactCenterApp.ApiGateway.Controllers
{
    [ApiController]
    [Route("api/twilio")]
    [Authorize]
    public class TwilioController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public TwilioController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        }

        [HttpGet("token")]
        public ActionResult<TwilioTokenResponse> GetTwilioToken()
        {
            var userId = GetCurrentUserId();
            var accountSid = _configuration["Twilio:AccountSid"];
            var authToken = _configuration["Twilio:AuthToken"];

            if (string.IsNullOrEmpty(accountSid) || string.IsNullOrEmpty(authToken))
            {
                return BadRequest(new { error = "Twilio credentials not configured" });
            }

            var token = GenerateAccessToken(accountSid, authToken, userId.ToString());

            return Ok(new TwilioTokenResponse
            {
                Token = token
            });
        }

        private string GenerateAccessToken(string accountSid, string authToken, string identity)
        {
            try
            {
                var grants = new { video = new { room = "default" } };
                var payload = new
                {
                    sub = accountSid,
                    iss = accountSid,
                    exp = DateTimeOffset.UtcNow.AddHours(1).ToUnixTimeSeconds(),
                    grants = grants
                };

                var token = System.Text.Json.JsonSerializer.Serialize(payload);
                return System.Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(token));
            }
            catch
            {
                return string.Empty;
            }
        }
    }

    public class TwilioTokenResponse
    {
        public string Token { get; set; } = string.Empty;
    }
}
