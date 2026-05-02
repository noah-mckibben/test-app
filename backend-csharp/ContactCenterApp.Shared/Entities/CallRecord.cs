using System;

namespace ContactCenterApp.Shared.Entities
{
    public class CallRecord
    {
        public int Id { get; set; }
        public int AgentId { get; set; }
        public string CallSid { get; set; } = string.Empty;
        public string Direction { get; set; } = "INBOUND";
        public string Status { get; set; } = "INITIATED";
        public string? FromNumber { get; set; }
        public string? ToNumber { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime? EndTime { get; set; }
        public int? DurationSeconds { get; set; }
        public string? RecordingUrl { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}