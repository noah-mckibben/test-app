package com.nmckibben.testapp.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/** An individual contact record within an outbound campaign. */
@Entity
@Table(name = "campaign_contacts")
public class CampaignContact {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id", nullable = false)
    private Campaign campaign;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String phoneNumber;

    /** PENDING | IN_PROGRESS | COMPLETED | FAILED | DNC */
    @Column(nullable = false)
    private String status = "PENDING";

    private int attempts = 0;
    private LocalDateTime lastAttemptAt;

    /** Last Twilio call status: completed | busy | no-answer | canceled | failed | voicemail */
    private String lastCallStatus;

    private String disposition;
    private String notes;

    /** Arbitrary JSON for custom fields (e.g. account ID, product interest) */
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String customData;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Campaign getCampaign() { return campaign; }
    public void setCampaign(Campaign c) { this.campaign = c; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String p) { this.phoneNumber = p; }
    public String getStatus() { return status; }
    public void setStatus(String s) { this.status = s; }
    public int getAttempts() { return attempts; }
    public void setAttempts(int a) { this.attempts = a; }
    public LocalDateTime getLastAttemptAt() { return lastAttemptAt; }
    public void setLastAttemptAt(LocalDateTime t) { this.lastAttemptAt = t; }
    public String getLastCallStatus() { return lastCallStatus; }
    public void setLastCallStatus(String s) { this.lastCallStatus = s; }
    public String getDisposition() { return disposition; }
    public void setDisposition(String d) { this.disposition = d; }
    public String getNotes() { return notes; }
    public void setNotes(String n) { this.notes = n; }
    public String getCustomData() { return customData; }
    public void setCustomData(String j) { this.customData = j; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
