package com.nmckibben.testapp.controller;

import com.nmckibben.testapp.dto.AuthResponse;
import com.nmckibben.testapp.dto.LoginRequest;
import com.nmckibben.testapp.dto.RegisterRequest;
import com.nmckibben.testapp.dto.UserDto;
import com.nmckibben.testapp.entity.User;
import com.nmckibben.testapp.security.JwtTokenProvider;
import com.nmckibben.testapp.service.UserService;
import com.twilio.jwt.accesstoken.AccessToken;
import com.twilio.jwt.accesstoken.VoiceGrant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Value("${twilio.account-sid}") private String accountSid;
    @Value("${twilio.api-key-sid}") private String apiKeySid;
    @Value("${twilio.api-key-secret}") private String apiKeySecret;
    @Value("${twilio.twiml-app-sid}") private String twimlAppSid;

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserService userService;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtTokenProvider tokenProvider,
                          UserService userService) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.userService = userService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
        String token = tokenProvider.generateToken(request.getUsername());
        User user = userService.findByUsername(request.getUsername());
        userService.updateStatus(request.getUsername(), "ONLINE");
        return ResponseEntity.ok(new AuthResponse(token, UserDto.from(user)));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        User user = userService.register(request);
        String token = tokenProvider.generateToken(user.getUsername());
        return ResponseEntity.ok(new AuthResponse(token, UserDto.from(user)));
    }

    @GetMapping("/twilio-test")
    public ResponseEntity<Map<String, Object>> twilioTest() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("accountSid_prefix", accountSid != null ? accountSid.substring(0, Math.min(6, accountSid.length())) : "NULL");
        result.put("apiKeySid_prefix", apiKeySid != null ? apiKeySid.substring(0, Math.min(6, apiKeySid.length())) : "NULL");
        result.put("apiKeySecret_present", apiKeySecret != null && !apiKeySecret.equals("FILL_IN"));
        result.put("twimlAppSid_prefix", twimlAppSid != null ? twimlAppSid.substring(0, Math.min(6, twimlAppSid.length())) : "NULL");
        try {
            VoiceGrant grant = new VoiceGrant();
            grant.setOutgoingApplicationSid(twimlAppSid);
            grant.setIncomingAllow(true);
            AccessToken token = new AccessToken.Builder(accountSid, apiKeySid, apiKeySecret)
                    .identity("test-user")
                    .grant(grant)
                    .build();
            result.put("status", "SUCCESS");
            result.put("token_prefix", token.toJwt().substring(0, 20) + "...");
        } catch (Exception e) {
            result.put("status", "FAILED");
            result.put("error", e.getClass().getSimpleName());
            result.put("message", e.getMessage());
        }
        return ResponseEntity.ok(result);
    }
}
