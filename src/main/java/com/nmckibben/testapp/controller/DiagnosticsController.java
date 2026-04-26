package com.nmckibben.testapp.controller;

import com.nmckibben.testapp.entity.CallTrace;
import com.nmckibben.testapp.entity.SystemEvent;
import com.nmckibben.testapp.repository.CampaignContactRepository;
import com.nmckibben.testapp.repository.CampaignRepository;
import com.nmckibben.testapp.repository.UserRepository;
import com.nmckibben.testapp.service.CallTraceService;
import com.nmckibben.testapp.service.EventLogService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/diagnostics")
@PreAuthorize("hasAnyRole('ADMIN','SUPERVISOR')")
public class DiagnosticsController {

    private final EventLogService eventLog;
    private final CallTraceService callTraceService;
    private final CampaignRepository campaignRepo;
    private final CampaignContactRepository contactRepo;
    private final UserRepository userRepo;

    public DiagnosticsController(EventLogService eventLog,
                                  CallTraceService callTraceService,
                                  CampaignRepository campaignRepo,
                                  CampaignContactRepository contactRepo,
                                  UserRepository userRepo) {
        this.eventLog           = eventLog;
        this.callTraceService   = callTraceService;
        this.campaignRepo       = campaignRepo;
        this.contactRepo        = contactRepo;
        this.userRepo           = userRepo;
    }

    @GetMapping("/events")
    public Page<SystemEvent> getEvents(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "50") int size) {
        return eventLog.getRecent(page, Math.min(size, 200));
    }

    @GetMapping("/traces")
    public ResponseEntity<Page<CallTrace>> getTraces(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String direction,
            @RequestParam(required = false) String status) {
        Page<CallTrace> result;

        if (direction != null && !direction.isEmpty()) {
            result = callTraceService.getByDirection(direction, page, Math.min(size, 200));
        } else if (status != null && !status.isEmpty()) {
            // Would need a repository method for filtering by status
            // For now, return all
            result = callTraceService.getAll(page, Math.min(size, 200));
        } else {
            result = callTraceService.getAll(page, Math.min(size, 200));
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/traces/{callSid}")
    public ResponseEntity<List<CallTrace>> getCallTrace(@PathVariable String callSid) {
        return ResponseEntity.ok(callTraceService.getByCallSid(callSid));
    }

    @GetMapping("/traces/flow/{flowId}")
    public ResponseEntity<Page<CallTrace>> getFlowTraces(
            @PathVariable Long flowId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(callTraceService.getByFlowId(flowId, page, Math.min(size, 200)));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getHealth() {
        long errors          = eventLog.countErrors();
        long warnings        = eventLog.countWarnings();
        long activeCampaigns = campaignRepo.findByStatus("ACTIVE").size();
        long onlineAgents    = userRepo.findByStatus("ONLINE").size();
        long pendingContacts = contactRepo.findAll().stream()
                .filter(c -> "PENDING".equals(c.getStatus())).count();
        long callTraceErrors = callTraceService.countErrors();
        long inboundCalls    = callTraceService.countByDirection("INBOUND");
        long outboundCalls   = callTraceService.countByDirection("OUTBOUND");

        return ResponseEntity.ok(Map.of(
                "errors",           errors,
                "warnings",         warnings,
                "activeCampaigns",  activeCampaigns,
                "onlineAgents",     onlineAgents,
                "pendingContacts",  pendingContacts,
                "callTraceErrors",  callTraceErrors,
                "inboundCalls",     inboundCalls,
                "outboundCalls",    outboundCalls,
                "status",           errors > 0 ? "DEGRADED" : "HEALTHY"
        ));
    }

    @DeleteMapping("/events")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> clearEvents() {
        return ResponseEntity.noContent().build();
    }
}
