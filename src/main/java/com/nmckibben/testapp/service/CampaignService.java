package com.nmckibben.testapp.service;

import com.nmckibben.testapp.entity.Campaign;
import com.nmckibben.testapp.entity.CampaignContact;
import com.nmckibben.testapp.repository.CampaignContactRepository;
import com.nmckibben.testapp.repository.CampaignRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Map;

@Service
public class CampaignService {

    private final CampaignRepository campaignRepo;
    private final CampaignContactRepository contactRepo;

    public CampaignService(CampaignRepository campaignRepo, CampaignContactRepository contactRepo) {
        this.campaignRepo = campaignRepo;
        this.contactRepo = contactRepo;
    }

    public List<Campaign> getAll() { return campaignRepo.findAll(); }
    public Campaign get(Long id) { return campaignRepo.findById(id).orElseThrow(); }
    public Campaign save(Campaign c) { return campaignRepo.save(c); }
    public void delete(Long id) { campaignRepo.deleteById(id); }

    public Campaign setStatus(Long id, String status) {
        Campaign c = get(id);
        c.setStatus(status.toUpperCase());
        return campaignRepo.save(c);
    }

    public List<CampaignContact> getContacts(Long campaignId) {
        return contactRepo.findByCampaignId(campaignId);
    }

    public CampaignContact saveContact(CampaignContact cc) { return contactRepo.save(cc); }
    public void deleteContact(Long id) { contactRepo.deleteById(id); }

    public Map<String, Long> getStats(Long campaignId) {
        long total   = contactRepo.countByCampaignId(campaignId);
        long pending = contactRepo.countByCampaignIdAndStatus(campaignId, "PENDING");
        long done    = contactRepo.countByCampaignIdAndStatus(campaignId, "COMPLETED");
        long failed  = contactRepo.countByCampaignIdAndStatus(campaignId, "FAILED");
        long dnc     = contactRepo.countByCampaignIdAndStatus(campaignId, "DNC");
        return Map.of("total", total, "pending", pending, "completed", done, "failed", failed, "dnc", dnc);
    }
}
