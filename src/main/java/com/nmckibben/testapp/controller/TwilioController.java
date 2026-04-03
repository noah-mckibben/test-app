package com.nmckibben.testapp.controller;

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

    @Value("${twilio.default-client}")
    private String defaultClient;

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

    @PostMapping(value = "/voice", produces = MediaType.APPLICATION_XML_VALUE)
    public String handleVoice(
            @RequestParam(required = false) String To,
            @RequestParam(required = false) String From) {

        VoiceResponse.Builder responseBuilder = new VoiceResponse.Builder();

        if (To != null && !To.isBlank()) {
            Dial.Builder dialBuilder = new Dial.Builder().callerId(twilioPhoneNumber);

            if (To.startsWith("client:")) {
                // App-to-app call using Twilio client identity
                String clientIdentity = To.substring(7);
                dialBuilder.client(new Client.Builder(clientIdentity).build());
            } else if (To.equals(twilioPhoneNumber)) {
                // Inbound call to our Twilio number — route to default client
                dialBuilder.client(new Client.Builder(defaultClient).build());
            } else {
                // Outbound to a real phone number
                dialBuilder.number(new Number.Builder(To).build());
            }

            responseBuilder.dial(dialBuilder.build());
        } else {
            responseBuilder.say(new Say.Builder("Thank you for calling.").build());
        }

        return responseBuilder.build().toXml();
    }

    @PostMapping("/voice/status")
    public ResponseEntity<Void> handleStatus() {
        return ResponseEntity.ok().build();
    }
}
