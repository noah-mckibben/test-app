namespace ContactCenterApp.Shared.Entities;

public class DataAction
{
    public long Id { get; set; }
    public long CallFlowId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ActionType { get; set; } = string.Empty;
    public string Config { get; set; } = "{}";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}