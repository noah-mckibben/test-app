using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ContactCenterApp.Data;
using ContactCenterApp.Shared.Entities;
using ContactCenterApp.Shared.DTOs;

namespace ContactCenterApp.ApiGateway.Controllers
{
    [ApiController]
    [Route("api/admin/campaigns")]
    [Authorize]
    public class CampaignController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CampaignController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public ActionResult<List<CampaignDto>> GetCampaigns()
        {
            var campaigns = _context.Campaigns
                .Select(c => new CampaignDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    Status = c.Status,
                    WorkTypeId = c.WorkTypeId,
                    DialMode = c.DialMode,
                    ConcurrentCalls = c.ConcurrentCalls,
                    AllowRecycling = c.AllowRecycling
                })
                .ToList();

            return Ok(campaigns);
        }

        [HttpGet("{id}")]
        public ActionResult<CampaignDto> GetCampaign(int id)
        {
            var campaign = _context.Campaigns.FirstOrDefault(c => c.Id == id);
            if (campaign == null) return NotFound();

            return Ok(new CampaignDto
            {
                Id = campaign.Id,
                Name = campaign.Name,
                Description = campaign.Description,
                Status = campaign.Status,
                WorkTypeId = campaign.WorkTypeId,
                DialMode = campaign.DialMode,
                ConcurrentCalls = campaign.ConcurrentCalls,
                AllowRecycling = campaign.AllowRecycling
            });
        }

        [HttpPost]
        public async Task<ActionResult<CampaignDto>> CreateCampaign([FromBody] CreateCampaignRequest request)
        {
            var campaign = new Campaign
            {
                Name = request.Name,
                Description = request.Description,
                WorkTypeId = request.WorkTypeId,
                DialMode = request.DialMode,
                ConcurrentCalls = request.ConcurrentCalls,
                Status = "DRAFT"
            };

            _context.Campaigns.Add(campaign);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCampaign), new { id = campaign.Id }, new CampaignDto
            {
                Id = campaign.Id,
                Name = campaign.Name,
                Description = campaign.Description,
                Status = campaign.Status,
                WorkTypeId = campaign.WorkTypeId,
                DialMode = campaign.DialMode,
                ConcurrentCalls = campaign.ConcurrentCalls,
                AllowRecycling = campaign.AllowRecycling
            });
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateCampaign(int id, [FromBody] UpdateCampaignRequest request)
        {
            var campaign = _context.Campaigns.FirstOrDefault(c => c.Id == id);
            if (campaign == null) return NotFound();

            campaign.Name = request.Name;
            campaign.Description = request.Description;
            campaign.DialMode = request.DialMode;
            campaign.ConcurrentCalls = request.ConcurrentCalls;
            campaign.AllowRecycling = request.AllowRecycling;
            campaign.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteCampaign(int id)
        {
            var campaign = _context.Campaigns.FirstOrDefault(c => c.Id == id);
            if (campaign == null) return NotFound();

            _context.Campaigns.Remove(campaign);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPut("{id}/status")]
        public async Task<ActionResult> UpdateCampaignStatus(int id, [FromBody] UpdateCampaignStatusRequest request)
        {
            var campaign = _context.Campaigns.FirstOrDefault(c => c.Id == id);
            if (campaign == null) return NotFound();

            campaign.Status = request.Status;
            campaign.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("{campaignId}/contacts")]
        public ActionResult<List<CampaignContactDto>> GetCampaignContacts(int campaignId)
        {
            var contacts = _context.CampaignContacts
                .Where(cc => cc.CampaignId == campaignId)
                .Select(cc => new CampaignContactDto
                {
                    Id = cc.Id,
                    CampaignId = cc.CampaignId,
                    FirstName = cc.FirstName,
                    LastName = cc.LastName,
                    PhoneNumber = cc.PhoneNumber,
                    Status = cc.Status
                })
                .ToList();

            return Ok(contacts);
        }

        [HttpPost("{campaignId}/contacts")]
        public async Task<ActionResult<CampaignContactDto>> AddCampaignContact(int campaignId, [FromBody] CreateCampaignContactRequest request)
        {
            var contact = new CampaignContact
            {
                CampaignId = campaignId,
                FirstName = request.FirstName,
                LastName = request.LastName,
                PhoneNumber = request.PhoneNumber,
                Status = "NEW"
            };

            _context.CampaignContacts.Add(contact);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCampaignContacts), new { campaignId }, new CampaignContactDto
            {
                Id = contact.Id,
                CampaignId = contact.CampaignId,
                FirstName = contact.FirstName,
                LastName = contact.LastName,
                PhoneNumber = contact.PhoneNumber,
                Status = contact.Status
            });
        }
    }
}