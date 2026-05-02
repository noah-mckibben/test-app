namespace ContactCenterApp.Shared.DTOs
{
    public class CampaignDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int WorkTypeId { get; set; }
        public string DialMode { get; set; } = string.Empty;
        public int ConcurrentCalls { get; set; }
        public bool AllowRecycling { get; set; }
    }

    public class CreateCampaignRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int WorkTypeId { get; set; }
        public string DialMode { get; set; } = "PREVIEW";
        public int ConcurrentCalls { get; set; } = 1;
    }

    public class UpdateCampaignRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string DialMode { get; set; } = string.Empty;
        public int ConcurrentCalls { get; set; }
        public bool AllowRecycling { get; set; }
    }

    public class UpdateCampaignStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }

    public class CampaignContactDto
    {
        public int Id { get; set; }
        public int CampaignId { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }

    public class CreateCampaignContactRequest
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
    }

    public class CampaignStatsDto
    {
        public int TotalContacts { get; set; }
        public int CallsCompleted { get; set; }
        public int CallsFailed { get; set; }
        public double AverageCallDuration { get; set; }
    }
}