package com.nmckibben.testapp.controller;

import com.nmckibben.testapp.infrastructure.events.CallCompletedEvent;
import com.nmckibben.testapp.infrastructure.events.CallRoutedEvent;
import com.nmckibben.testapp.infrastructure.events.CallRoutedEvent.RouteType;
import com.nmckibben.testapp.infrastructure.events.DomainEventPublisher;
import com.nmckibben.testapp.service.CallFlowExecutorService;
import com.nmckibben.testapp.service.RoutingService;
import com.nmckibben.testapp.service.RoutingService.RouteDecision;
import com.twilio.jwt.accesstoken.AccessToken;
import com.twilio.jwt.accesstoken.VoiceGrant;
import com.twilio.twiml.VoiceResponse;
import com.twilio.twiml.voice.Client;
import com.twilio.twiml.voice.Dial;
import com.twilio.twiml.voice.Number;
import com.twilio.twiml.voice.Say;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Telephony domain controller — handles Twilio webhooks and token issuance.
 *
 * Responsibilities (this class only):
 *   - Issue Twilio access tokens (browser SDK)
 *   - Accept Twilio webhooks and return TwiML
 *   - Delegate routing decisions to RoutingService
 *   - Build TwiML based on the RouteDecision value object
 *   - Publish domain events (CallRoutedEvent, CallCompletedEvent)
 *     so other domains (analytics, campaign) react asynchronously
 *
 * What this class no longer does:
 *   - Repository access (previously injected CallFlowRepository, WorkTypeRepository)
 *   - Routing logic (previously embedded DNIS lookup, WorkType resolution)
 *   - Direct CallTrace writes (now done by CallTraceEventListener)
 */
@RestController
@RequestMapping("/api/twilio")
public class TwilioController {

    @Value("${twilio.account-sid}")
    private String accountSid;

    @Value("${twilio.api-key-sid}")
    private String apiKeySid;

    @Value("${twilio.api-key-secret}")
    private String apiKeySecret;

    @Value("${twilio.twiml-app-sid}")
    private String twimlAppSid;

    @Value("${twilio.phone-number}")
    private String twilioPhoneNumber;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    private final RoutingService        routingService;
    private final CallFlowExecutorService executor;
    private final DomainEventPublisher  eventBus;

    public TwilioController(RoutingService routingService,
                            CallFlowExecutorService executor,
                            DomainEventPublisher eventBus) {
        this.routingService = routingService;
        this.executor       = executor;
        this.eventBus       = eventBus;
    }

    // ── Access token ──────────────────────────────────────────────────────────

    @GetMapping("/token")
    public ResponseEntity<Map<String, Object>> getToken(
            @AuthenticationPrincipal UserDetails userDetails) {
        try {
            if (userDetails == null)
                return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));

            VoiceGrant grant = new VoiceGrant();
            grant.setOutgoingApplicationSid(twimlAppSid);
            grant.setIncomingAllow(true);

            AccessToken token = new AccessToken.Builder(accountSid, apiKeySid, apiKeySecret)
                    .identity(userDetails.getUsername())
                    .grant(grant)
                    .build();

