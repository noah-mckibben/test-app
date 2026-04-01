package com.nmckibben.testapp.controller;

import com.nmckibben.testapp.dto.UserDto;
import com.nmckibben.testapp.entity.User;
import com.nmckibben.testapp.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @GetMapping("/search")
    public ResponseEntity<List<UserDto>> searchUsers(@RequestParam String q) {
        return ResponseEntity.ok(userService.searchUsers(q));
    }

    @PutMapping("/status")
    public ResponseEntity<Void> updateStatus(@AuthenticationPrincipal UserDetails userDetails,
                                              @RequestParam String status) {
        userService.updateStatus(userDetails.getUsername(), status);
        return ResponseEntity.ok().build();
    }
}
