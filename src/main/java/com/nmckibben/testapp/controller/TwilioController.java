package com.nmckibben.testapp.controller;

import com.nmckibben.testapp.entity.WorkType;
import com.nmckibben.testapp.repository.WorkTypeRepository;
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

    private final UserService userService;
    private final CampaignDialerService campaignDialer;
    private final WorkTypeRepository workTypeRepo;

    public TwilioController(UserService userService,
                             CampaignDialerService campaignDialer,
                             WorkTypeRepository workTypeRepo) {
        this.userService    = userService;
        this.campaignDialer = campaignDialer;
        this.workTypeRepo   = workTypeRepo;
    }

    // ── Access token ──────────────────────────────────────────────────────────

    @GetMapping("/token")
    public ResponseEntity<Map<String, Object>> getToken(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            if (userDetails == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
            }
            String identity = userDetails.getUsername();

            VoiceGrant grant = new VoiceGrant();
            grant.setOutgoingApplicationSid(twimlAppSid);
            grant.setIncomingAllow(true);

            AccessToken token = new AccessToken.Builder(accountSid, apiKeySid, apiKeySecret)
                    .identity(identity)
                    .grant(grant)
                    .build();

            return ResponseEntity.ok(Map.of("token", token.toJwt(), "identity", identity));
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

    // ── Inbound / browser-SDK TwiML webhook ───────────────────────────────────

    /**
     * Primary TwiML webhook used by the TwiML App (browser SDK calls) and
     * inbound PSTN calls.
     *
     * Routing priority:
     *  1. client:xyz  → app-to-app call, connect directly to that client
     *  2. To matches a WorkType DNIS → ring agents staffed in that queue
     *  3. Outbound PSTN (To is a real number, not our own) → dial through
     *  4. Fallback → simulring all ONLINE agents
     */
    @PostMapping(value = "/voice", produces = MediaType.APPLICATION_XML_VALUE)
    public String handleVoice(
            @RequestParam(required = false) String To,
            @RequestParam(required = false) String From) {

        VoiceResponse.Builder responseBuilder = new VoiceResponse.Builder();

        if (To != null && To.startsWith("client:")) {
            // 1. App-to-app
            String clientId = To.substring("client:".length());
            responseBuilder.dial(new Dial.Builder()
                    .client(new Client.Builder(clientId).build())
                    .build());

        } else if (To != null && !To.isBlank()) {
            // 2. Check if To matches a WorkType DNIS
            Optional<WorkType> workTypeOpt = workTypeRepo.findByDnis(To);
            if (workTypeOpt.isPresent()) {
                responseBuilder.say(new Say.Builder(
                        "Thank you for calling. Please hold while we connect you.").build());
                dialWorkTypeAgents(responseBuilder, workTypeOpt.get());

            } else if (!To.equals(twilioPhoneNumber)) {
                // 3. Outbound PSTN
                responseBuilder.dial(new Dial.Builder()
                        .number(new Number.Builder(To).build())
                        .build());

            } else {
                // 4. Called our main number — simulring all ONLINE agents
                dialAllOnlineAgents(responseBuilder);
            }
        } else {
            // 4. Fallback
            dialAllOnlineAgents(responseBuilder);
        }

        return responseBuilder.build().toXml();
    }

    @PostMapping(value = "/voice/status", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<Void> handleVoiceStatus(
            @RequestParam(required = false) String CallStatus,
            @RequestParam(required = false) String CallSid) {
        return ResponseEntity.ok().build();
    }

    // ── WorkType-scoped TwiML (used by outbound campaign calls) ──────────────

    /**
     * TwiML for outbound campaign calls that belong to a specific WorkType.
     * When Twilio connects the called party, it hits this endpoint and we
     * ring only the agents staffed in that queue.
     * Public — called by Twilio's servers.
     */
    @PostMapping(value = "/worktype/{workTypeId}/voice", produces = MediaType.APPLICATION_XML_VALUE)
    public String handleWorkTypeVoice(@PathVariable Long workTypeId) {
        VoiceResponse.Builder response = new VoiceResponse.Builder();
        response.say(new Say.Builder("Please hold while we connect you to an agent.").build());

        workTypeRepo.findById(workTypeId).ifPresentOrElse(
                wt -> dialWorkTypeAgents(response, wt),
                ()  -> dialAllOnlineAgents(response)
        );

        return response.build().toXml();
    }

    // ── Campaign TwiML webhooks ───────────────────────────────────────────────

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
     * Status callback for campaign calls. Updates contact status in the DB.
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
        Set<String> staffedUsernames = wt.getAgents().stream()
                .map(com.nmckibben.testapp.entity.User::getUsername)
                .collect(Collectors.toSet());

        List<String> onlineInQueue = userService.getOnlineUsernames().stream()
                .filter(staffedUsernames::contains)
                .collect(java.util.stream.Collectors.toList());

        if (onlineInQueue.isEmpty()) {
            // Nobody in this queue — fall back to any online agent
            List<String> anyOnline = userService.getOnlineUsernames();
            if (anyOnline.isEmpty()) {
                response.say(new Say.Builder(
                        "Sorry, no agents are available right now. Please try again later.").build());
                return;
            }
            onlineInQueue = anyOnline;
        }

        Dial.Builder dialBuilder = new Dial.Builder();
        for (String username : onlineInQueue) {
            dialBuilder.client(new Client.Builder(username).build());
        }
        response.dial(dialBuilder.build());
    }

    /** Simulring all ONLINE agents (fallback when no queue is matched). */
    private void dialAllOnlineAgents(VoiceResponse.Builder response) {
        List<String> onlineUsernames = userService.getOnlineUsernames();
        if (onlineUsernames.isEmpty()) {
            response.say(new Say.Builder(
                    "Sorry, no agents are available right now. Please try again later.").build());
        } else {
            Dial.Builder dialBuilder = new Dial.Builder();
            for (String username : onlineUsernames) {
                dialBuilder.client(new Client.Builder(username).build());
            }
            response.dial(dialBuilder.build());
        }
    }
}
