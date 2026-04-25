package com.nmckibben.testapp.service;

import com.nmckibben.testapp.entity.User;
import com.nmckibben.testapp.entity.WorkType;
import com.nmckibben.testapp.repository.UserRepository;
import com.nmckibben.testapp.repository.WorkTypeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Set;

@Service
public class WorkTypeService {

    private final WorkTypeRepository workTypeRepo;
    private final UserRepository userRepo;

    public WorkTypeService(WorkTypeRepository workTypeRepo, UserRepository userRepo) {
        this.workTypeRepo = workTypeRepo;
        this.userRepo = userRepo;
    }

    public List<WorkType> getAll() { return workTypeRepo.findAll(); }
    public WorkType get(Long id) { return workTypeRepo.findById(id).orElseThrow(); }
    public WorkType save(WorkType wt) { return workTypeRepo.save(wt); }
    public void delete(Long id) { workTypeRepo.deleteById(id); }

    @Transactional
    public WorkType setAgents(Long workTypeId, Set<Long> userIds) {
        WorkType wt = workTypeRepo.findById(workTypeId).orElseThrow();
        // Clear the managed collection so Hibernate issues DELETE before INSERT
        wt.getAgents().clear();
        workTypeRepo.saveAndFlush(wt);
        Set<User> newAgents = new java.util.HashSet<>(userRepo.findAllById(userIds));
        wt.getAgents().addAll(newAgents);
        return workTypeRepo.save(wt);
    }
}
