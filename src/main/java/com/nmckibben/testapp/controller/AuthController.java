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
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/auth")
public class AuthController {

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

    @GetMapping("/ping")
    public String ping() {
        return "pong";
    }

    @GetMapping("/env-check")
    public String envCheck() {
        StringBuilder sb = new StringBuilder();
        sb.append("TWILIO_ACCOUNT_SID=").append(System.getenv("TWILIO_ACCOUNT_SID") != null ? "SET" : "NULL").append("\n");
        sb.append("TWILIO_API_KEY_SID=").append(System.getenv("TWILIO_API_KEY_SID") != null ? "SET" : "NULL").append("\n");
        sb.append("TWILIO_API_KEY_SECRET=").append(System.getenv("TWILIO_API_KEY_SECRET") != null ? "SET" : "NULL").append("\n");
        sb.append("TWILIO_TWIML_APP_SID=").append(System.getenv("TWILIO_TWIML_APP_SID") != null ? "SET" : "NULL").append("\n");
        sb.append("TWILIO_AUTH_TOKEN=").append(System.getenv("TWILIO_AUTH_TOKEN") != null ? "SET" : "NULL").append("\n");
        sb.append("JWT_SECRET=").append(System.getenv("JWT_SECRET") != null ? "SET" : "NULL").append("\n");
        return sb.toString();
    }

    @GetMapping("/twilio-test")
    public String twilioTest() {
        // Read directly from environment variables — bypasses @Value injection entirely
        String acctSid = System.getenv("TWILIO_ACCOUNT_SID");
        String apiKeySid = System.getenv("TWILIO_API_KEY_SID");
        String apiKeySecret = System.getenv("TWILIO_API_KEY_SECRET");
        String appSid = System.getenv("TWILIO_TWIML_APP_SID");

        StringBuilder sb = new StringBuilder();
        sb.append("env.TWILIO_ACCOUNT_SID=").append(acctSid != null ? acctSid.substring(0, Math.min(6, acctSid.length())) + "..." : "NULL").append("\n");
        sb.append("env.TWILIO_API_KEY_SID=").append(apiKeySid != null ? apiKeySid.substring(0, Math.min(6, apiKeySid.length())) + "..." : "NULL").append("\n");
        sb.append("env.TWILIO_API_KEY_SECRET_present=").append(apiKeySecret != null && !apiKeySecret.isBlank()).append("\n");
        sb.append("env.TWILIO_TWIML_APP_SID=").append(appSid != null ? appSid.substring(0, Math.min(6, appSid.length())) + "..." : "NULL").append("\n");

        if (acctSid == null || apiKeySid == null || apiKeySecret == null || appSid == null) {
            sb.append("status=FAILED\n");
            sb.append("reason=One or more env vars are null — check Azure App Settings");
            return sb.toString();
        }

        try {
            VoiceGrant grant = new VoiceGrant();
            grant.setOutgoingApplicationSid(appSid);
            grant.setIncomingAllow(true);
            AccessToken token = new AccessToken.Builder(acctSid, apiKeySid, apiKeySecret)
                    .identity("test-user")
                    .grant(grant)
                    .build();
            sb.append("status=SUCCESS\n");
            sb.append("token_prefix=").append(token.toJwt().substring(0, 20)).append("...");
        } catch (Throwable t) {
            // Catch Throwable (not just Exception) to capture Errors like ExceptionInInitializerError
            sb.append("status=FAILED\n");
            sb.append("error_type=").append(t.getClass().getName()).append("\n");
            sb.append("message=").append(t.getMessage()).append("\n");
            Throwable cause = t.getCause();
            if (cause != null) {
                sb.append("cause=").append(cause.getClass().getName()).append(": ").append(cause.getMessage());
            }
        }
        return sb.toString();
    }
}
