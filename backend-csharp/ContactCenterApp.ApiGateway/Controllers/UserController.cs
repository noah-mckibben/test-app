using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ContactCenterApp.Data;
using ContactCenterApp.Shared.DTOs;
using System.Security.Claims;

namespace ContactCenterApp.ApiGateway.Controllers
{
    [ApiController]
    [Route("api/users")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UserController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        }

        [HttpGet("me")]
        public ActionResult<UserDto> GetMe()
        {
            var userId = GetCurrentUserId();
            var user = _context.Users.FirstOrDefault(u => u.Id == userId);
            if (user == null) return NotFound();

            return Ok(new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                FullName = user.FullName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role,
                Status = user.Status
            });
        }

        [HttpGet("online")]
        public ActionResult<List<UserSlimDto>> GetOnlineUsers()
        {
            var onlineUsers = _context.Users
                .Where(u => u.Status != "OFFLINE")
                .Select(u => new UserSlimDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    FullName = u.FullName,
                    Status = u.Status
                })
                .ToList();

            return Ok(onlineUsers);
        }

        [HttpGet("search")]
        public ActionResult<List<UserSlimDto>> SearchUsers([FromQuery] string query)
        {
            var results = _context.Users
                .Where(u => u.Username.Contains(query) || u.FullName.Contains(query))
                .Select(u => new UserSlimDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    FullName = u.FullName,
                    Status = u.Status
                })
                .Take(20)
                .ToList();

            return Ok(results);
        }

        [HttpPut("status")]
        public async Task<ActionResult> UpdateStatus([FromBody] UpdateUserStatusRequest request)
        {
            var userId = GetCurrentUserId();
            var user = _context.Users.FirstOrDefault(u => u.Id == userId);
            if (user == null) return NotFound();

            user.Status = request.Status;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPut("me/avatar")]
        public async Task<ActionResult> UpdateAvatar([FromBody] UpdateAvatarRequest request)
        {
            var userId = GetCurrentUserId();
            var user = _context.Users.FirstOrDefault(u => u.Id == userId);
            if (user == null) return NotFound();

            user.AvatarData = request.AvatarData;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPut("me/profile")]
        public async Task<ActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            var userId = GetCurrentUserId();
            var user = _context.Users.FirstOrDefault(u => u.Id == userId);
            if (user == null) return NotFound();

            user.FullName = request.FullName;
            user.Email = request.Email;
            user.PhoneNumber = request.PhoneNumber;
            user.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}