package com.nmckibben.testapp.controller;

import com.nmckibben.testapp.dto.UserDto;
import com.nmckibben.testapp.entity.User;
import com.nmckibben.testapp.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByUsername(userDetails.getUsername());
        return ResponseEntity.ok(UserDto.from(user));
    }

    @GetMapping("/online")
    public ResponseEntity<List<UserDto>> getOnlineUsers() {
        return ResponseEntity.ok(userService.getOnlineUsers());
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserDto>> searchUsers(@RequestParam String q) {
        return ResponseEntity.ok(userService.searchUsers(q));
    }

    @GetMapping("/phone/{number}")
    public ResponseEntity<UserDto> findByPhoneNumber(@PathVariable String number) {
        try {
            User user = userService.findByPhoneNumber(number);
            return ResponseEntity.ok(UserDto.from(user));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/status")
    public ResponseEntity<Void> updateStatus(@AuthenticationPrincipal UserDetails userDetails,
                                              @RequestParam String status) {
        userService.updateStatus(userDetails.getUsername(), status);
        return ResponseEntity.ok().build();
    }

    /** Save the user's profile picture as a base64 data URL. */
    @PutMapping("/me/avatar")
    public ResponseEntity<UserDto> updateAvatar(@AuthenticationPrincipal UserDetails userDetails,
                                                @RequestBody Map<String, String> body) {
        String avatarData = body.get("avatarData");
        if (avatarData == null || avatarData.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(userService.updateAvatar(userDetails.getUsername(), avatarData));
    }

    /** Update editable profile fields (displayName, phoneNumber). */
    @PutMapping("/me/profile")
    public ResponseEntity<UserDto> updateProfile(@AuthenticationPrincipal UserDetails userDetails,
                                                 @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(userService.updateProfile(
                userDetails.getUsername(),
                body.get("displayName"),
                body.get("phoneNumber")
        ));
    }
}
