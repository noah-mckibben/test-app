package com.nmckibben.testapp.controller;

import com.nmckibben.testapp.entity.CallFlow;
import com.nmckibben.testapp.entity.WorkType;
import com.nmckibben.testapp.repository.CallFlowRepository;
import com.nmckibben.testapp.repository.WorkTypeRepository;
import com.nmckibben.testapp.service.CallFlowExecutorService;
import com.nmckibben.testapp.service.CampaignDialerService;
import com.nmckibben.testapp.service.UserService;
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

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

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

    private final UserService             userService;
    private final CampaignDialerService   campaignDialer;
    private final WorkTypeRepository      workTypeRepo;
    private final CallFlowRepository      callFlowRepo;
    private final CallFlowExecutorService executor;

    public TwilioController(UserService userService,
                             CampaignDialerService campaignDialer,
                             WorkTypeRepository workTypeRepo,
                             CallFlowRepository callFlowRepo,
                             CallFlowExecutorService executor) {
        this.userService    = userService;
        this.campaignDialer = campaignDialer;
        this.workTypeRepo   = workTypeRepo;
        this.callFlowRepo   = callFlowRepo;
        this.executor       = executor;
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

    // ── Primary TwiML webhook (browser SDK + inbound PSTN) ───────────────────

    /**
     * Routing priority:
     *  1. client:xyz       → app-to-app, connect directly to that client
     *  2. Matches active CallFlow triggerNumber → execute that call flow
     *  3. Matches WorkType DNIS with a CallFlow → execute the WorkType's call flow
     *  4. Matches WorkType DNIS (no call flow)  → ring queue agents
     *  5. Outbound PSTN (not our number)        → dial through
     *  6. Fallback                              → simulring all ONLINE agents
     */
    @PostMapping(value = "/voice", produces = MediaType.APPLICATION_XML_VALUE)
    public String handleVoice(
            @RequestParam(required = false) String To,
            @RequestParam(required = false) String From) {

        VoiceResponse.Builder response = new VoiceResponse.Builder();

        // 1. App-to-app
        if (To != null && To.startsWith("client:")) {
            String clientId = To.substring("client:".length());
            return response.dial(new Dial.Builder()
                    .client(new Client.Builder(clientId).build())
                    .build()).build().toXml();
        }

        if (To != null && !To.isBlank()) {
            To = normalizeE164(To);

            // 2. Active call flow bound to this trigger number
            Optional<CallFlow> flowByNumber = callFlowRepo.findByTriggerNumberAndActiveTrue(To);
            if (flowByNumber.isPresent()) {
                return executor.execute(flowByNumber.get(), baseUrl);
            }

            // 3 & 4. WorkType DNIS match
            Optional<WorkType> workTypeOpt = workTypeRepo.findByDnis(To);
            if (workTypeOpt.isPresent()) {
                WorkType wt = workTypeOpt.get();
                response.say(new Say.Builder(
                        "Thank you for calling. Please hold while we connect you.").build());
                if (wt.getCallFlow() != null && wt.getCallFlow().isActive()) {
                    return executor.execute(wt.getCallFlow(), baseUrl);
                }
                dialWorkTypeAgents(response, wt);
                return response.build().toXml();
            }

            // 5. Outbound PSTN — callerId required when call comes from browser SDK
            //    (From = "client:username", not a Twilio number, so Twilio can't infer it)
            if (!To.equals(twilioPhoneNumber)) {
                return response.dial(new Dial.Builder()
                        .callerId(twilioPhoneNumber)
                        .number(new Number.Builder(To).build())
                        .build()).build().toXml();
            }
        }

        // 6. Fallback: simulring all ONLINE agents
        dialAllOnlineAgents(response);
        return response.build().toXml();
    }

    @PostMapping(value = "/voice/status", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<Void> handleVoiceStatus(
            @RequestParam(required = false) String CallStatus,
            @RequestParam(required = false) String CallSid) {
        return ResponseEntity.ok().build();
    }

    // ── Call-flow execution endpoints ─────────────────────────────────────────

    /**
     * Execute a call flow from its Start node.
     * Used when a WorkType or campaign call is answered and the flow should run.
     * Public — called by Twilio's servers.
     */
    @PostMapping(value = "/flow/{flowId}/voice", produces = MediaType.APPLICATION_XML_VALUE)
    public String handleFlowVoice(@PathVariable Long flowId) {
        return callFlowRepo.findById(flowId)
                .map(f -> executor.execute(f, baseUrl))
                .orElse(new VoiceResponse.Builder()
                        .say(new Say.Builder("Call flow not found.").build())
                        .build().toXml());
    }

    /**
     * IVR gather callback — Twilio POSTs the digit pressed on a menu node.
     * Public — called by Twilio's servers.
     */
    @PostMapping(value = "/flow/{flowId}/gather", produces = MediaType.APPLICATION_XML_VALUE)
    public String handleFlowGather(
            @PathVariable Long flowId,
            @RequestParam String nodeId,
            @RequestParam(required = false, defaultValue = "") String Digits) {
        return callFlowRepo.findById(flowId)
                .map(f -> executor.handleGather(f, nodeId, Digits, baseUrl))
                .orElse(new VoiceResponse.Builder()
                        .say(new Say.Builder("Call flow not found.").build())
                        .build().toXml());
    }

    // ── WorkType-scoped TwiML (outbound campaign calls) ───────────────────────

    /**
     * TwiML served when a campaign outbound call is answered and routed through
     * a WorkType. Executes the WorkType's assigned call flow if present,
     * otherwise falls back to ringing agents directly.
     * Public — called by Twilio's servers.
     */
    @PostMapping(value = "/worktype/{workTypeId}/voice", produces = MediaType.APPLICATION_XML_VALUE)
    public String handleWorkTypeVoice(@PathVariable Long workTypeId) {
        Optional<WorkType> wtOpt = workTypeRepo.findById(workTypeId);
        if (wtOpt.isEmpty()) {
            return new VoiceResponse.Builder()
                    .say(new Say.Builder("Work type not found.").build())
                    .build().toXml();
        }

        WorkType wt = wtOpt.get();

        // If the WorkType has an active call flow assigned, execute it
        if (wt.getCallFlow() != null && wt.getCallFlow().isActive()) {
            return executor.execute(wt.getCallFlow(), baseUrl);
        }

        // Otherwise fall back to ringing agents in the queue
        VoiceResponse.Builder response = new VoiceResponse.Builder();
        response.say(new Say.Builder("Please hold while we connect you to an agent.").build());
        dialWorkTypeAgents(response, wt);
        return response.build().toXml();
    }

    // ── Campaign fallback TwiML (no WorkType) ─────────────────────────────────

    /**
     * Fallback TwiML for campaign calls not linked to a WorkType.
     * Public — called by Twilio's servers.
     */
    @PostMapping(value = "/campaign/{campaignId}/voice", produces = MediaType.APPLICATION_XML_VALUE)
    public String handleCampaignVoice(@PathVariable Long campaignId) {
        VoiceResponse.Builder response = new VoiceResponse.Builder();
        response.say(new Say.Builder("Please hold while we connect you to an agent.").build());
        dialAllOnlineAgents(response);
        return response.build().toXml();
    }

    /**
     * Status callback for campaign calls — updates contact status in the DB.
     * Public — called by Twilio's servers.
     */
    @PostMapping(value = "/campaign/{campaignId}/status", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<Void> handleCampaignStatus(
            @PathVariable Long campaignId,
            @RequestParam(required = false) Long contactId,
            @RequestParam(required = false) String CallStatus,
            @RequestParam(required = false) String CallSid) {

        if (contactId != null && CallStatus != null) {
            campaignDialer.handleCallStatus(campaignId, contactId, CallStatus, CallSid);
        }
        return ResponseEntity.ok().build();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Ring agents staffed in a specific WorkType who are currently ONLINE. */
    private void dialWorkTypeAgents(VoiceResponse.Builder response, WorkType wt) {
        Set<String> staffed = wt.getAgents().stream()
                .map(com.nmckibben.testapp.entity.User::getUsername)
                .collect(Collectors.toSet());

        List<String> online = userService.getOnlineUsernames().stream()
                .filter(staffed::contains)
                .collect(Collectors.toList());

        if (online.isEmpty()) online = userService.getOnlineUsernames();

        if (online.isEmpty()) {
            response.say(new Say.Builder(
                    "Sorry, no agents are available right now. Please try again later.").build());
            return;
        }
        Dial.Builder dial = new Dial.Builder();
        for (String u : online) dial.client(new Client.Builder(u).build());
        response.dial(dial.build());
    }

    /**
     * Normalise a dialled string to E.164.
     * 10 digits → +1XXXXXXXXXX (North America)
     * 11 digits starting with 1 → +1XXXXXXXXXX
     * Already has '+' → leave as-is (strip spaces/dashes first)
     */
    private String normalizeE164(String raw) {
        if (raw == null) return raw;
        // client: identifiers and SIP addresses – don't touch
        if (raw.startsWith("client:") || raw.contains("@")) return raw;
        String digits = raw.replaceAll("[^\\d]", "");
        if (raw.startsWith("+")) return "+" + digits;
        if (digits.length() == 10) return "+1" + digits;
        if (digits.length() == 11 && digits.startsWith("1")) return "+" + digits;
        return raw; // unknown format – return unchanged
    }

    /** Simulring all ONLINE agents — used as a final fallback. */
    private void dialAllOnlineAgents(VoiceResponse.Builder response) {
        List<String> online = userService.getOnlineUsernames();
        if (online.isEmpty()) {
            response.say(new Say.Builder(
                    "Sorry, no agents are available right now. Please try again later.").build());
        } else {
            Dial.Builder dial = new Dial.Builder();
            for (String u : online) dial.client(new Client.Builder(u).build());
            response.dial(dial.build());
        }
    }
}
