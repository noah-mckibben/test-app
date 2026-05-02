namespace ContactCenterApp.Shared.DTOs
{
    public class CallRecordDto
    {
        public int Id { get; set; }
        public int AgentId { get; set; }
        public string CallSid { get; set; } = string.Empty;
        public string Direction { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? FromNumber { get; set; }
        public string? ToNumber { get; set; }
        public int? DurationSeconds { get; set; }
        public string? RecordingUrl { get; set; }
    }

    public class InitiateCallRequest
    {
        public int CampaignContactId { get; set; }
        public string PhoneNumber { get; set; } = string.Empty;
    }

    public class UpdateCallStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }

    public class CallTraceDto
    {
        public int Id { get; set; }
        public string CallSid { get; set; } = string.Empty;
        public string EventType { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
}