package com.nmckibben.testapp.service;

import com.nmckibben.testapp.infrastructure.events.CallCompletedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Campaign domain listener.
 *
 * Previously, TwilioController.handleCampaignStatus() called
 * campaignDialer.handleCallStatus() directly — a synchronous cross-domain
 * call in the HTTP request thread.
 *
 * Now TwilioController publishes a CallCompletedEvent and immediately returns
 * 200 to Twilio.  This listener handles the DB update asynchronously.
 *
 * Future extraction: this becomes a Kafka consumer in the Campaign service,
 * subscribed to the call-completed topic.
 */
@Component
public class CampaignEventListener {

    private final CampaignDialerService campaignDialer;

    public CampaignEventListener(CampaignDialerService campaignDialer) {
        this.campaignDialer = campaignDialer;
    }

    @Async
    @EventListener
    public void on(CallCompletedEvent e) {
        // Only process campaign-originated calls (those have a campaignId + contactId)
        if (e.getCampaignId() != null && e.getContactId() != null) {
            campaignDialer.handleCallStatus(
                    e.getCampaignId(), e.getContactId(),
                    e.getCallStatus(), e.getCallSid());
        }
    }
}
