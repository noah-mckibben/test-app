package com.nmckibben.testapp.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * An inbound call flow configuration.
 * The entire node graph (nodes + edges) is stored as a JSON blob so the
 * React Flow canvas can save/load it without a rigid relational schema.
 */
@Entity
@Table(name = "call_flows")
public class CallFlow {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    /** E.164 phone number that triggers this flow, e.g. +15551234567 */
    private String triggerNumber;

    private String description;

    /** Full React Flow JSON: { nodes: [...], edges: [...] } */
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String flowJson;

    @Column(nullable = false)
    private boolean active = false;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); updatedAt = LocalDateTime.now(); }
    @PreUpdate  protected void onUpdate() { updatedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getTriggerNumber() { return triggerNumber; }
    public void setTriggerNumber(String n) { this.triggerNumber = n; }
    public String getDescription() { return description; }
    public void setDescription(String d) { this.description = d; }
    public String getFlowJson() { return flowJson; }
    public void setFlowJson(String j) { this.flowJson = j; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
