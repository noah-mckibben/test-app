package com.nmckibben.testapp.controller;

import com.nmckibben.testapp.dto.AddContactRequest;
import com.nmckibben.testapp.dto.ContactDto;
import com.nmckibben.testapp.service.ContactService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contacts")
public class ContactController {

    private final ContactService contactService;

    public ContactController(ContactService contactService) {
        this.contactService = contactService;
    }

    @GetMapping
    public ResponseEntity<List<ContactDto>> getContacts(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(contactService.getContacts(userDetails.getUsername()));
    }

    @GetMapping("/search")
    public ResponseEntity<List<ContactDto>> searchContacts(@AuthenticationPrincipal UserDetails userDetails,
                                                            @RequestParam String name) {
        return ResponseEntity.ok(contactService.searchContacts(userDetails.getUsername(), name));
    }

    @PostMapping
    public ResponseEntity<ContactDto> addContact(@AuthenticationPrincipal UserDetails userDetails,
                                                  @RequestBody AddContactRequest request) {
        return ResponseEntity.ok(contactService.addContact(userDetails.getUsername(), request));
    }

    @DeleteMapping("/{contactId}")
    public ResponseEntity<Void> removeContact(@AuthenticationPrincipal UserDetails userDetails,
                                               @PathVariable Long contactId) {
        contactService.removeContact(userDetails.getUsername(), contactId);
        return ResponseEntity.noContent().build();
    }
}
