using System;

namespace ContactCenterApp.Shared.Entities
{
    public class CallTrace
    {
        public int Id { get; set; }
        public string CallSid { get; set; } = string.Empty;
        public string EventType { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string? CorrelationId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}