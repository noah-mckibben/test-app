namespace ContactCenterApp.Shared.Entities;

public class Integration
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public string? ApiSecret { get; set; }
    public string Config { get; set; } = "{}";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}