package com.nmckibben.testapp.repository;
import com.nmckibben.testapp.entity.DataAction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface DataActionRepository extends JpaRepository<DataAction, Long> {
    List<DataAction> findByIntegrationId(Long integrationId);
}
