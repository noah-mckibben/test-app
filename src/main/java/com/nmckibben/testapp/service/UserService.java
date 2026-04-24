package com.nmckibben.testapp.service;

import com.nmckibben.testapp.dto.RegisterRequest;
import com.nmckibben.testapp.dto.UserDto;
import com.nmckibben.testapp.entity.User;
import com.nmckibben.testapp.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Business logic for user account management and presence tracking.
 *
 * <p>Handles registration (with BCrypt password hashing), lookup by username or phone number,
 * full-text user search, online/offline status updates, and retrieving the list of currently
 * online users (used by the Twilio inbound simulring flow).
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Creates and persists a new user account.
     *
     * @param request registration details (username, displayName, password, phoneNumber)
     * @return the saved {@link User} entity
     * @throws IllegalArgumentException if the username is already taken
     */
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

    /**
     * Searches all users whose username or display name contains the given query string
     * (case-insensitive).
     *
     * @param query the search term
     * @return matching users as DTOs
     */
    public List<UserDto> searchUsers(String query) {
        return userRepository.findAll().stream()
                .filter(u -> u.getUsername().toLowerCase().contains(query.toLowerCase())
                        || u.getDisplayName().toLowerCase().contains(query.toLowerCase()))
                .map(UserDto::from)
                .toList();
    }

    public void updateStatus(String username, String status) {
        User user = findByUsername(username);
        user.setStatus(status);
        userRepository.save(user);
    }

    public List<UserDto> getOnlineUsers() {
        return userRepository.findByStatus("ONLINE").stream()
                .map(UserDto::from)
                .toList();
    }

    /**
     * Returns the usernames of all currently online users.
     *
     * <p>Used by {@code TwilioController} to build the simulring {@code <Dial>} list
     * for inbound PSTN calls.
     */
    public List<String> getOnlineUsernames() {
        return userRepository.findByStatus("ONLINE").stream()
                .map(User::getUsername)
                .toList();
    }
}
