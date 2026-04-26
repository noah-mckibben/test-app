package com.nmckibben.testapp.service;

import com.nmckibben.testapp.entity.ExternalTrunk;
import com.nmckibben.testapp.repository.ExternalTrunkRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ExternalTrunkService {

    private final ExternalTrunkRepository repo;

    public ExternalTrunkService(ExternalTrunkRepository repo) {
        this.repo = repo;
    }

    public List<ExternalTrunk> getAll() {
        return repo.findAll();
    }

    public Optional<ExternalTrunk> get(Long id) {
        return repo.findById(id);
    }

    public ExternalTrunk save(ExternalTrunk trunk) {
        return repo.save(trunk);
    }

    public void delete(Long id) {
        repo.deleteById(id);
    }

    public ExternalTrunk updateRegistrationStatus(Long id, String status) {
        Optional<ExternalTrunk> opt = repo.findById(id);
        if (opt.isPresent()) {
            ExternalTrunk trunk = opt.get();
            trunk.setRegistrationStatus(status);
            if ("REGISTERED".equals(status)) {
                trunk.setLastRegistrationAt(LocalDateTime.now());
            }
            return repo.save(trunk);
        }
        return null;
    }
}
