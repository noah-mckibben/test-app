package com.nmckibben.testapp.dto;

import com.nmckibben.testapp.entity.Contact;
import com.nmckibben.testapp.entity.User;

public class ContactDto {
    private Long id;
    private String name;
    private String phoneNumber;

    // Populated when the contact's phone number matches a registered app user.
    // Null when the contact is a regular external number only.
    private Long appUserId;
    private String appUsername;
    private String appStatus;

    /** Use when the contact is not a registered app user. */
    public static ContactDto from(Contact contact) {
        return from(contact, null);
    }

    /**
     * Use when you have already resolved whether the contact's phone number
     * belongs to a registered app user. Pass null for appUser if it does not.
     */
    public static ContactDto from(Contact contact, User appUser) {
        ContactDto dto = new ContactDto();
        dto.id = contact.getId();
        dto.name = contact.getName();
        dto.phoneNumber = contact.getPhoneNumber();
        if (appUser != null) {
            dto.appUserId   = appUser.getId();
            dto.appUsername = appUser.getUsername();
            dto.appStatus   = appUser.getStatus();
        }
        return dto;
    }

    public Long getId()          { return id; }
    public String getName()      { return name; }
    public String getPhoneNumber(){ return phoneNumber; }
    public Long getAppUserId()   { return appUserId; }
    public String getAppUsername(){ return appUsername; }
    public String getAppStatus() { return appStatus; }
}
