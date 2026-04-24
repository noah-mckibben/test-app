package com.nmckibben.testapp.controller;

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

    public TwilioController(UserService userService, CampaignDialerService campaignDialer) {
        this.userService     = userService;
        this.campaignDialer  = campaignDialer;
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

    @PostMapping(value = "/voice", produces = MediaType.APPLICATION_XML_VALUE)
    public String handleVoice(
            @RequestParam(required = false) String To,
            @RequestParam(required = false) String From) {

        VoiceResponse.Builder responseBuilder = new VoiceResponse.Builder();

        if (To != null && To.startsWith("client:")) {
            // App-to-app call
            String clientId = To.substring("client:".length());
            Dial dial = new Dial.Builder()
                    .client(new Client.Builder(clientId).build())
                    .build();
            responseBuilder.dial(dial);

        } else if (To != null && !To.equals(twilioPhoneNumber) && !To.isBlank()) {
            // Outbound PSTN
            Dial dial = new Dial.Builder()
                    .number(new Number.Builder(To).build())
                    .build();
            responseBuilder.dial(dial);

        } else {
            // Inbound PSTN — simulring all ONLINE agents
            List<String> onlineUsernames = userService.getOnlineUsernames();
            if (onlineUsernames.isEmpty()) {
                responseBuilder.say(new Say.Builder(
                        "Sorry, no agents are available right now. Please try again later.").build());
            } else {
                Dial.Builder dialBuilder = new Dial.Builder();
                for (String username : onlineUsernames) {
                    dialBuilder.client(new Client.Builder(username).build());
                }
                responseBuilder.dial(dialBuilder.build());
            }
        }

        return responseBuilder.build().toXml();
    }

    @PostMapping(value = "/voice/status", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<Void> handleVoiceStatus(
            @RequestParam(required = false) String CallStatus,
            @RequestParam(required = false) String CallSid) {
        return ResponseEntity.ok().build();
    }

    // ── Campaign TwiML webhooks ───────────────────────────────────────────────

    /**
     * TwiML for outbound campaign calls. When Twilio connects the called party,
     * it hits this URL. We respond with TTS greeting and then conference/agent dial.
     * Public — called by Twilio's servers, not the browser.
     */
    @PostMapping(value = "/campaign/{campaignId}/voice", produces = MediaType.APPLICATION_XML_VALUE)
    public String handleCampaignVoice(@PathVariable Long campaignId) {
        List<String> onlineUsernames = userService.getOnlineUsernames();
        VoiceResponse.Builder response = new VoiceResponse.Builder();

        response.say(new Say.Builder("Please hold while we connect you to an agent.").build());

        if (!onlineUsernames.isEmpty()) {
            Dial.Builder dialBuilder = new Dial.Builder();
            for (String username : onlineUsernames) {
                dialBuilder.client(new Client.Builder(username).build());
            }
            response.dial(dialBuilder.build());
        } else {
            response.say(new Say.Builder(
                    "We are sorry, no agents are currently available. We will call you back.").build());
        }

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
}
