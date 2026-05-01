using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ContactCenterApp.Data;
using ContactCenterApp.Shared.Entities;
using ContactCenterApp.Shared.DTOs;
using System.Security.Claims;

namespace ContactCenterApp.ApiGateway.Controllers
{
    [ApiController]
    [Route("api/contacts")]
    [Authorize]
    public class ContactController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ContactController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int GetCurrentUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        }

        [HttpGet]
        public ActionResult<List<ContactDto>> GetContacts()
        {
            var userId = GetCurrentUserId();
            var contacts = _context.Contacts
                .Where(c => c.UserId == userId)
                .Select(c => new ContactDto
                {
                    Id = c.Id,
                    UserId = c.UserId,
                    FirstName = c.FirstName,
                    LastName = c.LastName,
                    PhoneNumber = c.PhoneNumber,
                    Email = c.Email,
                    Notes = c.Notes
                })
                .ToList();

            return Ok(contacts);
        }

        [HttpGet("{id}")]
        public ActionResult<ContactDto> GetContact(int id)
        {
            var userId = GetCurrentUserId();
            var contact = _context.Contacts.FirstOrDefault(c => c.Id == id && c.UserId == userId);
            if (contact == null) return NotFound();

            return Ok(new ContactDto
            {
                Id = contact.Id,
                UserId = contact.UserId,
                FirstName = contact.FirstName,
                LastName = contact.LastName,
                PhoneNumber = contact.PhoneNumber,
                Email = contact.Email,
                Notes = contact.Notes
            });
        }

        [HttpPost]
        public async Task<ActionResult<ContactDto>> CreateContact([FromBody] CreateContactRequest request)
        {
            var userId = GetCurrentUserId();
            var contact = new Contact
            {
                UserId = userId,
                FirstName = request.FirstName,
                LastName = request.LastName,
                PhoneNumber = request.PhoneNumber,
                Email = request.Email,
                Notes = request.Notes
            };

            _context.Contacts.Add(contact);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetContact), new { id = contact.Id }, new ContactDto
            {
                Id = contact.Id,
                UserId = contact.UserId,
                FirstName = contact.FirstName,
                LastName = contact.LastName,
                PhoneNumber = contact.PhoneNumber,
                Email = contact.Email,
                Notes = contact.Notes
            });
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> UpdateContact(int id, [FromBody] UpdateContactRequest request)
        {
            var userId = GetCurrentUserId();
            var contact = _context.Contacts.FirstOrDefault(c => c.Id == id && c.UserId == userId);
            if (contact == null) return NotFound();

            contact.FirstName = request.FirstName;
            contact.LastName = request.LastName;
            contact.PhoneNumber = request.PhoneNumber;
            contact.Email = request.Email;
            contact.Notes = request.Notes;
            contact.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteContact(int id)
        {
            var userId = GetCurrentUserId();
            var contact = _context.Contacts.FirstOrDefault(c => c.Id == id && c.UserId == userId);
            if (contact == null) return NotFound();

            _context.Contacts.Remove(contact);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}