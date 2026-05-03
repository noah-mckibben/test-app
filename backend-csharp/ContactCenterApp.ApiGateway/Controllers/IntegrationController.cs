using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ContactCenterApp.Data;
using ContactCenterApp.Shared.Entities;
using ContactCenterApp.Shared.DTOs;

namespace ContactCenterApp.ApiGateway.Controllers
{
    [ApiController]
    [Route("api/admin/integrations")]
    [Authorize]
    public class IntegrationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public IntegrationController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public ActionResult<List<IntegrationDto>> GetIntegrations()
        {
            var integrations = _context.Integrations
                .Select(i => new IntegrationDto
                {
                    Id = i.Id,
                    Name = i.Name,
                    Type = i.Type,
                    IsActive = i.IsActive
                })
                .ToList();

            return Ok(integrations);
        }

        [HttpGet("{id}")]
        public ActionResult<IntegrationDto> GetIntegration(int id)
        {
            var integration = _context.Integrations.FirstOrDefault(i => i.Id == id);
            if (integration == null) return NotFound();

            return Ok(new IntegrationDto
            {
                Id = integration.Id,
                Name = integration.Name,
                Type = integration.Type,
                IsActive = integration.IsActive
            });
        }

        [HttpPost]
        public async Task<ActionResult<IntegrationDto>> CreateIntegration([FromBody] CreateIntegrationRequest request)
        {
            var integration = new Integration
            {
                Name = request.Name,
                Type = request.Type,
                IsActive = true
            };

            _context.Integrations.Add(integration);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetIntegration), new { id = integration.Id }, new IntegrationDto
            {
                Id = integration.Id,
                Name = integration.Name,
                Type = integration.Type,
                IsActive = integration.IsActive
            });
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateIntegration(int id, [FromBody] UpdateIntegrationRequest request)
        {
            var integration = _context.Integrations.FirstOrDefault(i => i.Id == id);
            if (integration == null) return NotFound();

            integration.Name = request.Name;
            integration.Type = request.Type;
            integration.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteIntegration(int id)
        {
            var integration = _context.Integrations.FirstOrDefault(i => i.Id == id);
            if (integration == null) return NotFound();

            _context.Integrations.Remove(integration);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("data-actions")]
        public ActionResult<List<DataActionDto>> GetDataActions()
        {
            var dataActions = _context.DataActions
                .Select(d => new DataActionDto
                {
                    Id = d.Id,
                    Name = d.Name,
                    Type = d.ActionType
                })
                .ToList();

            return Ok(dataActions);
        }
    }

    public class CreateIntegrationRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
    }

    public class UpdateIntegrationRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
    }

    public class DataActionDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
    }
}
