package com.nmckibben.testapp.service;

import com.nmckibben.testapp.entity.SystemEvent;
import com.nmckibben.testapp.repository.SystemEventRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
public class EventLogService {

    private final SystemEventRepository repo;

    public EventLogService(SystemEventRepository repo) { this.repo = repo; }

    public SystemEvent info(String type, String source, String message) {
        return repo.save(SystemEvent.of(type, "INFO", source, message));
    }

    public SystemEvent warn(String type, String source, String message) {
        return repo.save(SystemEvent.of(type, "WARN", source, message));
    }

    public SystemEvent error(String type, String source, String message, String details) {
        return repo.save(SystemEvent.of(type, "ERROR", source, message).details(details));
    }

    public SystemEvent save(SystemEvent e) { return repo.save(e); }

    public Page<SystemEvent> getRecent(int page, int size) {
        return repo.findAllByOrderByTimestampDesc(PageRequest.of(page, size));
    }

    public long countErrors() { return repo.countBySeverity("ERROR"); }
    public long countWarnings() { return repo.countBySeverity("WARN"); }
}
