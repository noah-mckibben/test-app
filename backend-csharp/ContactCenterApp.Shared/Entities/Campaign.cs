namespace ContactCenterApp.Shared.Entities;

public class Campaign
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = "DRAFT";
    public long WorkTypeId { get; set; }
    public int DialMode { get; set; } = 0;
    public int ConcurrentCalls { get; set; } = 1;
    public bool AllowRecycling { get; set; } = true;
    public int MaxRecyclePass { get; set; } = 3;
    public int RecycleDelayMinutes { get; set; } = 60;
    public bool AllowCallReturn { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}