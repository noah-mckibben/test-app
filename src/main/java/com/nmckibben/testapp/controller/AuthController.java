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

}
