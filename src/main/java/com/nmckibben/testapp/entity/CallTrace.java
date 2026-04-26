package com.nmckibben.testapp.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "call_traces", indexes = {
    @Index(name = "idx_ct_sid",    columnList = "callSid"),
    @Index(name = "idx_ct_ts",     columnList = "timestamp DESC"),
    @Index(name = "idx_ct_flow",   columnList = "callFlowId"),
    @Index(name = "idx_ct_dir",    columnList = "direction")
})
public class CallTrace {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String callSid;
    private String direction;      // INBOUND | OUTBOUND
    private String fromNumber;
    private String toNumber;
    private Long   callFlowId;
    private String callFlowName;
    private Long   workTypeId;
    private String workTypeName;
    private String nodeId;
    private String nodeType;
    private String nodeLabel;
    // CALL_RECEIVED|CALL_ROUTED|FLOW_START|FLOW_NODE|FLOW_GATHER|FLOW_ERROR|CALL_ANSWERED|CALL_ENDED|TRUNK_DIAL
    @Column(nullable = false, length = 40)
    private String eventType;
    @Column(nullable = false, length = 10)
    private String status = "INFO"; // INFO | SUCCESS | FAILURE | WARNING
    @Column(nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String message;
    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String details; // JSON blob
    @Column(nullable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) timestamp = LocalDateTime.now();
    }

    // builder factory
    public static CallTrace of(String eventType, String status, String message) {
        CallTrace t = new CallTrace();
        t.eventType = eventType;
        t.status = status;
        t.message = message;
        t.timestamp = LocalDateTime.now();
        return t;
    }

    public CallTrace callSid(String s)        { this.callSid = s; return this; }
    public CallTrace direction(String s)      { this.direction = s; return this; }
    public CallTrace from(String s)           { this.fromNumber = s; return this; }
    public CallTrace to(String s)             { this.toNumber = s; return this; }
    public CallTrace flow(Long id, String n)  { this.callFlowId = id; this.callFlowName = n; return this; }
    public CallTrace workType(Long id, String n) { this.workTypeId = id; this.workTypeName = n; return this; }
    public CallTrace node(String id, String type, String label) { this.nodeId = id; this.nodeType = type; this.nodeLabel = label; return this; }
    public CallTrace details(String json)     { this.details = json; return this; }

    // getters
    public Long getId() { return id; }
    public String getCallSid() { return callSid; }
    public String getDirection() { return direction; }
    public String getFromNumber() { return fromNumber; }
    public String getToNumber() { return toNumber; }
    public Long getCallFlowId() { return callFlowId; }
    public String getCallFlowName() { return callFlowName; }
    public Long getWorkTypeId() { return workTypeId; }
    public String getWorkTypeName() { return workTypeName; }
    public String getNodeId() { return nodeId; }
    public String getNodeType() { return nodeType; }
    public String getNodeLabel() { return nodeLabel; }
    public String getEventType() { return eventType; }
    public String getStatus() { return status; }
    public String getMessage() { return message; }
    public String getDetails() { return details; }
    public LocalDateTime getTimestamp() { return timestamp; }
}
