package com.nmckibben.testapp.service;

import com.nmckibben.testapp.entity.CallTrace;
import com.nmckibben.testapp.repository.CallTraceRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CallTraceService {

    private final CallTraceRepository repo;

    public CallTraceService(CallTraceRepository repo) {
        this.repo = repo;
    }

    public CallTrace log(CallTrace trace) {
        return repo.save(trace);
    }

    public Page<CallTrace> getAll(int page, int size) {
        return repo.findAllByOrderByTimestampDesc(PageRequest.of(page, size));
    }

    public Page<CallTrace> getByDirection(String direction, int page, int size) {
        return repo.findByDirectionOrderByTimestampDesc(direction, PageRequest.of(page, size));
    }

    public Page<CallTrace> getByFlowId(Long flowId, int page, int size) {
        return repo.findByCallFlowIdOrderByTimestampDesc(flowId, PageRequest.of(page, size));
    }

    public List<CallTrace> getByCallSid(String callSid) {
        return repo.findByCallSidOrderByTimestampAsc(callSid);
    }

    public long countErrors() {
        return repo.countByStatus("FAILURE");
    }

    public long countByDirection(String direction) {
        return repo.countByDirection(direction);
    }
}
