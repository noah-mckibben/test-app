package com.nmckibben.testapp.repository;
import com.nmckibben.testapp.entity.CampaignContact;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface CampaignContactRepository extends JpaRepository<CampaignContact, Long> {
    List<CampaignContact> findByCampaignId(Long campaignId);
    List<CampaignContact> findByCampaignIdAndStatus(Long campaignId, String status);
    long countByCampaignIdAndStatus(Long campaignId, String status);
    long countByCampaignId(Long campaignId);
}
