package com.nmckibben.testapp.repository;

import com.nmckibben.testapp.entity.CallTrace;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CallTraceRepository extends JpaRepository<CallTrace, Long> {
    Page<CallTrace> findAllByOrderByTimestampDesc(Pageable p);
    Page<CallTrace> findByDirectionOrderByTimestampDesc(String direction, Pageable p);
    Page<CallTrace> findByCallFlowIdOrderByTimestampDesc(Long flowId, Pageable p);
    Page<CallTrace> findByCallSidOrderByTimestampAsc(String callSid, Pageable p);
    List<CallTrace> findByCallSidOrderByTimestampAsc(String callSid);
    Page<CallTrace> findByStatusOrderByTimestampDesc(String status, Pageable p);
    long countByStatus(String status);
    long countByDirection(String direction);
}
