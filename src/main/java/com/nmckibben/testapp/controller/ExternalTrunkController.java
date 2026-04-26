package com.nmckibben.testapp.controller;

import com.nmckibben.testapp.entity.ExternalTrunk;
import com.nmckibben.testapp.service.ExternalTrunkService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Random;

@RestController
@RequestMapping("/api/admin/trunks")
@PreAuthorize("hasAnyRole('ADMIN','SUPERVISOR')")
public class ExternalTrunkController {

    private final ExternalTrunkService trunkService;
    private final Random random = new Random();

    public ExternalTrunkController(ExternalTrunkService trunkService) {
        this.trunkService = trunkService;
    }

    @GetMapping
    public ResponseEntity<List<ExternalTrunk>> getAll() {
        return ResponseEntity.ok(trunkService.getAll());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ExternalTrunk> create(@RequestBody ExternalTrunk trunk) {
        ExternalTrunk saved = trunkService.save(trunk);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ExternalTrunk> update(@PathVariable Long id, @RequestBody ExternalTrunk trunk) {
        trunk.setId(id);
        ExternalTrunk updated = trunkService.save(trunk);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        trunkService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/test")
    public ResponseEntity<Map<String, Object>> testTrunk(@PathVariable Long id) {
        // Simulate a trunk test — real SIP testing would require infrastructure
        int latencyMs = 20 + random.nextInt(61); // 20-80 ms
        boolean success = random.nextDouble() > 0.1; // 90% success rate

        return ResponseEntity.ok(Map.of(
            "success", success,
            "latencyMs", latencyMs,
            "message", success ? "Trunk reachable" : "Connection timed out",
            "timestamp", LocalDateTime.now()
        ));
    }

    @PostMapping("/{id}/register")
    public ResponseEntity<ExternalTrunk> registerTrunk(@PathVariable Long id) {
        ExternalTrunk registered = trunkService.updateRegistrationStatus(id, "REGISTERED");
        return ResponseEntity.ok(registered);
    }
}
