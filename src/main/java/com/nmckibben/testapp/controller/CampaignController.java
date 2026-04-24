package com.nmckibben.testapp.controller;

import com.nmckibben.testapp.entity.Campaign;
import com.nmckibben.testapp.entity.CampaignContact;
import com.nmckibben.testapp.service.CampaignService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/campaigns")
@PreAuthorize("hasAnyRole('ADMIN','SUPERVISOR')")
public class CampaignController {

    private final CampaignService svc;

    public CampaignController(CampaignService svc) { this.svc = svc; }

    @GetMapping
    public List<Campaign> getAll() { return svc.getAll(); }

    @GetMapping("/{id}")
    public Campaign get(@PathVariable Long id) { return svc.get(id); }

    @PostMapping
    public Campaign create(@RequestBody Campaign c) { return svc.save(c); }

    @PutMapping("/{id}")
    public Campaign update(@PathVariable Long id, @RequestBody Campaign c) {
        c.setId(id); return svc.save(c);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        svc.delete(id); return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/status")
    public Campaign updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return svc.setStatus(id, body.get("status"));
    }

    @GetMapping("/{id}/contacts")
    public List<CampaignContact> getContacts(@PathVariable Long id) {
        return svc.getContacts(id);
    }

    @PostMapping("/{id}/contacts")
    public CampaignContact addContact(@PathVariable Long id, @RequestBody CampaignContact cc) {
        cc.setCampaign(svc.get(id));
        return svc.saveContact(cc);
    }

    @DeleteMapping("/contacts/{contactId}")
    public ResponseEntity<Void> deleteContact(@PathVariable Long contactId) {
        svc.deleteContact(contactId); return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/stats")
    public Map<String, Long> getStats(@PathVariable Long id) {
        return svc.getStats(id);
    }
}
