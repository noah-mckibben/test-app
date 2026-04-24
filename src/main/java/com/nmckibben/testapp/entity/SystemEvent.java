package com.nmckibben.testapp.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Platform-wide event log. Records dialing attempts, call outcomes,
 * integration calls, errors, and other significant system events.
 */
@Entity
@Table(name = "system_events", indexes = {
    @Index(name = "idx_system_events_timestamp", columnList = "timestamp DESC"),
    @Index(name = "idx_system_events_type",      columnList = "type")
})
public class SystemEvent {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** CAMPAIGN_DIAL | CALL_CONNECTED | CALL_FAILED | CALL_COMPLETED |
     *  SYSTEM_ERROR | INTEGRATION_CALL | AGENT_STATUS | CAMPAIGN_STATUS */
    @Column(nullable = false, length = 40)
    private String type;

    /** INFO | WARN | ERROR */
    @Column(nullable = false, length = 10)
    private String severity = "INFO";

    /** Which component generated this event */
    @Column(length = 80)
    private String source;

    @Column(nullable = false)
    private String message;

    /** JSON blob for structured context (call SID, contact id, http status, etc.) */
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String details;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) timestamp = LocalDateTime.now();
    }

    // ── builder-style factory ──────────────────────────────────────────────

    public static SystemEvent of(String type, String severity, String source, String message) {
        SystemEvent e = new SystemEvent();
        e.type = type; e.severity = severity; e.source = source; e.message = message;
        e.timestamp = LocalDateTime.now();
        return e;
    }

    public SystemEvent details(String json) { this.details = json; return this; }

    // ── getters ────────────────────────────────────────────────────────────
    public Long getId() { return id; }
    public String getType() { return type; }
    public void setType(String t) { this.type = t; }
    public String getSeverity() { return severity; }
    public void setSeverity(String s) { this.severity = s; }
    public String getSource() { return source; }
    public void setSource(String s) { this.source = s; }
    public String getMessage() { return message; }
    public void setMessage(String m) { this.message = m; }
    public String getDetails() { return details; }
    public void setDetails(String d) { this.details = d; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime t) { this.timestamp = t; }
}
