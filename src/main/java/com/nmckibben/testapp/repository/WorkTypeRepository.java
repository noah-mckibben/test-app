package com.nmckibben.testapp.repository;
import com.nmckibben.testapp.entity.WorkType;
import org.springframework.data.jpa.repository.JpaRepository;
public interface WorkTypeRepository extends JpaRepository<WorkType, Long> {}
