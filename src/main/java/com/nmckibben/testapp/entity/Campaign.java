package com.nmckibben.testapp.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * An outbound campaign. Contacts are dialled according to the dialingMode
 * and routed to agents staffed in the linked WorkType.
 */
@Entity
@Table(name = "campaigns")
public class Campaign {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    /** PREVIEW | POWER | PREDICTIVE | BLASTER */
    @Column(nullable = false)
    private String dialingMode = "PREVIEW";

    /** DRAFT | ACTIVE | PAUSED | COMPLETED | ARCHIVED */
    @Column(nullable = false)
    private String status = "DRAFT";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_type_id")
    private WorkType workType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "call_flow_id")
    private CallFlow callFlow;

    private int maxAttempts = 3;

    /** Minutes to wait before retrying a contact */
    private int retryDelayMinutes = 60;

    private LocalDateTime scheduledStart;
    private LocalDateTime scheduledEnd;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String d) { this.description = d; }
    public String getDialingMode() { return dialingMode; }
    public void setDialingMode(String m) { this.dialingMode = m; }
    public String getStatus() { return status; }
    public void setStatus(String s) { this.status = s; }
    public WorkType getWorkType() { return workType; }
    public void setWorkType(WorkType wt) { this.workType = wt; }
    public CallFlow getCallFlow() { return callFlow; }
    public void setCallFlow(CallFlow cf) { this.callFlow = cf; }
    public int getMaxAttempts() { return maxAttempts; }
    public void setMaxAttempts(int m) { this.maxAttempts = m; }
    public int getRetryDelayMinutes() { return retryDelayMinutes; }
    public void setRetryDelayMinutes(int r) { this.retryDelayMinutes = r; }
    public LocalDateTime getScheduledStart() { return scheduledStart; }
    public void setScheduledStart(LocalDateTime t) { this.scheduledStart = t; }
    public LocalDateTime getScheduledEnd() { return scheduledEnd; }
    public void setScheduledEnd(LocalDateTime t) { this.scheduledEnd = t; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
