package com.nmckibben.testapp.repository;
import com.nmckibben.testapp.entity.CampaignContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
public interface CampaignContactRepository extends JpaRepository<CampaignContact, Long> {
    List<CampaignContact> findByCampaignId(Long campaignId);
    List<CampaignContact> findByCampaignIdAndStatus(Long campaignId, String status);
    long countByCampaignIdAndStatus(Long campaignId, String status);
    long countByCampaignId(Long campaignId);

    @Query("SELECT c FROM CampaignContact c WHERE c.campaign.id = :campaignId " +
           "AND c.status IN ('FAILED','COMPLETED') " +
           "AND c.lastCallStatus IN :callStatuses")
    List<CampaignContact> findRecyclable(@Param("campaignId") Long campaignId,
                                         @Param("callStatuses") List<String> callStatuses);
}
