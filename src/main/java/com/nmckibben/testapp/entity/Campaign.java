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

    // Recycling
    private int maxRecycles = 0;
    private int currentRecycle = 0;
    private int recycleIntervalMinutes = 60;
    private boolean recycleOnNoAnswer = true;
    private boolean recycleOnBusy = true;
    private boolean recycleOnFailed = false;
    private boolean recycleOnVoicemail = false;
    private boolean resetAttemptsOnRecycle = true;
    private LocalDateTime lastRecycledAt;

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
    public int getMaxRecycles() { return maxRecycles; }
    public void setMaxRecycles(int v) { this.maxRecycles = v; }
    public int getCurrentRecycle() { return currentRecycle; }
    public void setCurrentRecycle(int v) { this.currentRecycle = v; }
    public int getRecycleIntervalMinutes() { return recycleIntervalMinutes; }
    public void setRecycleIntervalMinutes(int v) { this.recycleIntervalMinutes = v; }
    public boolean isRecycleOnNoAnswer() { return recycleOnNoAnswer; }
    public void setRecycleOnNoAnswer(boolean v) { this.recycleOnNoAnswer = v; }
    public boolean isRecycleOnBusy() { return recycleOnBusy; }
    public void setRecycleOnBusy(boolean v) { this.recycleOnBusy = v; }
    public boolean isRecycleOnFailed() { return recycleOnFailed; }
    public void setRecycleOnFailed(boolean v) { this.recycleOnFailed = v; }
    public boolean isRecycleOnVoicemail() { return recycleOnVoicemail; }
    public void setRecycleOnVoicemail(boolean v) { this.recycleOnVoicemail = v; }
    public boolean isResetAttemptsOnRecycle() { return resetAttemptsOnRecycle; }
    public void setResetAttemptsOnRecycle(boolean v) { this.resetAttemptsOnRecycle = v; }
    public LocalDateTime getLastRecycledAt() { return lastRecycledAt; }
    public void setLastRecycledAt(LocalDateTime t) { this.lastRecycledAt = t; }
}
