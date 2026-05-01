using System;

namespace ContactCenterApp.Shared.Entities
{
    public class CampaignContact
    {
        public int Id { get; set; }
        public int CampaignId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Status { get; set; } = "NEW";
        public int CallAttempts { get; set; }
        public int RecyclePass { get; set; }
        public DateTime? LastCallTime { get; set; }
        public string? CallResult { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}