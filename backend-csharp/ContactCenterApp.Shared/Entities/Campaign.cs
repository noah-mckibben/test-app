using System;

namespace ContactCenterApp.Shared.Entities
{
    public class Campaign
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = "DRAFT";
        public int WorkTypeId { get; set; }
        public string DialMode { get; set; } = "PREVIEW";
        public int ConcurrentCalls { get; set; } = 1;
        public bool AllowRecycling { get; set; }
        public int MaxRecyclePass { get; set; } = 3;
        public int RecycleDelayMinutes { get; set; } = 24;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}