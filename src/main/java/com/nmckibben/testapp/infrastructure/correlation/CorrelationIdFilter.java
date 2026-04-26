package com.nmckibben.testapp.infrastructure.correlation;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Attaches a correlation ID to every request so all log lines within a single
 * call chain can be linked together. When the caller supplies an
 * X-Correlation-ID header (e.g. from an upstream service or Twilio webhook
 * signature) we reuse it; otherwise we generate a new UUID.
 *
 * The ID is propagated to:
 *   - the MDC key "correlationId" (visible in log patterns via %X{correlationId})
 *   - the outbound X-Correlation-ID response header
 *
 * This is the first foundation stone for distributed tracing: when each domain
 * is extracted into its own service, you forward this header on outbound HTTP
 * calls (via a RestTemplate/WebClient interceptor) and the full call chain
 * remains traceable without a full APM agent.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorrelationIdFilter extends OncePerRequestFilter {

    public static final String HEADER      = "X-Correlation-ID";
    public static final String MDC_KEY     = "correlationId";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {
        String id = request.getHeader(HEADER);
        if (id == null || id.isBlank()) id = UUID.randomUUID().toString();

        MDC.put(MDC_KEY, id);
        response.setHeader(HEADER, id);
        try {
            chain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_KEY);
        }
    }
}
