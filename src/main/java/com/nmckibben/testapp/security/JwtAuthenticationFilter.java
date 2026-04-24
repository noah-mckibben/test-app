package com.nmckibben.testapp.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Servlet filter that authenticates requests by reading a JWT from the
 * {@code Authorization: Bearer <token>} header.
 *
 * <p>Runs once per request ({@link OncePerRequestFilter}). If a valid token is found,
 * a {@link UsernamePasswordAuthenticationToken} is placed in the
 * {@link SecurityContextHolder} so that downstream code (controllers, method security,
 * {@code @AuthenticationPrincipal}) can access the authenticated user.
 *
 * <p>If the header is absent, malformed, or the token is invalid, the filter simply
 * continues the chain without setting authentication — Spring Security will then apply
 * its own access rules (typically a 401 or redirect to login).
 */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final UserDetailsServiceImpl userDetailsService;

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider, UserDetailsServiceImpl userDetailsService) {
        this.tokenProvider = tokenProvider;
        this.userDetailsService = userDetailsService;
    }

    /**
     * Extracts and validates the Bearer token, then populates the security context.
     *
     * <p>Any exception during token processing is caught and logged so that a bad token
     * never causes the entire filter chain to abort — unauthenticated requests simply
     * fall through to Spring Security's normal handling.
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        try {
            String header = request.getHeader("Authorization");
            if (header != null && header.startsWith("Bearer ")) {
                String token = header.substring(7);
                if (tokenProvider.validateToken(token)) {
                    String username = tokenProvider.getUsernameFromToken(token);
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            }
        } catch (Exception e) {
            System.err.println("JWT filter error: " + e.getClass().getSimpleName() + ": " + e.getMessage());
        }
        chain.doFilter(request, response);
    }
}
