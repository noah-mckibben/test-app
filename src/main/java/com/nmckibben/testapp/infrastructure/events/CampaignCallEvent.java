package com.nmckibben.testapp.infrastructure.events;

/**
 * Published by the Campaign domain when an outbound campaign call is placed.
 * Consumed by Analytics → logs the dial attempt as a CallTrace.
 */
public class CampaignCallEvent extends DomainEvent {

    private final Long   campaignId;
    private final Long   contactId;
    private final String toNumber;
    private final String callSid;     // may be null if Twilio rejected the call
    private final String outcome;     // INITIATED | FAILED

    public CampaignCallEvent(String correlationId, Long campaignId, Long contactId,
                             String toNumber, String callSid, String outcome) {
        super(correlationId);
        this.campaignId = campaignId;
        this.contactId  = contactId;
        this.toNumber   = toNumber;
        this.callSid    = callSid;
        this.outcome    = outcome;
    }

    public Long   getCampaignId() { return campaignId; }
    public Long   getContactId()  { return contactId;  }
    public String getToNumber()   { return toNumber;   }
    public String getCallSid()    { return callSid;    }
    public String getOutcome()    { return outcome;    }
}
