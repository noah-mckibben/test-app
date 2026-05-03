using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ContactCenterApp.Data;
using ContactCenterApp.Shared.Entities;
using ContactCenterApp.Shared.DTOs;

namespace ContactCenterApp.ApiGateway.Controllers
{
    [ApiController]
    [Route("api/admin/work-types")]
    [Authorize]
    public class WorkTypeController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public WorkTypeController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public ActionResult<List<WorkTypeDto>> GetWorkTypes()
        {
            var workTypes = _context.WorkTypes
                .Select(w => new WorkTypeDto
                {
                    Id = w.Id,
                    Name = w.Name,
                    Dnis = w.Dnis,
                    Tfn = w.Tfn,
                    Description = w.Description,
                    IsActive = w.IsActive
                })
                .ToList();

            return Ok(workTypes);
        }

        [HttpGet("{id}")]
        public ActionResult<WorkTypeDto> GetWorkType(int id)
        {
            var workType = _context.WorkTypes.FirstOrDefault(w => w.Id == id);
            if (workType == null) return NotFound();

            return Ok(new WorkTypeDto
            {
                Id = workType.Id,
                Name = workType.Name,
                Dnis = workType.Dnis,
                Tfn = workType.Tfn,
                Description = workType.Description,
                IsActive = workType.IsActive
            });
        }

        [HttpPost]
        public async Task<ActionResult<WorkTypeDto>> CreateWorkType([FromBody] CreateWorkTypeRequest request)
        {
            var workType = new WorkType
            {
                Name = request.Name,
                Dnis = request.Dnis,
                Tfn = request.Tfn,
                Description = request.Description,
                IsActive = true
            };

            _context.WorkTypes.Add(workType);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetWorkType), new { id = workType.Id }, new WorkTypeDto
            {
                Id = workType.Id,
                Name = workType.Name,
                Dnis = workType.Dnis,
                Tfn = workType.Tfn,
                Description = workType.Description,
                IsActive = workType.IsActive
            });
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateWorkType(int id, [FromBody] UpdateWorkTypeRequest request)
        {
            var workType = _context.WorkTypes.FirstOrDefault(w => w.Id == id);
            if (workType == null) return NotFound();

            workType.Name = request.Name;
            workType.Description = request.Description;
            workType.IsActive = request.IsActive;
            workType.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteWorkType(int id)
        {
            var workType = _context.WorkTypes.FirstOrDefault(w => w.Id == id);
            if (workType == null) return NotFound();

            _context.WorkTypes.Remove(workType);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
