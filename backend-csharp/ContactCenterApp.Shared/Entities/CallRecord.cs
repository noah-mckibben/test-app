namespace ContactCenterApp.Shared.Entities;

public class CallRecord
{
    public long Id { get; set; }
    public long? AgentId { get; set; }
    public string CallSid { get; set; } = string.Empty;
    public string Direction { get; set; } = "INBOUND";
    public string Status { get; set; } = "INITIATED";
    public string FromNumber { get; set; } = string.Empty;
    public string ToNumber { get; set; } = string.Empty;
    public DateTime StartTime { get; set; } = DateTime.UtcNow;
    public DateTime? EndTime { get; set; }
    public int DurationSeconds { get; set; } = 0;
    public string? RecordingUrl { get; set; }
    public string? Notes { get; set; }
    public long? CampaignId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}