package com.nmckibben.testapp.controller;

import com.nmckibben.testapp.entity.Campaign;
import com.nmckibben.testapp.repository.CampaignRepository;
import com.nmckibben.testapp.service.CampaignDialerService;
import com.nmckibben.testapp.service.EventLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Public debug endpoint — no auth required.
 * Allows triggering the dialer manually and optionally fixing campaign mode.
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

    /**
     * GET /api/admin/diagnostics/trigger-dialer
     * Optional: ?setMode=POWER  — updates all ACTIVE campaigns to the given mode before triggering.
     */
    @GetMapping("/trigger-dialer")
    public ResponseEntity<Map<String, Object>> triggerDialer(
            @RequestParam(required = false) String setMode) {

        Map<String, Object> report = new LinkedHashMap<>();

        List<Campaign> active = campaignRepo.findByStatus("ACTIVE");
        report.put("activeCampaignsFound", active.size());

        // Show current mode of each campaign
        report.put("campaignModes", active.stream()
                .collect(Collectors.toMap(c -> c.getName(), c -> c.getDialingMode())));

        // Optionally fix the mode before triggering
        if (setMode != null && !setMode.isBlank()) {
            for (Campaign c : active) {
                c.setDialingMode(setMode.toUpperCase());
                campaignRepo.save(c);
            }
            report.put("modeUpdatedTo", setMode.toUpperCase());
        }

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
