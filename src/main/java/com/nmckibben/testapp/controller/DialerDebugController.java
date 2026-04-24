package com.nmckibben.testapp.controller;

import com.nmckibben.testapp.repository.CampaignRepository;
import com.nmckibben.testapp.service.CampaignDialerService;
import com.nmckibben.testapp.service.EventLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Temporary public endpoint to diagnose why the campaign dialer isn't firing.
 * No auth required so it can be hit directly in a browser.
 */
@RestController
@RequestMapping("/api/admin/diagnostics")
public class DialerDebugController {

    private final CampaignDialerService dialerService;
    private final CampaignRepository campaignRepo;
    private final EventLogService eventLog;

    public DialerDebugController(CampaignDialerService dialerService,
                                  CampaignRepository campaignRepo,
                                  EventLogService eventLog) {
        this.dialerService = dialerService;
        this.campaignRepo  = campaignRepo;
        this.eventLog      = eventLog;
    }

    @GetMapping("/trigger-dialer")
    public ResponseEntity<Map<String, Object>> triggerDialer() {
        Map<String, Object> report = new LinkedHashMap<>();
        report.put("activeCampaignsFound", campaignRepo.findByStatus("ACTIVE").size());
        long before = eventLog.getRecent(0, 1).getTotalElements();
        report.put("eventCountBefore", before);

        String outcome;
        try {
            dialerService.run();
            outcome = "completed_no_exception";
        } catch (Exception ex) {
            outcome = ex.getClass().getSimpleName() + ": " + ex.getMessage();
        }

        report.put("dialerOutcome", outcome);
        long after = eventLog.getRecent(0, 1).getTotalElements();
        report.put("eventCountAfter", after);
        report.put("newEventsCreated", after - before);
        return ResponseEntity.ok(report);
    }
}
