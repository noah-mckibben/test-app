package com.nmckibben.testapp.repository;

import com.nmckibben.testapp.entity.SystemEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SystemEventRepository extends JpaRepository<SystemEvent, Long> {
    Page<SystemEvent> findAllByOrderByTimestampDesc(Pageable pageable);
    List<SystemEvent> findByTypeOrderByTimestampDesc(String type);
    List<SystemEvent> findBySeverityOrderByTimestampDesc(String severity);
    long countBySeverity(String severity);
}
