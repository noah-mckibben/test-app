package com.nmckibben.testapp.service;

import com.nmckibben.testapp.dto.RegisterRequest;
import com.nmckibben.testapp.dto.UserDto;
import com.nmckibben.testapp.entity.User;
import com.nmckibben.testapp.infrastructure.events.AgentStatusChangedEvent;
import com.nmckibben.testapp.infrastructure.events.DomainEventPublisher;
import com.nmckibben.testapp.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Agent domain service.
 *
 * Publishes AgentStatusChangedEvent when an agent's presence changes so that:
 *   - The Analytics domain can log occupancy (CallTraceEventListener)
 *   - The Routing domain can invalidate its online-agent cache (future)
 *   - The Campaign domain can pause/resume auto-dialing (future)
 *
 * This replaces what were previously direct cross-domain calls (WebSocket
 * handler and controller code reading User status from the DB on every route).
 */
@Service
public class UserService {

    private final UserRepository     userRepository;
    private final PasswordEncoder    passwordEncoder;
    private final DomainEventPublisher eventBus;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       DomainEventPublisher eventBus) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.eventBus        = eventBus;
    }

    public User register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already taken");
        }
        User user = new User();
        user.setUsername(request.getUsername());
        user.setDisplayName(request.getDisplayName());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhoneNumber(request.getPhoneNumber());
        return userRepository.save(user);
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public User findByPhoneNumber(String phoneNumber) {
        return userRepository.findByPhoneNumber(phoneNumber)
                .orElseThrow(() -> new RuntimeException("No user with that number"));
    }

    public List<UserDto> searchUsers(String query) {
        return userRepository.findAll().stream()
                .filter(u -> u.getUsername().toLowerCase().contains(query.toLowerCase())
                        || u.getDisplayName().toLowerCase().contains(query.toLowerCase()))
                .map(UserDto::from)
                .toList();
    }

    /**
     * Update agent presence and publish AgentStatusChangedEvent.
     * All interested domains react asynchronously via event listeners.
     */
    public void updateStatus(String username, String status) {
        User user = findByUsername(username);
        String previous = user.getStatus();
        user.setStatus(status);
        userRepository.save(user);

        // Publish only if status actually changed
        if (!status.equals(previous)) {
            eventBus.publish(new AgentStatusChangedEvent(null, username, previous, status));
        }
    }

    public List<UserDto> getOnlineUsers() {
        return userRepository.findByStatus("ONLINE").stream()
                .map(UserDto::from)
                .toList();
    }

    public List<String> getOnlineUsernames() {
        return userRepository.findByStatus("ONLINE").stream()
                .map(User::getUsername)
                .toList();
    }

    public UserDto updateAvatar(String username, String avatarData) {
        User user = findByUsername(username);
        user.setAvatarData(avatarData);
        return UserDto.from(userRepository.save(user));
    }

    public UserDto updateProfile(String username, String displayName, String phoneNumber) {
        User user = findByUsername(username);
        if (displayName != null && !displayName.isBlank()) user.setDisplayName(displayName);
        if (phoneNumber != null) user.setPhoneNumber(phoneNumber.isBlank() ? null : phoneNumber);
        return UserDto.from(userRepository.save(user));
    }
}
