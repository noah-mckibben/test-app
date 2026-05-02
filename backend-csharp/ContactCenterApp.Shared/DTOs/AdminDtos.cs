namespace ContactCenterApp.Shared.DTOs
{
    public class WorkTypeDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Dnis { get; set; } = string.Empty;
        public string Tfn { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsActive { get; set; }
    }

    public class CreateWorkTypeRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Dnis { get; set; } = string.Empty;
        public string Tfn { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class UpdateWorkTypeRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsActive { get; set; }
    }

    public class CallFlowDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string FlowJson { get; set; } = string.Empty;
        public bool IsActive { get; set; }
    }

    public class CreateCallFlowRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string FlowJson { get; set; } = string.Empty;
    }

    public class UpdateCallFlowRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string FlowJson { get; set; } = string.Empty;
    }

    public class IntegrationDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public bool IsActive { get; set; }
    }

    public class ExternalTrunkDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string SipAddress { get; set; } = string.Empty;
        public int SipPort { get; set; }
        public bool IsActive { get; set; }
    }
}