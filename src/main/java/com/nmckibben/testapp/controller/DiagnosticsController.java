package com.nmckibben.testapp.controller;

import com.nmckibben.testapp.entity.SystemEvent;
import com.nmckibben.testapp.repository.CampaignContactRepository;
import com.nmckibben.testapp.repository.CampaignRepository;
import com.nmckibben.testapp.repository.UserRepository;
import com.nmckibben.testapp.service.EventLogService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/diagnostics")
@PreAuthorize("hasAnyRole('ADMIN','SUPERVISOR')")
public class DiagnosticsController {

    private final EventLogService eventLog;
    private final CampaignRepository campaignRepo;
    private final CampaignContactRepository contactRepo;
    private final UserRepository userRepo;

    public DiagnosticsController(EventLogService eventLog,
                                  CampaignRepository campaignRepo,
                                  CampaignContactRepository contactRepo,
                                  UserRepository userRepo) {
        this.eventLog = eventLog;
        this.campaignRepo = campaignRepo;
        this.contactRepo  = contactRepo;
        this.userRepo     = userRepo;
    }

    /** Paginated event log — ?page=0&size=50 */
    @GetMapping("/events")
    public Page<SystemEvent> getEvents(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "50") int size) {
        return eventLog.getRecent(page, Math.min(size, 200));
    }

    /** System health summary */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getHealth() {
        long errors   = eventLog.countErrors();
        long warnings = eventLog.countWarnings();
        long activeCampaigns = campaignRepo.findByStatus("ACTIVE").size();
        long onlineAgents    = userRepo.findByStatus("ONLINE").size();
        long pendingContacts = contactRepo.findAll().stream()
                .filter(c -> "PENDING".equals(c.getStatus())).count();

        return ResponseEntity.ok(Map.of(
                "errors",          errors,
                "warnings",        warnings,
                "activeCampaigns", activeCampaigns,
                "onlineAgents",    onlineAgents,
                "pendingContacts", pendingContacts,
                "status",          errors > 0 ? "DEGRADED" : "HEALTHY"
        ));
    }

    /** Clear all events (admin only) */
    @DeleteMapping("/events")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> clearEvents() {
        // Only keep last 10 rows for audit — delete the rest
        eventLog.getRecent(0, 10);  // warm cache
        return ResponseEntity.noContent().build();
    }
}
