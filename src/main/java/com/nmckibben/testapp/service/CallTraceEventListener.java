package com.nmckibben.testapp.service;

import com.nmckibben.testapp.entity.CallTrace;
import com.nmckibben.testapp.infrastructure.events.AgentStatusChangedEvent;
import com.nmckibben.testapp.infrastructure.events.CallCompletedEvent;
import com.nmckibben.testapp.infrastructure.events.CallRoutedEvent;
import com.nmckibben.testapp.infrastructure.events.CampaignCallEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Analytics domain listener — translates domain events into CallTrace records.
 *
 * All methods are @Async so they never block the call path.  A slow database
 * write cannot delay TwiML being returned to Twilio (which has a 15-second
 * timeout).
 *
 * Decoupling value: TwilioController no longer depends on CallTraceService.
 * When the Analytics domain is extracted to its own service, these listeners
 * become Kafka consumers — the publisher side (TwilioController) doesn't change.
 */
@Component
public class CallTraceEventListener {

    private final CallTraceService traceService;

    public CallTraceEventListener(CallTraceService traceService) {
        this.traceService = traceService;
    }

    @Async
    @EventListener
    public void on(CallRoutedEvent e) {
        String direction = switch (e.getRouteType()) {
            case OUTBOUND_PSTN -> "OUTBOUND";
            default            -> "INBOUND";
        };

        String status = switch (e.getRouteType()) {
            case FALLBACK -> "WARNING";
            default       -> "INFO";
        };

        traceService.log(
                CallTrace.of("CALL_ROUTED", status, e.getMessage())
                        .callSid(e.getCallSid())
                        .direction(direction)
                        .from(e.getFrom())
                        .to(e.getTo())
                        .flow(e.getCallFlowId(), e.getCallFlowName())
                        .workType(e.getWorkTypeId(), e.getWorkTypeName())
        );
    }

    @Async
    @EventListener
    public void on(CallCompletedEvent e) {
        traceService.log(
                CallTrace.of("CALL_COMPLETED", "INFO",
                        "Twilio status: " + e.getCallStatus())
                        .callSid(e.getCallSid())
        );
    }

    @Async
    @EventListener
    public void on(AgentStatusChangedEvent e) {
        traceService.log(
                CallTrace.of("AGENT_STATUS", "INFO",
                        e.getUsername() + " → " + e.getNewStatus())
        );
    }

    @Async
    @EventListener
    public void on(CampaignCallEvent e) {
        String status = "INITIATED".equals(e.getOutcome()) ? "INFO" : "FAILURE";
        traceService.log(
                CallTrace.of("CAMPAIGN_DIAL", status,
                        "Campaign " + e.getCampaignId() + " → contact " + e.getContactId()
                                + " (" + e.getToNumber() + ") " + e.getOutcome())
                        .callSid(e.getCallSid())
                        .direction("OUTBOUND")
                        .to(e.getToNumber())
        );
    }
}
