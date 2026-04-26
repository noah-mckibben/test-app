package com.nmckibben.testapp.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "external_trunks")
public class ExternalTrunk {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(nullable = false)
    private String trunkType; // SIP | BYOC | PSTN

    private String terminationUri;
    private String originationUri;
    private String username;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String encryptedPassword;

    @Column(nullable = false)
    private String transport = "UDP"; // UDP | TCP | TLS | SRTP

    @Column(nullable = false)
    private int signalingPort = 5060;

    @Column(nullable = false)
    private String codecPreferences = "OPUS,PCMU,PCMA,G722";

    @Column(nullable = false)
    private String dtmfMode = "RFC2833"; // RFC2833 | INBAND | SIP_INFO

    @Column(nullable = false)
    private boolean mediaEncryption = false;

    private String outboundCallerIdName;
    private String outboundCallerIdNumber;

    @Column(nullable = false)
    private int maxConcurrentCalls = 100;

    @Column(nullable = false)
    private int maxCallsPerSecond = 10;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String sipServers; // JSON array

    @Column(nullable = false)
    private boolean requireAuthentication = false;

    private String authRealm;

    @Column(nullable = false)
    private boolean inboundEnabled = true;

    @Column(nullable = false)
    private boolean outboundEnabled = true;

    private String inboundAclIps; // comma-separated CIDR

    @Column(nullable = false)
    private boolean natHandling = true;

    private String stunServer;

    @Column(nullable = false)
    private boolean emergencyEnabled = false;

    private String emergencyCallerIdNumber;

    @Column(nullable = false)
    private boolean registrationEnabled = false;

    @Column(nullable = false)
    private int registrationTtl = 3600;

    @Column(nullable = false)
    private String registrationStatus = "UNREGISTERED"; // UNREGISTERED | REGISTERED | FAILED

    private LocalDateTime lastRegistrationAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public String getTrunkType() { return trunkType; }
    public void setTrunkType(String trunkType) { this.trunkType = trunkType; }

    public String getTerminationUri() { return terminationUri; }
    public void setTerminationUri(String terminationUri) { this.terminationUri = terminationUri; }

    public String getOriginationUri() { return originationUri; }
    public void setOriginationUri(String originationUri) { this.originationUri = originationUri; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEncryptedPassword() { return encryptedPassword; }
    public void setEncryptedPassword(String encryptedPassword) { this.encryptedPassword = encryptedPassword; }

    public String getTransport() { return transport; }
    public void setTransport(String transport) { this.transport = transport; }

    public int getSignalingPort() { return signalingPort; }
    public void setSignalingPort(int signalingPort) { this.signalingPort = signalingPort; }

    public String getCodecPreferences() { return codecPreferences; }
    public void setCodecPreferences(String codecPreferences) { this.codecPreferences = codecPreferences; }

    public String getDtmfMode() { return dtmfMode; }
    public void setDtmfMode(String dtmfMode) { this.dtmfMode = dtmfMode; }

    public boolean isMediaEncryption() { return mediaEncryption; }
    public void setMediaEncryption(boolean mediaEncryption) { this.mediaEncryption = mediaEncryption; }

    public String getOutboundCallerIdName() { return outboundCallerIdName; }
    public void setOutboundCallerIdName(String outboundCallerIdName) { this.outboundCallerIdName = outboundCallerIdName; }

    public String getOutboundCallerIdNumber() { return outboundCallerIdNumber; }
    public void setOutboundCallerIdNumber(String outboundCallerIdNumber) { this.outboundCallerIdNumber = outboundCallerIdNumber; }

    public int getMaxConcurrentCalls() { return maxConcurrentCalls; }
    public void setMaxConcurrentCalls(int maxConcurrentCalls) { this.maxConcurrentCalls = maxConcurrentCalls; }

    public int getMaxCallsPerSecond() { return maxCallsPerSecond; }
    public void setMaxCallsPerSecond(int maxCallsPerSecond) { this.maxCallsPerSecond = maxCallsPerSecond; }

    public String getSipServers() { return sipServers; }
    public void setSipServers(String sipServers) { this.sipServers = sipServers; }

    public boolean isRequireAuthentication() { return requireAuthentication; }
    public void setRequireAuthentication(boolean requireAuthentication) { this.requireAuthentication = requireAuthentication; }

    public String getAuthRealm() { return authRealm; }
    public void setAuthRealm(String authRealm) { this.authRealm = authRealm; }

    public boolean isInboundEnabled() { return inboundEnabled; }
    public void setInboundEnabled(boolean inboundEnabled) { this.inboundEnabled = inboundEnabled; }

    public boolean isOutboundEnabled() { return outboundEnabled; }
    public void setOutboundEnabled(boolean outboundEnabled) { this.outboundEnabled = outboundEnabled; }

    public String getInboundAclIps() { return inboundAclIps; }
    public void setInboundAclIps(String inboundAclIps) { this.inboundAclIps = inboundAclIps; }

    public boolean isNatHandling() { return natHandling; }
    public void setNatHandling(boolean natHandling) { this.natHandling = natHandling; }

    public String getStunServer() { return stunServer; }
    public void setStunServer(String stunServer) { this.stunServer = stunServer; }

    public boolean isEmergencyEnabled() { return emergencyEnabled; }
    public void setEmergencyEnabled(boolean emergencyEnabled) { this.emergencyEnabled = emergencyEnabled; }

    public String getEmergencyCallerIdNumber() { return emergencyCallerIdNumber; }
    public void setEmergencyCallerIdNumber(String emergencyCallerIdNumber) { this.emergencyCallerIdNumber = emergencyCallerIdNumber; }

    public boolean isRegistrationEnabled() { return registrationEnabled; }
    public void setRegistrationEnabled(boolean registrationEnabled) { this.registrationEnabled = registrationEnabled; }

    public int getRegistrationTtl() { return registrationTtl; }
    public void setRegistrationTtl(int registrationTtl) { this.registrationTtl = registrationTtl; }

    public String getRegistrationStatus() { return registrationStatus; }
    public void setRegistrationStatus(String registrationStatus) { this.registrationStatus = registrationStatus; }

    public LocalDateTime getLastRegistrationAt() { return lastRegistrationAt; }
    public void setLastRegistrationAt(LocalDateTime lastRegistrationAt) { this.lastRegistrationAt = lastRegistrationAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
