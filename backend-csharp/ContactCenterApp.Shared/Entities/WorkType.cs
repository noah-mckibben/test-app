using System;

namespace ContactCenterApp.Shared.Entities
{
    public class WorkType
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Dnis { get; set; } = string.Empty;
        public string Tfn { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}