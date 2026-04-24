package com.nmckibben.testapp.controller;

import com.nmckibben.testapp.entity.WorkType;
import com.nmckibben.testapp.service.WorkTypeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/work-types")
@PreAuthorize("hasAnyRole('ADMIN','SUPERVISOR')")
public class WorkTypeController {

    private final WorkTypeService svc;

    public WorkTypeController(WorkTypeService svc) { this.svc = svc; }

    @GetMapping
    public List<WorkType> getAll() { return svc.getAll(); }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public WorkType create(@RequestBody WorkType wt) { return svc.save(wt); }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public WorkType update(@PathVariable Long id, @RequestBody WorkType wt) {
        wt.setId(id); return svc.save(wt);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        svc.delete(id); return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/agents")
    @PreAuthorize("hasRole('ADMIN')")
    public WorkType setAgents(@PathVariable Long id, @RequestBody Map<String, List<Long>> body) {
        Set<Long> ids = body.get("userIds").stream().collect(Collectors.toSet());
        return svc.setAgents(id, ids);
    }
}
