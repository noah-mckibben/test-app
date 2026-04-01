package com.nmckibben.testapp.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "call_records")
public class CallRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "caller_id", nullable = false)
    private User caller;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "callee_id", nullable = false)
    private User callee;

    @Column(nullable = false)
    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Long durationSeconds;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CallStatus status;

    @PrePersist
    protected void onCreate() {
        if (startTime == null) startTime = LocalDateTime.now();
        if (status == null) status = CallStatus.INITIATED;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getCaller() { return caller; }
    public void setCaller(User caller) { this.caller = caller; }
    public User getCallee() { return callee; }
    public void setCallee(User callee) { this.callee = callee; }
    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
    public Long getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(Long durationSeconds) { this.durationSeconds = durationSeconds; }
    public CallStatus getStatus() { return status; }
    public void setStatus(CallStatus status) { this.status = status; }
}
