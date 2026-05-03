using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ContactCenterApp.Data;
using ContactCenterApp.Shared.Entities;
using ContactCenterApp.Shared.DTOs;
using System.Security.Claims;

namespace ContactCenterApp.ApiGateway.Controllers
{
    [ApiController]
    [Route("api/calls")]
    [Authorize]
    public class CallController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CallController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        }

        [HttpGet]
        public ActionResult<List<CallRecordDto>> GetCallHistory()
        {
            var userId = GetCurrentUserId();
            var callRecords = _context.CallRecords
                .Where(c => c.AgentId == userId)
                .Select(c => new CallRecordDto
                {
                    Id = c.Id,
                    AgentId = c.AgentId,
                    CallSid = c.CallSid,
                    Direction = c.Direction,
                    Status = c.Status,
                    FromNumber = c.FromNumber,
                    ToNumber = c.ToNumber,
                    DurationSeconds = c.DurationSeconds,
                    RecordingUrl = c.RecordingUrl
                })
                .OrderByDescending(c => c.Id)
                .ToList();

            return Ok(callRecords);
        }

        [HttpPost("pstn")]
        public async Task<ActionResult<CallRecordDto>> InitiatePstnCall([FromBody] InitiateCallRequest request)
        {
            var userId = GetCurrentUserId();
            var callRecord = new CallRecord
            {
                AgentId = userId,
                CallSid = Guid.NewGuid().ToString(),
                Direction = "OUTBOUND",
                Status = "INITIATED",
                FromNumber = _context.Users.FirstOrDefault(u => u.Id == userId)?.PhoneNumber,
                ToNumber = request.PhoneNumber,
                CreatedAt = DateTime.UtcNow
            };

            _context.CallRecords.Add(callRecord);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCallHistory), new CallRecordDto
            {
                Id = callRecord.Id,
                AgentId = callRecord.AgentId,
                CallSid = callRecord.CallSid,
                Direction = callRecord.Direction,
                Status = callRecord.Status,
                FromNumber = callRecord.FromNumber,
                ToNumber = callRecord.ToNumber
            });
        }

        [HttpPut("{id}/status")]
        public async Task<ActionResult> UpdateCallStatus(int id, [FromBody] UpdateCallStatusRequest request)
        {
            var callRecord = _context.CallRecords.FirstOrDefault(c => c.Id == id);
            if (callRecord == null) return NotFound();

            callRecord.Status = request.Status;
            callRecord.EndTime = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
