package com.nmckibben.testapp.controller;

import com.nmckibben.testapp.entity.CallFlow;
import com.nmckibben.testapp.service.CallFlowService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/call-flows")
@PreAuthorize("hasRole('ADMIN')")
public class CallFlowController {

    private final CallFlowService svc;

    public CallFlowController(CallFlowService svc) { this.svc = svc; }

    @GetMapping
    public List<CallFlow> getAll() { return svc.getAll(); }

    @GetMapping("/{id}")
    public CallFlow get(@PathVariable Long id) { return svc.get(id); }

    @PostMapping
    public CallFlow create(@RequestBody CallFlow cf) { return svc.save(cf); }

    @PutMapping("/{id}")
    public CallFlow update(@PathVariable Long id, @RequestBody CallFlow cf) {
        cf.setId(id); return svc.save(cf);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        svc.delete(id); return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/activate")
    public CallFlow activate(@PathVariable Long id) { return svc.activate(id); }

    @PostMapping("/{id}/deactivate")
    public CallFlow deactivate(@PathVariable Long id) { return svc.deactivate(id); }
}
