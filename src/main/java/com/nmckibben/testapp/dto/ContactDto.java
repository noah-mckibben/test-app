package com.nmckibben.testapp.dto;

import com.nmckibben.testapp.entity.Contact;

public class ContactDto {
    private Long id;
    private UserDto contact;

    public static ContactDto from(Contact contact) {
        ContactDto dto = new ContactDto();
        dto.id = contact.getId();
        dto.contact = UserDto.from(contact.getContact());
        return dto;
    }

    public Long getId() { return id; }
    public UserDto getContact() { return contact; }
}
