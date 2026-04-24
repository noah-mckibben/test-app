package com.nmckibben.testapp.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nmckibben.testapp.repository.UserRepository;
import com.nmckibben.testapp.security.JwtTokenProvider;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket handler that relays WebRTC signaling messages between authenticated users.
 *
 * <p>On connection, the handler validates the JWT passed as a {@code token} query parameter
 * (e.g. {@code /ws/signal?token=eyJ…}). If the token is missing or invalid the socket is
 * closed immediately with {@link CloseStatus#NOT_ACCEPTABLE}. Once accepted, the user's
 * live {@link WebSocketSession} is stored in an in-memory map keyed by their database ID.
 *
 * <p>Each incoming text frame is deserialized as a {@link SignalingMessage}. The handler
 * sets the {@code from} field to the sender's user ID and forwards the message to the
 * session identified by {@code to}. If the target user is not connected the message is
 * silently dropped.
 *
 * <p>On disconnect the session is removed from the map.
 */
@Component
public class SignalingHandler extends TextWebSocketHandler {

    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /** Live WebSocket sessions keyed by user ID. Thread-safe for concurrent connects/disconnects. */
    private final ConcurrentHashMap<Long, WebSocketSession> sessions = new ConcurrentHashMap<>();

    public SignalingHandler(JwtTokenProvider tokenProvider, UserRepository userRepository) {
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
    }

    /**
     * Called when a new WebSocket connection is established.
     *
     * <p>Extracts and validates the JWT from the {@code token} query parameter.
     * If valid, looks up the corresponding {@link com.nmckibben.testapp.entity.User}
     * and registers the session. Invalid tokens result in immediate closure.
     */
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String token = getTokenFromSession(session);
        if (token == null || !tokenProvider.validateToken(token)) {
            session.close(CloseStatus.NOT_ACCEPTABLE);
            return;
        }
        String username = tokenProvider.getUsernameFromToken(token);
        userRepository.findByUsername(username).ifPresent(user -> {
            sessions.put(user.getId(), session);
            session.getAttributes().put("userId", user.getId());
        });
    }

    /**
     * Routes an incoming signaling message to the target user's session.
     *
     * <p>Deserializes the JSON frame, stamps the sender's ID onto the {@code from} field,
     * then looks up the target session by {@code to}. The message is forwarded only if
     * the target session exists and is currently open.
     */
    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        SignalingMessage msg = objectMapper.readValue(message.getPayload(), SignalingMessage.class);
        Long fromId = (Long) session.getAttributes().get("userId");
        msg.setFrom(fromId);
        WebSocketSession targetSession = sessions.get(msg.getTo());
        if (targetSession != null && targetSession.isOpen()) {
            targetSession.sendMessage(new TextMessage(objectMapper.writeValueAsString(msg)));
        }
    }

    /** Removes the user's session from the active map when the connection closes. */
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Long userId = (Long) session.getAttributes().get("userId");
        if (userId != null) {
            sessions.remove(userId);
        }
    }

    /**
     * Extracts the JWT from the WebSocket handshake URI query string.
     *
     * @param session the newly established session
     * @return the raw token string, or {@code null} if the {@code token} parameter is absent
     */
    private String getTokenFromSession(WebSocketSession session) {
        String query = session.getUri() != null ? session.getUri().getQuery() : null;
        if (query != null && query.startsWith("token=")) {
            return query.substring(6);
        }
        return null;
    }
}
