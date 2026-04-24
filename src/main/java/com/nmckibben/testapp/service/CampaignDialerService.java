package com.nmckibben.testapp.service;

import com.nmckibben.testapp.entity.Campaign;
import com.nmckibben.testapp.entity.CampaignContact;
import com.nmckibben.testapp.entity.SystemEvent;
import com.nmckibben.testapp.repository.CampaignContactRepository;
import com.nmckibben.testapp.repository.CampaignRepository;
import com.twilio.http.HttpMethod;
import com.twilio.rest.api.v2010.account.Call;
import com.twilio.type.PhoneNumber;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Scheduled outbound dialing engine.
 *
 * Every 30 seconds this service checks for ACTIVE campaigns and dials
 * the next eligible PENDING contact using the Twilio REST API.
 *
 * Dialing modes:
 *   PREVIEW    - no auto-dialing; agents dial manually from the campaign UI.
 *   POWER      - one call placed per poll cycle per campaign.
 *   PREDICTIVE - up to 3 calls placed per poll cycle per campaign.
 *   BLASTER    - dials all PENDING contacts in the campaign at once.
 *
 * Caller ID:
 *   If the campaign has a WorkType with a DNIS configured, that number is used
 *   as the outbound caller ID and the call is routed to that queue's agents.
 *   Otherwise the default Twilio number is used.
 */
@Service
public class CampaignDialerService {

    private final CampaignRepository campaignRepo;
    private final CampaignContactRepository contactRepo;
    private final EventLogService eventLog;

    @Value("${twilio.phone-number}")
    private String fromNumber;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    public CampaignDialerService(CampaignRepository campaignRepo,
                                  CampaignContactRepository contactRepo,
                                  EventLogService eventLog) {
        this.campaignRepo = campaignRepo;
        this.contactRepo  = contactRepo;
        this.eventLog     = eventLog;
    }

    @Scheduled(fixedDelay = 30_000)
    public void run() {
        List<Campaign> active = campaignRepo.findByStatus("ACTIVE");
        for (Campaign campaign : active) {
            try {
                dial(campaign);
            } catch (Exception ex) {
                eventLog.error("CAMPAIGN_DIAL", "CampaignDialer",
                        "Unhandled error in dialer for campaign: " + campaign.getName(),
                        ex.getMessage());
            }
        }
    }

    private void dial(Campaign campaign) {
        String mode = campaign.getDialingMode();
        if ("PREVIEW".equals(mode)) return;

        List<CampaignContact> pending = contactRepo.findByCampaignIdAndStatus(campaign.getId(), "PENDING");
        long inProgress = contactRepo.countByCampaignIdAndStatus(campaign.getId(), "IN_PROGRESS");

        if (pending.isEmpty()) {
            if (inProgress > 0) {
                return; // wait for in-flight calls
            }
            if (tryRecycle(campaign)) return;

            long total     = contactRepo.countByCampaignId(campaign.getId());
            long completed = contactRepo.countByCampaignIdAndStatus(campaign.getId(), "COMPLETED");
            long failed    = contactRepo.countByCampaignIdAndStatus(campaign.getId(), "FAILED");
            if (total > 0 && (completed + failed) == total) {
                campaign.setStatus("COMPLETED");
                campaignRepo.save(campaign);
                eventLog.info("CAMPAIGN_STATUS", "CampaignDialer",
                        "Campaign completed - " + completed + " completed, " + failed + " failed: " + campaign.getName());
            }
            return;
        }

        int limit = switch (mode) {
            case "POWER"      -> 1;
            case "PREDICTIVE" -> 3;
            case "BLASTER"    -> pending.size();
            default           -> 1;
        };

        List<CampaignContact> batch = pending.subList(0, Math.min(limit, pending.size()));
        for (CampaignContact contact : batch) {
            placeTwilioCall(campaign, contact);
        }
    }

