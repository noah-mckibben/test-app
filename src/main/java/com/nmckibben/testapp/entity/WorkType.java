package com.nmckibben.testapp.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * A queue / skill group that agents are staffed in.
 * Campaigns are routed to a WorkType so the right agents handle them.
 *
 * Numbering plan:
 *   dnis      — the E.164 Twilio number assigned to this queue (caller ID for
 *               outbound campaigns; DNIS for inbound routing).
 *   callFlow  — the IVR / call flow linked to this number.
 */
@Entity
@Table(name = "work_types")
public class WorkType {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    private String description;

    /** Default dialing mode for campaigns using this work type */
    @Column(nullable = false)
    private String defaultDialingMode = "PREVIEW";

    // ── Numbering plan ────────────────────────────────────────────────────────
    /**
     * The E.164 phone number (DNIS / TFN) assigned to this work type.
     * Used as the caller ID on outbound campaign calls and for routing
     * inbound calls to this queue's agents.
     * Example: +18005551234
     */
    private String dnis;

    /**
     * The call flow to execute when an inbound call arrives on {@code dnis}.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "call_flow_id")
    private CallFlow callFlow;
    // ─────────────────────────────────────────────────────────────────────────

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "agent_work_types",
               joinColumns = @JoinColumn(name = "work_type_id"),
               inverseJoinColumns = @JoinColumn(name = "user_id"))
    private Set<User> agents = new HashSet<>();

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String desc) { this.description = desc; }
    public String getDefaultDialingMode() { return defaultDialingMode; }
    public void setDefaultDialingMode(String m) { this.defaultDialingMode = m; }
    public String getDnis() { return dnis; }
    public void setDnis(String dnis) { this.dnis = dnis; }
    public CallFlow getCallFlow() { return callFlow; }
    public void setCallFlow(CallFlow cf) { this.callFlow = cf; }
    public Set<User> getAgents() { return agents; }
    public void setAgents(Set<User> agents) { this.agents = agents; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
