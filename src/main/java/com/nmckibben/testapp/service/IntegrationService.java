package com.nmckibben.testapp.service;

import com.nmckibben.testapp.entity.DataAction;
import com.nmckibben.testapp.entity.Integration;
import com.nmckibben.testapp.repository.DataActionRepository;
import com.nmckibben.testapp.repository.IntegrationRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class IntegrationService {

    private final IntegrationRepository integrationRepo;
    private final DataActionRepository dataActionRepo;

    public IntegrationService(IntegrationRepository integrationRepo, DataActionRepository dataActionRepo) {
        this.integrationRepo = integrationRepo;
        this.dataActionRepo = dataActionRepo;
    }

    public List<Integration> getAllIntegrations() { return integrationRepo.findAll(); }
    public Integration getIntegration(Long id) { return integrationRepo.findById(id).orElseThrow(); }
    public Integration save(Integration i) { return integrationRepo.save(i); }
    public void delete(Long id) { integrationRepo.deleteById(id); }

    public List<DataAction> getDataActions(Long integrationId) {
        return dataActionRepo.findByIntegrationId(integrationId);
    }
    public List<DataAction> getAllDataActions() { return dataActionRepo.findAll(); }
    public DataAction saveDataAction(DataAction da) { return dataActionRepo.save(da); }
    public void deleteDataAction(Long id) { dataActionRepo.deleteById(id); }
}
