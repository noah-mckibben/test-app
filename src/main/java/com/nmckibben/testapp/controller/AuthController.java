package com.nmckibben.testapp.controller;

import com.nmckibben.testapp.dto.AuthResponse;
import com.nmckibben.testapp.dto.LoginRequest;
import com.nmckibben.testapp.dto.RegisterRequest;
import com.nmckibben.testapp.dto.UserDto;
import com.nmckibben.testapp.entity.User;
import com.nmckibben.testapp.security.JwtTokenProvider;
import com.nmckibben.testapp.service.UserService;
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

    // TEMP: verify Azure has the correct Twilio credentials loaded
    @GetMapping("/cred-check")
    public String credCheck() {
        String sid   = System.getenv("TWILIO_API_KEY_SID");
        String sec   = System.getenv("TWILIO_API_KEY_SECRET");
        String acct  = System.getenv("TWILIO_ACCOUNT_SID");
        String app   = System.getenv("TWILIO_TWIML_APP_SID");
        return "API_KEY_SID="    + (sid  != null ? sid.substring(0, Math.min(8, sid.length()))  + "..." : "NULL") + "\n"
             + "API_KEY_SECRET=" + (sec  != null ? sec.substring(0, Math.min(8, sec.length()))  + "..." : "NULL") + "\n"
             + "ACCOUNT_SID="   + (acct != null ? acct.substring(0, Math.min(8, acct.length())) + "..." : "NULL") + "\n"
             + "TWIML_APP_SID=" + (app  != null ? app.substring(0, Math.min(8, app.length()))  + "..." : "NULL") + "\n";
    }

}
