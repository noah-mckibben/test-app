package com.nmckibben.testapp.repository;
import com.nmckibben.testapp.entity.Integration;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface IntegrationRepository extends JpaRepository<Integration, Long> {
    List<Integration> findByActiveTrue();
}
