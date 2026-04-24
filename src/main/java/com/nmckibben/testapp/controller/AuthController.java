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


/**
 * Handles user authentication: registration and login.
 *
 * <p>Both endpoints return an {@link AuthResponse} containing a JWT and the user's
 * profile. The client should store the JWT and include it as a
 * {@code Authorization: Bearer <token>} header on all subsequent requests.
 */
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

    /**
     * Authenticates an existing user.
     *
     * <p>Validates credentials via Spring Security's {@link AuthenticationManager},
     * generates a JWT, and sets the user's status to {@code ONLINE}.
     *
     * @param request JSON body with {@code username} and {@code password}
     * @return 200 with JWT + user profile, or 401 if credentials are invalid
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
        String token = tokenProvider.generateToken(request.getUsername());
        User user = userService.findByUsername(request.getUsername());
        userService.updateStatus(request.getUsername(), "ONLINE");
        return ResponseEntity.ok(new AuthResponse(token, UserDto.from(user)));
    }

    /**
     * Registers a new user account.
     *
     * <p>Throws {@link IllegalArgumentException} (→ 400) if the username is already taken.
     *
     * @param request JSON body with {@code username}, {@code displayName}, {@code password},
     *                and optionally {@code phoneNumber}
     * @return 200 with JWT + user profile
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        User user = userService.register(request);
        String token = tokenProvider.generateToken(user.getUsername());
        return ResponseEntity.ok(new AuthResponse(token, UserDto.from(user)));
    }


}
