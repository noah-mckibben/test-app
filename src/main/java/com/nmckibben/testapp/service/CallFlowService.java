package com.nmckibben.testapp.service;

import com.nmckibben.testapp.entity.CallFlow;
import com.nmckibben.testapp.repository.CallFlowRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CallFlowService {

    private final CallFlowRepository repo;

    public CallFlowService(CallFlowRepository repo) { this.repo = repo; }

    public List<CallFlow> getAll() { return repo.findAll(); }
    public CallFlow get(Long id) { return repo.findById(id).orElseThrow(); }
    public CallFlow save(CallFlow cf) { return repo.save(cf); }
    public void delete(Long id) { repo.deleteById(id); }

    public CallFlow activate(Long id) {
        CallFlow cf = get(id);
        cf.setActive(true);
        return repo.save(cf);
    }

    public CallFlow deactivate(Long id) {
        CallFlow cf = get(id);
        cf.setActive(false);
        return repo.save(cf);
    }
}
