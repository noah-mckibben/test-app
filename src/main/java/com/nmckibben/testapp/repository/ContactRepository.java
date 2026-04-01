package com.nmckibben.testapp.repository;

import com.nmckibben.testapp.entity.Contact;
import com.nmckibben.testapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ContactRepository extends JpaRepository<Contact, Long> {
    List<Contact> findByOwner(User owner);
    Optional<Contact> findByOwnerAndPhoneNumber(User owner, String phoneNumber);
    List<Contact> findByOwnerAndNameContainingIgnoreCase(User owner, String name);
}
