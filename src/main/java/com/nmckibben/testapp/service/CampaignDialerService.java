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
import java.util.List;

/**
 * Scheduled outbound dialing engine.
 *
 * <p>Every 30 seconds this service checks for ACTIVE campaigns and dials
 * the next eligible PENDING contact using the Twilio REST API.
 *
 * <p>Dialing modes:
 * <ul>
 *   <li><b>PREVIEW</b>  — no auto-dialing; agents dial manually from the campaign UI.</li>
 *   <li><b>POWER</b>    — one call placed per poll cycle per campaign.</li>
 *   <li><b>PREDICTIVE</b> — up to 3 calls placed per poll cycle per campaign.</li>
 *   <li><b>BLASTER</b>  — dials all PENDING contacts in the campaign at once.</li>
 * </ul>
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
        if ("PREVIEW".equals(mode)) return;  // agents dial manually

        List<CampaignContact> pending = contactRepo.findByCampaignIdAndStatus(campaign.getId(), "PENDING");
        if (pending.isEmpty()) {
            // Campaign exhausted — auto-complete it
            campaign.setStatus("COMPLETED");
            campaignRepo.save(campaign);
            eventLog.info("CAMPAIGN_STATUS", "CampaignDialer",
                    "Campaign completed (no pending contacts): " + campaign.getName());
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

    private void placeTwilioCall(Campaign campaign, CampaignContact contact) {
        // Mark in-progress immediately to avoid duplicate dials
        contact.setStatus("IN_PROGRESS");
        contact.setAttempts(contact.getAttempts() + 1);
        contact.setLastAttemptAt(LocalDateTime.now());
        contactRepo.save(contact);

        try {
            String twimlUrl = baseUrl + "/api/twilio/campaign/" + campaign.getId() + "/voice";

            Call call = Call.creator(
                    new PhoneNumber(contact.getPhoneNumber()),
                    new PhoneNumber(fromNumber),
                    new URI(twimlUrl)
            )
            .setStatusCallback(baseUrl + "/api/twilio/campaign/" + campaign.getId()
                    + "/status?contactId=" + contact.getId())
            .setStatusCallbackMethod(HttpMethod.POST)
            .create();

            SystemEvent e = SystemEvent.of("CAMPAIGN_DIAL", "INFO", "CampaignDialer",
                    "Dialing " + contact.getName() + " (" + contact.getPhoneNumber() + ") — campaign: " + campaign.getName());
            e.setDetails("{\"callSid\":\"" + call.getSid() + "\",\"contactId\":" + contact.getId()
                    + ",\"campaignId\":" + campaign.getId() + ",\"mode\":\"" + campaign.getDialingMode() + "\"}");
            eventLog.save(e);

        } catch (Exception ex) {
            // Revert to PENDING if Twilio rejected the call
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
                    "Campaign call " + callStatus + " — " + contact.getName()
                    + " [" + contact.getPhoneNumber() + "] campaign #" + campaignId);
        });
    }
}