            return ResponseEntity.ok(Map.of("token", token.toJwt(),
                                            "identity", userDetails.getUsername()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "error",       e.getClass().getSimpleName(),
                    "message",     e.getMessage() != null ? e.getMessage() : "null",
                    "accountSid",  accountSid  != null ? accountSid.substring(0, Math.min(6, accountSid.length()))   + "..." : "NULL",
                    "apiKeySid",   apiKeySid   != null ? apiKeySid.substring(0, Math.min(6, apiKeySid.length()))     + "..." : "NULL",
                    "twimlAppSid", twimlAppSid != null ? twimlAppSid.substring(0, Math.min(6, twimlAppSid.length())) + "..." : "NULL"
            ));
        }
    }

    // ── Primary TwiML webhook ─────────────────────────────────────────────────

    @PostMapping(value = "/voice", produces = MediaType.APPLICATION_XML_VALUE)
    public String handleVoice(
            @RequestParam(required = false) String To,
            @RequestParam(required = false) String From,
            @RequestParam(required = false) String CallSid) {

        // Normalize E.164 before routing
        String normalizedTo = (To != null && !To.startsWith("client:") && !To.contains("@"))
                ? normalizeE164(To) : To;

        // Ask the Routing domain: where does this call go?
        RouteDecision decision = routingService.resolve(normalizedTo, twilioPhoneNumber);

        // Build TwiML based on the decision
        String twiml = buildTwiml(decision, From, CallSid);

        // Publish event — analytics domain writes the trace asynchronously
        eventBus.publish(buildRoutedEvent(decision, CallSid, From, normalizedTo));

        return twiml;
    }

    @PostMapping(value = "/voice/status", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<Void> handleVoiceStatus(
            @RequestParam(required = false) String CallStatus,
            @RequestParam(required = false) String CallSid) {
        if (CallSid != null && CallStatus != null) {
            eventBus.publish(new CallCompletedEvent(null, CallSid, CallStatus, null, null));
        }
        return ResponseEntity.ok().build();
    }

    // ── Call-flow execution endpoints ─────────────────────────────────────────

    @PostMapping(value = "/flow/{flowId}/voice", produces = MediaType.APPLICATION_XML_VALUE)
    public String handleFlowVoice(@PathVariable Long flowId) {
        // RoutingService owns lookup; executor owns execution
        RouteDecision d = routingService.resolve(null, twilioPhoneNumber);
        // Flow-specific path: look up flow directly via executor helper
        return executor.executeById(flowId, baseUrl);
    }

    @PostMapping(value = "/flow/{flowId}/gather", produces = MediaType.APPLICATION_XML_VALUE)
    public String handleFlowGather(
            @PathVariable Long flowId,
            @RequestParam String nodeId,
            @RequestParam(required = false, defaultValue = "") String Digits) {
        return executor.handleGatherById(flowId, nodeId, Digits, baseUrl);
    }

    // ── WorkType-scoped TwiML ─────────────────────────────────────────────────

    @PostMapping(value = "/worktype/{workTypeId}/voice", produces = MediaType.APPLICATION_XML_VALUE)
    public String handleWorkTypeVoice(@PathVariable Long workTypeId) {
        return executor.executeByWorkTypeId(workTypeId, baseUrl);
    }

    // ── Campaign TwiML ────────────────────────────────────────────────────────

    @PostMapping(value = "/campaign/{campaignId}/voice", produces = MediaType.APPLICATION_XML_VALUE)
    public String handleCampaignVoice(@PathVariable Long campaignId) {
        VoiceResponse.Builder response = new VoiceResponse.Builder();
        response.say(new Say.Builder("Please hold while we connect you to an agent.").build());
        executor.dialAllOnlineAgents(response);
        return response.build().toXml();
    }

    @PostMapping(value = "/campaign/{campaignId}/status", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<Void> handleCampaignStatus(
            @PathVariable Long campaignId,
            @RequestParam(required = false) Long contactId,
            @RequestParam(required = false) String CallStatus,
            @RequestParam(required = false) String CallSid) {
        if (contactId != null && CallStatus != null) {
            eventBus.publish(new CallCompletedEvent(null, CallSid, CallStatus, campaignId, contactId));
        }
        return ResponseEntity.ok().build();
    }

    // ── TwiML builder (pure translation of RouteDecision → XML) ──────────────

    private String buildTwiml(RouteDecision d, String from, String callSid) {
        VoiceResponse.Builder response = new VoiceResponse.Builder();

        return switch (d.type) {
            case APP_TO_APP -> response.dial(new Dial.Builder()
                    .client(new Client.Builder(d.clientId).build())
                    .build()).build().toXml();

            case CALL_FLOW -> executor.execute(d.callFlow, baseUrl, callSid, null, null);

            case WORK_TYPE_FLOW -> {
                response.say(new Say.Builder("Thank you for calling. Please hold while we connect you.").build());
                yield executor.execute(d.callFlow, baseUrl, callSid, d.workTypeId(), d.workTypeName());
            }

            case WORK_TYPE_QUEUE -> {
                response.say(new Say.Builder("Thank you for calling. Please hold while we connect you.").build());
                dialAgents(response, d.agentUsernames);
                yield response.build().toXml();
            }

            case OUTBOUND_PSTN -> response.dial(new Dial.Builder()
                    .callerId(twilioPhoneNumber)
                    .number(new Number.Builder(d.destinationNumber).build())
                    .build()).build().toXml();

            case FALLBACK -> {
                dialAgents(response, d.agentUsernames);
                yield response.build().toXml();
            }
        };
    }

    private CallRoutedEvent buildRoutedEvent(RouteDecision d, String callSid, String from, String to) {
        String msg = switch (d.type) {
            case APP_TO_APP      -> "App-to-app call to: " + d.clientId;
            case CALL_FLOW       -> "Inbound routed to call flow: " + d.flowName();
            case WORK_TYPE_FLOW  -> "Inbound routed to call flow (WorkType): " + d.flowName();
            case WORK_TYPE_QUEUE -> "Inbound routed to WorkType queue: " + d.workTypeName();
            case OUTBOUND_PSTN   -> "Outbound PSTN call to: " + d.destinationNumber;
            case FALLBACK        -> "Fallback: simulring all online agents";
        };

        return CallRoutedEvent.builder(callSid, d.type)
                .from(from).to(to)
                .flow(d.flowId(), d.flowName())
                .workType(d.workTypeId(), d.workTypeName())
                .message(msg)
                .build();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void dialAgents(VoiceResponse.Builder response, java.util.List<String> usernames) {
        if (usernames.isEmpty()) {
            response.say(new Say.Builder(
                    "Sorry, no agents are available right now. Please try again later.").build());
            return;
        }
        Dial.Builder dial = new Dial.Builder();
        for (String u : usernames) dial.client(new Client.Builder(u).build());
        response.dial(dial.build());
    }

    private String normalizeE164(String raw) {
        if (raw == null) return raw;
        if (raw.startsWith("client:") || raw.contains("@")) return raw;
        String digits = raw.replaceAll("[^\\d]", "");
        if (raw.startsWith("+")) return "+" + digits;
        if (digits.length() == 10) return "+1" + digits;
        if (digits.length() == 11 && digits.startsWith("1")) return "+" + digits;
        return raw;
    }
}
