using System;

namespace ContactCenterApp.Shared.Entities
{
    public class SystemEvent
    {
        public int Id { get; set; }
        public string EventType { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? CorrelationId { get; set; }
        public string? Details { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}