    /**
     * Attempt to recycle the campaign: if recycling is configured and we have not
     * hit the maximum number of passes yet, reset eligible contacts back to PENDING
     * and increment the recycle counter.
     *
     * @return true if a recycle was performed (caller should skip auto-complete logic)
     */
    private boolean tryRecycle(Campaign campaign) {
        if (campaign.getMaxRecycles() <= 0) return false;
        if (campaign.getCurrentRecycle() >= campaign.getMaxRecycles()) return false;

        LocalDateTime lastRecycled = campaign.getLastRecycledAt();
        if (lastRecycled != null) {
            LocalDateTime earliest = lastRecycled.plusMinutes(campaign.getRecycleIntervalMinutes());
            if (LocalDateTime.now().isBefore(earliest)) return false;
        }

        List<String> recyclableStatuses = new ArrayList<>();
        if (campaign.isRecycleOnNoAnswer())  recyclableStatuses.add("no-answer");
        if (campaign.isRecycleOnBusy())      recyclableStatuses.add("busy");
        if (campaign.isRecycleOnFailed())    recyclableStatuses.add("failed");
        if (campaign.isRecycleOnVoicemail()) recyclableStatuses.add("voicemail");

        if (recyclableStatuses.isEmpty()) return false;

        List<CampaignContact> recyclable = contactRepo.findRecyclable(campaign.getId(), recyclableStatuses);
        if (recyclable.isEmpty()) return false;

        int recyclePass = campaign.getCurrentRecycle() + 1;
        for (CampaignContact c : recyclable) {
            c.setStatus("PENDING");
            c.setLastCallStatus(null);
            if (campaign.isResetAttemptsOnRecycle()) c.setAttempts(0);
            contactRepo.save(c);
        }

        campaign.setCurrentRecycle(recyclePass);
        campaign.setLastRecycledAt(LocalDateTime.now());
        campaignRepo.save(campaign);

        eventLog.info("CAMPAIGN_RECYCLE", "CampaignDialer",
                "Recycle pass " + recyclePass + " of " + campaign.getMaxRecycles()
                + " started - " + recyclable.size() + " contacts reset: " + campaign.getName());
        return true;
    }

    private void placeTwilioCall(Campaign campaign, CampaignContact contact) {
        contact.setStatus("IN_PROGRESS");
        contact.setAttempts(contact.getAttempts() + 1);
        contact.setLastAttemptAt(LocalDateTime.now());
        contactRepo.save(contact);

        try {
            // Use WorkType DNIS as caller ID and route to that queue if available
            com.nmckibben.testapp.entity.WorkType workType = campaign.getWorkType();
            String callerIdNumber = (workType != null
                    && workType.getDnis() != null
                    && !workType.getDnis().isBlank())
                    ? workType.getDnis()
                    : fromNumber;

            String twimlUrl = (workType != null)
                    ? baseUrl + "/api/twilio/worktype/" + workType.getId() + "/voice"
                    : baseUrl + "/api/twilio/campaign/" + campaign.getId() + "/voice";

            Call call = Call.creator(
                    new PhoneNumber(contact.getPhoneNumber()),
                    new PhoneNumber(callerIdNumber),
                    new URI(twimlUrl)
            )
            .setStatusCallback(baseUrl + "/api/twilio/campaign/" + campaign.getId()
                    + "/status?contactId=" + contact.getId())
            .setStatusCallbackMethod(HttpMethod.POST)
            .create();

            SystemEvent e = SystemEvent.of("CAMPAIGN_DIAL", "INFO", "CampaignDialer",
                    "Dialing " + contact.getName() + " (" + contact.getPhoneNumber() + ") - campaign: " + campaign.getName());
            e.setDetails("{\"callSid\":\"" + call.getSid() + "\",\"contactId\":" + contact.getId()
                    + ",\"campaignId\":" + campaign.getId() + ",\"mode\":\"" + campaign.getDialingMode()
                    + "\",\"callerId\":\"" + callerIdNumber + "\"}");
            eventLog.save(e);

        } catch (Exception ex) {
            contact.setStatus(contact.getAttempts() >= campaign.getMaxAttempts() ? "FAILED" : "PENDING");
            contactRepo.save(contact);

            eventLog.error("CAMPAIGN_DIAL", "CampaignDialer",
                    "Twilio call failed for " + contact.getName() + " (" + contact.getPhoneNumber() + "): " + ex.getMessage(),
                    "{\"contactId\":" + contact.getId() + ",\"campaignId\":" + campaign.getId()
                    + ",\"error\":\"" + ex.getMessage().replace("\"","'") + "\"}");
        }
    }

    /** Called by TwilioController when a campaign call status changes. */
    public void handleCallStatus(Long campaignId, Long contactId, String callStatus, String callSid) {
        contactRepo.findById(contactId).ifPresent(contact -> {
            contact.setLastCallStatus(callStatus);

            String newStatus = switch (callStatus) {
                case "completed"  -> "COMPLETED";
                case "busy", "no-answer", "canceled" -> {
                    Campaign c = contact.getCampaign();
                    yield contact.getAttempts() >= c.getMaxAttempts() ? "FAILED" : "PENDING";
                }
                case "failed"     -> "FAILED";
                default           -> contact.getStatus();
            };
            contact.setStatus(newStatus);
            contactRepo.save(contact);

            eventLog.info("CALL_COMPLETED", "TwilioWebhook",
                    "Campaign call " + callStatus + " - " + contact.getName()
                    + " [" + contact.getPhoneNumber() + "] campaign #" + campaignId);
        });
    }
}
