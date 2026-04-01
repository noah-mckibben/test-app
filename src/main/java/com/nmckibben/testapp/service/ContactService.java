package com.nmckibben.testapp.service;

import com.nmckibben.testapp.dto.ContactDto;
import com.nmckibben.testapp.entity.Contact;
import com.nmckibben.testapp.entity.User;
import com.nmckibben.testapp.repository.ContactRepository;
import com.nmckibben.testapp.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ContactService {

    private final ContactRepository contactRepository;
    private final UserRepository userRepository;

    public ContactService(ContactRepository contactRepository, UserRepository userRepository) {
        this.contactRepository = contactRepository;
        this.userRepository = userRepository;
    }

    public List<ContactDto> getContacts(String username) {
        User owner = userRepository.findByUsername(username).orElseThrow();
        return contactRepository.findByOwner(owner).stream()
                .map(ContactDto::from)
                .toList();
    }

    public ContactDto addContact(String ownerUsername, Long contactUserId) {
        User owner = userRepository.findByUsername(ownerUsername).orElseThrow();
        User contactUser = userRepository.findById(contactUserId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (contactRepository.existsByOwnerAndContact(owner, contactUser)) {
            throw new IllegalArgumentException("Contact already added");
        }
        Contact contact = new Contact();
        contact.setOwner(owner);
        contact.setContact(contactUser);
        return ContactDto.from(contactRepository.save(contact));
    }

    public void removeContact(String ownerUsername, Long contactId) {
        User owner = userRepository.findByUsername(ownerUsername).orElseThrow();
        contactRepository.findById(contactId).ifPresent(c -> {
            if (c.getOwner().getId().equals(owner.getId())) {
                contactRepository.delete(c);
            }
        });
    }
}
