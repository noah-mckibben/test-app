package com.nmckibben.testapp.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

/**
 * A queue / skill group that agents are staffed in.
 * Campaigns are routed to a WorkType so the right agents handle them.
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
    public Set<User> getAgents() { return agents; }
    public void setAgents(Set<User> agents) { this.agents = agents; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
