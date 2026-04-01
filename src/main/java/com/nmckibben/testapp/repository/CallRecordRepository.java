package com.nmckibben.testapp.repository;

import com.nmckibben.testapp.entity.CallRecord;
import com.nmckibben.testapp.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface CallRecordRepository extends JpaRepository<CallRecord, Long> {
    @Query("SELECT c FROM CallRecord c WHERE c.caller = :user OR c.callee = :user ORDER BY c.startTime DESC")
    List<CallRecord> findByUser(@Param("user") User user);
}
