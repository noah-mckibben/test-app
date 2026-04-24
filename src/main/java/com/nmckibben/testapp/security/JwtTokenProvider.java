package com.nmckibben.testapp.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Creates, parses, and validates JSON Web Tokens (JWTs) used for stateless authentication.
 *
 * <p>Tokens are signed with HMAC-SHA using the secret configured in {@code jwt.secret}.
 * The expiration window (in milliseconds) is read from {@code jwt.expiration};
 * a typical value is {@code 86400000} (24 hours).
 */
@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    /** Derives the HMAC signing key from the configured secret. */
    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Generates a signed JWT for the given username.
     *
     * @param username the subject to embed in the token
     * @return a compact, URL-safe JWT string
     */
    public String generateToken(String username) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtExpiration);
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(now)
                .setExpiration(expiry)
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Extracts the username (subject claim) from a token.
     *
     * @param token a valid, non-expired JWT
     * @return the username stored in the token's subject claim
     * @throws io.jsonwebtoken.JwtException if the token is malformed or expired
     */
    public String getUsernameFromToken(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    /**
     * Returns {@code true} if the token is well-formed, properly signed, and not expired.
     *
     * @param token the JWT to validate
     * @return {@code true} if valid, {@code false} otherwise
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
