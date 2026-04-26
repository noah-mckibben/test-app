package com.nmckibben.testapp.infrastructure.events;

/**
 * Published by the Telephony domain (TwilioController) whenever a call has
 * been resolved to a route.  Consumed asynchronously by:
 *   - Analytics domain  → writes a CallTrace record
 *   - (future) Reporting service → increments real-time counters
 */
public class CallRoutedEvent extends DomainEvent {

    public enum RouteType {
        APP_TO_APP, CALL_FLOW, WORK_TYPE_FLOW, WORK_TYPE_QUEUE, OUTBOUND_PSTN, FALLBACK
    }

    private final String    callSid;
    private final String    from;
    private final String    to;
    private final RouteType routeType;
    private final Long      callFlowId;
    private final String    callFlowName;
    private final Long      workTypeId;
    private final String    workTypeName;
    private final String    message;

    private CallRoutedEvent(Builder b) {
        super(b.correlationId);
        this.callSid      = b.callSid;
        this.from         = b.from;
        this.to           = b.to;
        this.routeType    = b.routeType;
        this.callFlowId   = b.callFlowId;
        this.callFlowName = b.callFlowName;
        this.workTypeId   = b.workTypeId;
        this.workTypeName = b.workTypeName;
        this.message      = b.message;
    }

    public String    getCallSid()      { return callSid;      }
    public String    getFrom()         { return from;         }
    public String    getTo()           { return to;           }
    public RouteType getRouteType()    { return routeType;    }
    public Long      getCallFlowId()   { return callFlowId;   }
    public String    getCallFlowName() { return callFlowName; }
    public Long      getWorkTypeId()   { return workTypeId;   }
    public String    getWorkTypeName() { return workTypeName; }
    public String    getMessage()      { return message;      }

    public static Builder builder(String callSid, RouteType type) {
        return new Builder(callSid, type);
    }

    public static class Builder {
        private final String    callSid;
        private final RouteType routeType;
        private String correlationId;
        private String from, to, callFlowName, workTypeName, message;
        private Long   callFlowId, workTypeId;

        Builder(String callSid, RouteType routeType) {
            this.callSid   = callSid;
            this.routeType = routeType;
        }
        public Builder correlationId(String v) { this.correlationId = v; return this; }
        public Builder from(String v)          { this.from = v;          return this; }
        public Builder to(String v)            { this.to = v;            return this; }
        public Builder flow(Long id, String n) { this.callFlowId = id; this.callFlowName = n; return this; }
        public Builder workType(Long id, String n){ this.workTypeId = id; this.workTypeName = n; return this; }
        public Builder message(String v)       { this.message = v;       return this; }
        public CallRoutedEvent build()         { return new CallRoutedEvent(this); }
    }
}
