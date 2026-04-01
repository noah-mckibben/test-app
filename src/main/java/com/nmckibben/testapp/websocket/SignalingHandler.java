package com.nmckibben.testapp.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nmckibben.testapp.repository.UserRepository;
import com.nmckibben.testapp.security.JwtTokenProvider;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.concurrent.ConcurrentHashMap;

@Component
public class SignalingHandler extends TextWebSocketHandler {

    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final ConcurrentHashMap<Long, WebSocketSession> sessions = new ConcurrentHashMap<>();

    public SignalingHandler(JwtTokenProvider tokenProvider, UserRepository userRepository) {
        this.tokenProvider = tokenProvider;
        this.userRepository = userRepository;
    }

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

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Long userId = (Long) session.getAttributes().get("userId");
        if (userId != null) {
            sessions.remove(userId);
        }
    }

    private String getTokenFromSession(WebSocketSession session) {
        String query = session.getUri() != null ? session.getUri().getQuery() : null;
        if (query != null && query.startsWith("token=")) {
            return query.substring(6);
        }
        return null;
    }
}
