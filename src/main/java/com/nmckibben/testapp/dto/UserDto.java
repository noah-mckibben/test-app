package com.nmckibben.testapp.dto;

import com.nmckibben.testapp.entity.User;

public class UserDto {
    private Long id;
    private String username;
    private String displayName;
    private String status;

    public static UserDto from(User user) {
        UserDto dto = new UserDto();
        dto.id = user.getId();
        dto.username = user.getUsername();
        dto.displayName = user.getDisplayName();
        dto.status = user.getStatus();
        return dto;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getDisplayName() { return displayName; }
    public String getStatus() { return status; }
}
