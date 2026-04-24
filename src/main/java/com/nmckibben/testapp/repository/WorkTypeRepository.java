package com.nmckibben.testapp.repository;
import com.nmckibben.testapp.entity.WorkType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface WorkTypeRepository extends JpaRepository<WorkType, Long> {
    /** Look up a work type by its assigned DNIS / TFN for inbound call routing. */
    Optional<WorkType> findByDnis(String dnis);
}
