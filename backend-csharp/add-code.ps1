Write-Host "📝 Adding all C# code files..."

# Create Entities folder and files
New-Item -ItemType Directory -Force -Path "ContactCenterApp.Shared\Entities" | Out-Null

@"
namespace ContactCenterApp.Shared.Entities;

public class User
{
    public long Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "AGENT";
    public string Status { get; set; } = "OFFLINE";
    public string? AvatarData { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
"@ | Out-File -Encoding UTF8 "ContactCenterApp.Shared\Entities\User.cs"

@"
namespace ContactCenterApp.Shared.Entities;

public class Campaign
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = "DRAFT";
    public long WorkTypeId { get; set; }
    public int DialMode { get; set; } = 0;
    public int ConcurrentCalls { get; set; } = 1;
    public bool AllowRecycling { get; set; } = true;
    public int MaxRecyclePass { get; set; } = 3;
    public int RecycleDelayMinutes { get; set; } = 60;
    public bool AllowCallReturn { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
"@ | Out-File -Encoding UTF8 "ContactCenterApp.Shared\Entities\Campaign.cs"

@"
namespace ContactCenterApp.Shared.Entities;

public class CampaignContact
{
    public long Id { get; set; }
    public long CampaignId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Status { get; set; } = "PENDING";
    public int CallAttempts { get; set; } = 0;
    public int RecyclePass { get; set; } = 0;
    public DateTime? LastCallTime { get; set; }
    public string? CallResult { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
"@ | Out-File -Encoding UTF8 "ContactCenterApp.Shared\Entities\CampaignContact.cs"

@"
namespace ContactCenterApp.Shared.Entities;

public class Contact
{
    public long Id { get; set; }
    public long UserId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
"@ | Out-File -Encoding UTF8 "ContactCenterApp.Shared\Entities\Contact.cs"

@"
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
"@ | Out-File -Encoding UTF8 "ContactCenterApp.Shared\Entities\CallRecord.cs"

@"
namespace ContactCenterApp.Shared.Entities;

public class WorkType
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Dnis { get; set; } = string.Empty;
    public string Tfn { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
"@ | Out-File -Encoding UTF8 "ContactCenterApp.Shared\Entities\WorkType.cs"

@"
namespace ContactCenterApp.Shared.Entities;

public class CallFlow
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string FlowJson { get; set; } = "{}";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
"@ | Out-File -Encoding UTF8 "ContactCenterApp.Shared\Entities\CallFlow.cs"

@"
namespace ContactCenterApp.Shared.Entities;

public class CallTrace
{
    public long Id { get; set; }
    public string CallSid { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string? CorrelationId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
"@ | Out-File -Encoding UTF8 "ContactCenterApp.Shared\Entities\CallTrace.cs"

@"
namespace ContactCenterApp.Shared.Entities;

public class SystemEvent
{
    public long Id { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? CorrelationId { get; set; }
    public string? Details { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
"@ | Out-File -Encoding UTF8 "ContactCenterApp.Shared\Entities\SystemEvent.cs"

@"
namespace ContactCenterApp.Shared.Entities;

public class Integration
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public string? ApiSecret { get; set; }
    public string Config { get; set; } = "{}";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
"@ | Out-File -Encoding UTF8 "ContactCenterApp.Shared\Entities\Integration.cs"

@"
namespace ContactCenterApp.Shared.Entities;

public class ExternalTrunk
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string SipAddress { get; set; } = string.Empty;
    public int SipPort { get; set; } = 5060;
    public string? Username { get; set; }
    public string? Password { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
"@ | Out-File -Encoding UTF8 "ContactCenterApp.Shared\Entities\ExternalTrunk.cs"

@"
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
"@ | Out-File -Encoding UTF8 "ContactCenterApp.Shared\Entities\DataAction.cs"

Write-Host "✅ All entity files created!"