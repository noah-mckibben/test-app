package com.nmckibben.testapp.websocket;

/**
 * Envelope for all WebRTC signaling messages relayed over the WebSocket connection.
 *
 * <p>Clients send messages with {@code type} and {@code to} set; the server fills in
 * {@code from} based on the authenticated user before forwarding to the recipient.
 *
 * <p>Supported message types:
 * <ul>
 *   <li>{@code call-request}  – notify callee of an incoming call</li>
 *   <li>{@code call-accept}   – callee accepts; caller proceeds to send an offer</li>
 *   <li>{@code call-reject}   – callee declines the call</li>
 *   <li>{@code offer}         – WebRTC SDP offer (caller → callee)</li>
 *   <li>{@code answer}        – WebRTC SDP answer (callee → caller)</li>
 *   <li>{@code ice-candidate} – trickle ICE candidate exchange</li>
 *   <li>{@code hang-up}       – either party ends the call</li>
 * </ul>
 */
public class SignalingMessage {
    /** One of the message types listed above. */
    private String type;
    /** Database ID of the intended recipient user. */
    private Long to;
    /** Database ID of the sender. Set by the server; clients do not supply this. */
    private Long from;
    /** Type-specific data: SDP object for offer/answer, ICE candidate object, or null. */
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
