package com.nmckibben.testapp.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Represents a third-party system connection (REST API, Salesforce, Webhook).
 * Auth configuration is stored as a JSON string in authConfig.
 */
@Entity
@Table(name = "integrations")
public class Integration {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    /** REST_API | SALESFORCE | WEBHOOK */
    @Column(nullable = false)
    private String type;

    private String baseUrl;

    /** NONE | API_KEY | BEARER | BASIC | OAUTH2 */
    @Column(nullable = false)
    private String authType = "NONE";

    /** JSON blob: keys depend on authType (apiKey, token, username/password, clientId/secret) */
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String authConfig;

    private String description;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
    public String getAuthType() { return authType; }
    public void setAuthType(String authType) { this.authType = authType; }
    public String getAuthConfig() { return authConfig; }
    public void setAuthConfig(String authConfig) { this.authConfig = authConfig; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
