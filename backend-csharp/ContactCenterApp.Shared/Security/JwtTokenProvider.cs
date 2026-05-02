using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace ContactCenterApp.Shared.Security
{
    public interface IJwtTokenProvider
    {
        string GenerateToken(int userId, string username, string role);
        TokenValidationResult ValidateToken(string token);
        int GetUserIdFromToken(string token);
    }

    public class TokenValidationResult
    {
        public bool Valid { get; set; }
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }

    public class JwtTokenProvider : IJwtTokenProvider
    {
        private readonly string _secret;
        private readonly int _expirationMs;
        private readonly string _issuer = "ContactCenterApp";
        private readonly string _audience = "ContactCenterApp";

        public JwtTokenProvider(string secret, int expirationMs = 86400000)
        {
            _secret = secret;
            _expirationMs = expirationMs;
        }

        public string GenerateToken(int userId, string username, string role)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Name, username),
                new Claim(ClaimTypes.Role, role)
            };

            var token = new JwtSecurityToken(
                issuer: _issuer,
                audience: _audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMilliseconds(_expirationMs),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public TokenValidationResult ValidateToken(string token)
        {
            try
            {
                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
                var handler = new JwtSecurityTokenHandler();

                var principal = handler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = key,
                    ValidateIssuer = true,
                    ValidIssuer = _issuer,
                    ValidateAudience = true,
                    ValidAudience = _audience,
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                }, out SecurityToken validatedToken);

                var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var usernameClaim = principal.FindFirst(ClaimTypes.Name)?.Value;
                var roleClaim = principal.FindFirst(ClaimTypes.Role)?.Value;

                return new TokenValidationResult
                {
                    Valid = true,
                    UserId = int.Parse(userIdClaim ?? "0"),
                    Username = usernameClaim ?? string.Empty,
                    Role = roleClaim ?? string.Empty
                };
            }
            catch
            {
                return new TokenValidationResult { Valid = false };
            }
        }

        public int GetUserIdFromToken(string token)
        {
            try
            {
                var handler = new JwtSecurityTokenHandler();
                var jwtToken = handler.ReadJwtToken(token);
                var userIdClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);
                return int.Parse(userIdClaim?.Value ?? "0");
            }
            catch
            {
                return 0;
            }
        }
    }
}