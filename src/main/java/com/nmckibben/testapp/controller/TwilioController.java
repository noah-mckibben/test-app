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

/**
 * Handles Twilio Voice integration: access token generation and TwiML call routing.
 *
 * <h2>Call routing logic (POST /voice)</h2>
 * <ol>
 *   <li><b>Outbound PSTN</b> – {@code To} is a real phone number (e.g. {@code +15559876543}).
 *       Responds with {@code <Dial><Number>…</Number></Dial>}.</li>
 *   <li><b>App-to-app</b> – {@code To} starts with {@code client:} (e.g. {@code client:alice}).
 *       Responds with {@code <Dial><Client>alice</Client></Dial>}.</li>
 *   <li><b>Inbound PSTN</b> – {@code To} is blank or equals the Twilio phone number.
 *       Simulrings all currently {@code ONLINE} users. If nobody is online, plays a
 *       "no one available" message.</li>
 * </ol>
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

    private final UserService userService;

    public TwilioController(UserService userService) {
        this.userService = userService;
    }

    // ── Access token for the browser SDK ─────────────────────────────────────

    /**
     * Issues a short-lived Twilio Access Token for the browser Voice SDK.
     *
     * <p>The token includes a {@link VoiceGrant} that authorises both outbound calls
     * (via the configured TwiML App) and inbound calls to this client identity.
     * The client identity is set to the authenticated user's username.
     *
     * @return 200 with {@code { token: "…", identity: "username" }},
     *         401 if not authenticated, or 500 with debug details on SDK errors
     */
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

    /**
     * TwiML webhook called by Twilio whenever a call is initiated or received.
     *
     * <p>Twilio posts the {@code To} and {@code From} parameters; this method inspects
     * {@code To} to determine which call flow to execute (see class-level Javadoc).
     * Must be publicly accessible (no JWT required) so Twilio's servers can reach it.
     *
     * @param To   destination identity/number supplied by Twilio; may be null on some inbound calls
     * @param From caller ID supplied by Twilio
     * @return TwiML XML string instructing Twilio how to route the call
     */
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
