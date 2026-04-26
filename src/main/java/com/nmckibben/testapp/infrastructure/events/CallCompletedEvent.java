package com.nmckibben.testapp.infrastructure.events;

/**
 * Published by the Telephony domain when Twilio POSTs a status callback.
 * Consumed by:
 *   - Analytics domain → updates CallTrace/CallRecord status
 *   - Campaign domain  → updates CampaignContact.lastCallStatus
 */
public class CallCompletedEvent extends DomainEvent {

    private final String callSid;
    private final String callStatus;   // Twilio status string: completed, busy, no-answer, failed, canceled
    private final Long   campaignId;   // null if not a campaign call
    private final Long   contactId;    // null if not a campaign call

    public CallCompletedEvent(String correlationId, String callSid, String callStatus,
                              Long campaignId, Long contactId) {
        super(correlationId);
        this.callSid    = callSid;
        this.callStatus = callStatus;
        this.campaignId = campaignId;
        this.contactId  = contactId;
    }

    public String getCallSid()    { return callSid;    }
    public String getCallStatus() { return callStatus; }
    public Long   getCampaignId() { return campaignId; }
    public Long   getContactId()  { return contactId;  }
}
