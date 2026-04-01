package com.nmckibben.testapp.controller;

import com.nmckibben.testapp.security.JwtTokenProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/debug")
public class DebugController {

    private final JwtTokenProvider tokenProvider;

    public DebugController(JwtTokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    @GetMapping("/token-check")
    public ResponseEntity<Map<String, Object>> checkToken(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.ok(Map.of("error", "No Bearer token provided"));
        }
        String token = authHeader.substring(7);
        boolean valid = tokenProvider.validateToken(token);
        if (!valid) {
            return ResponseEntity.ok(Map.of("valid", false, "reason", "Token failed validation - likely signed with different secret"));
        }
        String username = tokenProvider.getUsernameFromToken(token);
        return ResponseEntity.ok(Map.of("valid", true, "username", username));
    }
}
