package com.nmckibben.testapp.controller;

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

    public TwilioController(UserService userService) {
        this.userService = userService;
    }

    // ── Access token for the browser SDK ─────────────────────────────────────

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

            return ResponseEntity.ok(Map.of(
                    "token", token.toJwt(),
                    "identity", identity
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "error", e.getClass().getSimpleName(),
                    "message", e.getMessage() != null ? e.getMessage() : "null",
                    "accountSid", accountSid != null ? accountSid.substring(0, 6) + "..." : "NULL",
                    "apiKeySid", apiKeySid != null ? apiKeySid.substring(0, 6) + "..." : "NULL",
                    "twimlAppSid", twimlAppSid != null ? twimlAppSid.substring(0, 6) + "..." : "NULL"
            ));
        }
    }

    // ── TwiML voice webhook ───────────────────────────────────────────────────
    //
    // Three call flows are handled here:
    //
    //  1. App → external PSTN number
    //     To = "+15559876543"  (a real phone number)
    //     Action: <Dial><Number>+15559876543</Number></Dial>
    //
    //  2. App → another app user  (in-app call)
    //     To = "client:alice"
    //     Action: <Dial><Client>alice</Client></Dial>
    //
    //  3. External PSTN → this Twilio number  (inbound call)
    //     To = twilioPhoneNumber  (or To is blank)
    //     Action: simulring every ONLINE user; first to answer takes the call.
    //             If no one is online, play a message.

    @PostMapping(value = "/voice", produces = MediaType.APPLICATION_XML_VALUE)
    public String handleVoice(
            @RequestParam(required = false) String To,
            @RequestParam(required = false) String From) {

        VoiceResponse.Builder responseBuilder = new VoiceResponse.Builder();

        if (To != null && !To.isBlank() && !To.equals(twilioPhoneNumber)) {

            Dial.Builder dialBuilder = new Dial.Builder().callerId(twilioPhoneNumber);

            if (To.startsWith("client:")) {
                // ── Flow 2: app-to-app ──────────────────────────────────
                String clientIdentity = To.substring(7);
                dialBuilder.client(new Client.Builder(clientIdentity).build());
            } else {
                // ── Flow 1: outbound PSTN ───────────────────────────────
                dialBuilder.number(new Number.Builder(To).build());
            }

            responseBuilder.dial(dialBuilder.build());

        } else {
            // ── Flow 3: inbound PSTN — simulring all ONLINE users ───────
            List<String> onlineUsernames = userService.getOnlineUsernames();

            if (onlineUsernames.isEmpty()) {
                responseBuilder.say(new Say.Builder(
                        "Sorry, no one is available right now. Please try again later.").build());
            } else {
                Dial.Builder dialBuilder = new Dial.Builder()
                        .callerId(twilioPhoneNumber)
                        .timeout(30);  // ring for 30 s before giving up

                for (String username : onlineUsernames) {
                    dialBuilder.client(new Client.Builder(username).build());
                }

                responseBuilder.dial(dialBuilder.build());
            }
        }

        return responseBuilder.build().toXml();
    }

    @PostMapping("/voice/status")
    public ResponseEntity<Void> handleStatus() {
        return ResponseEntity.ok().build();
    }
}
