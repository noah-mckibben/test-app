package com.nmckibben.testapp.controller;

import com.nmckibben.testapp.entity.DataAction;
import com.nmckibben.testapp.entity.Integration;
import com.nmckibben.testapp.repository.IntegrationRepository;
import com.nmckibben.testapp.service.IntegrationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/integrations")
@PreAuthorize("hasRole('ADMIN')")
public class IntegrationController {

    private final IntegrationService svc;

    public IntegrationController(IntegrationService svc) { this.svc = svc; }

    @GetMapping
    public List<Integration> getAll() { return svc.getAllIntegrations(); }

    @GetMapping("/{id}")
    public Integration get(@PathVariable Long id) { return svc.getIntegration(id); }

    @PostMapping
    public Integration create(@RequestBody Integration i) { return svc.save(i); }

    @PutMapping("/{id}")
    public Integration update(@PathVariable Long id, @RequestBody Integration i) {
        i.setId(id); return svc.save(i);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        svc.delete(id); return ResponseEntity.noContent().build();
    }

    @GetMapping("/data-actions")
    public List<DataAction> getAllDataActions() { return svc.getAllDataActions(); }

    @GetMapping("/{id}/data-actions")
    public List<DataAction> getDataActions(@PathVariable Long id) { return svc.getDataActions(id); }

    @PostMapping("/{integrationId}/data-actions")
    public DataAction createDataAction(@PathVariable Long integrationId, @RequestBody DataAction da) {
        da.setIntegration(svc.getIntegration(integrationId));
        return svc.saveDataAction(da);
    }

    @PutMapping("/data-actions/{id}")
    public DataAction updateDataAction(@PathVariable Long id, @RequestBody DataAction da) {
        da.setId(id); return svc.saveDataAction(da);
    }

    @DeleteMapping("/data-actions/{id}")
    public ResponseEntity<Void> deleteDataAction(@PathVariable Long id) {
        svc.deleteDataAction(id); return ResponseEntity.noContent().build();
    }
}
