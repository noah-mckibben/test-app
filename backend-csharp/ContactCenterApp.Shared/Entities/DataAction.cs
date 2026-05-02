using System;

namespace ContactCenterApp.Shared.Entities
{
    public class DataAction
    {
        public int Id { get; set; }
        public int CallFlowId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string ActionType { get; set; } = string.Empty;
        public string Config { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}