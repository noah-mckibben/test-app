using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ContactCenterApp.Data;
using ContactCenterApp.Shared.Entities;
using ContactCenterApp.Shared.DTOs;

namespace ContactCenterApp.ApiGateway.Controllers
{
    [ApiController]
    [Route("api/admin/call-flows")]
    [Authorize]
    public class CallFlowController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CallFlowController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public ActionResult<List<CallFlowDto>> GetCallFlows()
        {
            var callFlows = _context.CallFlows
                .Select(c => new CallFlowDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    FlowJson = c.FlowJson,
                    IsActive = c.IsActive
                })
                .ToList();

            return Ok(callFlows);
        }

        [HttpGet("{id}")]
        public ActionResult<CallFlowDto> GetCallFlow(int id)
        {
            var callFlow = _context.CallFlows.FirstOrDefault(c => c.Id == id);
            if (callFlow == null) return NotFound();

            return Ok(new CallFlowDto
            {
                Id = callFlow.Id,
                Name = callFlow.Name,
                Description = callFlow.Description,
                FlowJson = callFlow.FlowJson,
                IsActive = callFlow.IsActive
            });
        }

        [HttpPost]
        public async Task<ActionResult<CallFlowDto>> CreateCallFlow([FromBody] CreateCallFlowRequest request)
        {
            var callFlow = new CallFlow
            {
                Name = request.Name,
                Description = request.Description,
                FlowJson = request.FlowJson,
                IsActive = true
            };

            _context.CallFlows.Add(callFlow);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCallFlow), new { id = callFlow.Id }, new CallFlowDto
            {
                Id = callFlow.Id,
                Name = callFlow.Name,
                Description = callFlow.Description,
                FlowJson = callFlow.FlowJson,
                IsActive = callFlow.IsActive
            });
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateCallFlow(int id, [FromBody] UpdateCallFlowRequest request)
        {
            var callFlow = _context.CallFlows.FirstOrDefault(c => c.Id == id);
            if (callFlow == null) return NotFound();

            callFlow.Name = request.Name;
            callFlow.Description = request.Description;
            callFlow.FlowJson = request.FlowJson;
            callFlow.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteCallFlow(int id)
        {
            var callFlow = _context.CallFlows.FirstOrDefault(c => c.Id == id);
            if (callFlow == null) return NotFound();

            _context.CallFlows.Remove(callFlow);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
