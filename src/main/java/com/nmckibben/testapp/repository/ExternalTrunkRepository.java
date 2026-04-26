package com.nmckibben.testapp.repository;

import com.nmckibben.testapp.entity.ExternalTrunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExternalTrunkRepository extends JpaRepository<ExternalTrunk, Long> {
    List<ExternalTrunk> findByEnabled(boolean enabled);
    List<ExternalTrunk> findByTrunkType(String trunkType);
}
