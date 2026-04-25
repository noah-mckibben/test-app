package com.nmckibben.testapp.dto;

import com.nmckibben.testapp.entity.User;
import java.time.LocalDateTime;

public class UserDto {
    private Long id;
    private String username;
    private String displayName;
    private String phoneNumber;
    private String status;
    private String role;
    private String avatarData;
    private LocalDateTime createdAt;

    /** Full DTO — includes avatarData. Use only for single-user profile responses. */
    public static UserDto from(User user) {
        UserDto dto = new UserDto();
        dto.id = user.getId();
        dto.username = user.getUsername();
        dto.displayName = user.getDisplayName();
        dto.phoneNumber = user.getPhoneNumber();
        dto.status = user.getStatus();
        dto.role = user.getRole();
        dto.avatarData = user.getAvatarData();
        dto.createdAt = user.getCreatedAt();
        return dto;
    }

    /** Slim DTO — omits avatarData. Use for list endpoints to avoid sending MB of base64 per user. */
    public static UserDto fromSlim(User user) {
        UserDto dto = new UserDto();
        dto.id = user.getId();
        dto.username = user.getUsername();
        dto.displayName = user.getDisplayName();
        dto.phoneNumber = user.getPhoneNumber();
        dto.status = user.getStatus();
        dto.role = user.getRole();
        dto.createdAt = user.getCreatedAt();
        return dto;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getDisplayName() { return displayName; }
    public String getPhoneNumber() { return phoneNumber; }
    public String getStatus() { return status; }
    public String getRole() { return role; }
    public String getAvatarData() { return avatarData; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
