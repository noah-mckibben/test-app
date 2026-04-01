package com.nmckibben.testapp.dto;

import com.nmckibben.testapp.entity.Contact;

public class ContactDto {
    private Long id;
    private String name;
    private String phoneNumber;

    public static ContactDto from(Contact contact) {
        ContactDto dto = new ContactDto();
        dto.id = contact.getId();
        dto.name = contact.getName();
        dto.phoneNumber = contact.getPhoneNumber();
        return dto;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getPhoneNumber() { return phoneNumber; }
}
