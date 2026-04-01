package com.nmckibben.testapp.service;

import com.nmckibben.testapp.dto.AddContactRequest;
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

    public List<ContactDto> searchContacts(String username, String name) {
        User owner = userRepository.findByUsername(username).orElseThrow();
        return contactRepository.findByOwnerAndNameContainingIgnoreCase(owner, name).stream()
                .map(ContactDto::from)
                .toList();
    }

    public ContactDto addContact(String ownerUsername, AddContactRequest request) {
        User owner = userRepository.findByUsername(ownerUsername).orElseThrow();
        Contact contact = new Contact();
        contact.setOwner(owner);
        contact.setName(request.getName());
        contact.setPhoneNumber(request.getPhoneNumber());
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
