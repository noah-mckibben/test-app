package com.nmckibben.testapp.websocket;

public class SignalingMessage {
    // Types: call-request, call-accept, call-reject, offer, answer, ice-candidate, hang-up
    private String type;
    private Long to;
    private Long from;
    private Object payload;

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Long getTo() { return to; }
    public void setTo(Long to) { this.to = to; }
    public Long getFrom() { return from; }
    public void setFrom(Long from) { this.from = from; }
    public Object getPayload() { return payload; }
    public void setPayload(Object payload) { this.payload = payload; }
}
