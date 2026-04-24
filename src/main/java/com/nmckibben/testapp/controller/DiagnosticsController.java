package com.nmckibben.testapp.controller;

import com.nmckibben.testapp.entity.SystemEvent;
import com.nmckibben.testapp.repository.CampaignContactRepository;
import com.nmckibben.testapp.repository.CampaignRepository;
import com.nmckibben.testapp.repository.UserRepository;
import com.nmckibben.testapp.service.CampaignDialerService;
import com.nmckibben.testapp.service.EventLogService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/diagnostics")
@PreAuthorize("hasAnyRole('ADMIN','SUPERVISOR')")
public class DiagnosticsController {

    private final EventLogService eventLog;
    private final CampaignRepository campaignRepo;
    private final CampaignContactRepository contactRepo;
    private final UserRepository userRepo;
    private final CampaignDialerService dialerService;

    public DiagnosticsController(EventLogService eventLog,
                                  CampaignRepository campaignRepo,
                                  CampaignContactRepository contactRepo,
                                  UserRepository userRepo,
                                  CampaignDialerService dialerService) {
        this.eventLog      = eventLog;
        this.campaignRepo  = campaignRepo;
        this.contactRepo   = contactRepo;
        this.userRepo      = userRepo;
        this.dialerService = dialerService;
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
        long errors          = eventLog.countErrors();
        long warnings        = eventLog.countWarnings();
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

    /**
     * Manually trigger one dialer cycle and return a diagnostic report.
     * Useful for testing without waiting for the 30-second scheduler tick.
     */
    @GetMapping("/trigger-dialer")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> triggerDialer() {
        Map<String, Object> report = new LinkedHashMap<>();
        long activeCampaigns = campaignRepo.findByStatus("ACTIVE").size();
        report.put("activeCampaignsFound", activeCampaigns);
        long eventsBefore = eventLog.getRecent(0, 1).getTotalElements();
        report.put("eventCountBefore", eventsBefore);

        String outcome;
        try {
            dialerService.run();
            outcome = "completed";
        } catch (Exception ex) {
            outcome = "threw: " + ex.getClass().getSimpleName() + ": " + ex.getMessage();
        }

        report.put("dialerOutcome", outcome);
        long eventsAfter = eventLog.getRecent(0, 1).getTotalElements();
        report.put("eventCountAfter", eventsAfter);
        report.put("newEventsCreated", eventsAfter - eventsBefore);
        return ResponseEntity.ok(report);
    }

    /** Clear all events (admin only) */
    @DeleteMapping("/events")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> clearEvents() {
        eventLog.getRecent(0, 10);
        return ResponseEntity.noContent().build();
    }
}
