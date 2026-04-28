namespace ContactCenterApp.Shared.Entities;

public class CampaignContact
{
    public long Id { get; set; }
    public long CampaignId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Status { get; set; } = "PENDING";
    public int CallAttempts { get; set; } = 0;
    public int RecyclePass { get; set; } = 0;
    public DateTime? LastCallTime { get; set; }
    public string? CallResult { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}