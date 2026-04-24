package com.nmckibben.testapp.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * A parameterised API call template tied to an Integration.
 * Used as steps inside call flows to fetch/post data at runtime.
 */
@Entity
@Table(name = "data_actions")
public class DataAction {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "integration_id", nullable = false)
    private Integration integration;

    @Column(nullable = false)
    private String name;

    /** GET | POST | PUT | PATCH | DELETE */
    @Column(nullable = false)
    private String method = "GET";

    /** Path appended to Integration.baseUrl, supports {variable} placeholders */
    @Column(nullable = false)
    private String path;

    /** JSON map of extra request headers */
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String headersJson;

    /** JSON body template; supports {{variable}} substitution */
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String bodyTemplate;

    /** JSON mapping: { "outputKey": "$.jsonPath" } */
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String responseMapping;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Integration getIntegration() { return integration; }
    public void setIntegration(Integration i) { this.integration = i; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }
    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }
    public String getHeadersJson() { return headersJson; }
    public void setHeadersJson(String h) { this.headersJson = h; }
    public String getBodyTemplate() { return bodyTemplate; }
    public void setBodyTemplate(String b) { this.bodyTemplate = b; }
    public String getResponseMapping() { return responseMapping; }
    public void setResponseMapping(String r) { this.responseMapping = r; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
