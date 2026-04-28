namespace ContactCenterApp.Shared.Entities;

public class ExternalTrunk
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string SipAddress { get; set; } = string.Empty;
    public int SipPort { get; set; } = 5060;
    public string? Username { get; set; }
    public string? Password { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}