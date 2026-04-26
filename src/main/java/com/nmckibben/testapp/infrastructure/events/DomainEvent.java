package com.nmckibben.testapp.infrastructure.events;

import java.time.Instant;

/**
 * Base class for all internal domain events.
 *
 * Using Spring's ApplicationEventPublisher as the bus keeps everything
 * in-process for now (zero infrastructure, zero latency) while establishing
 * the publish/subscribe contract that maps 1-to-1 onto a Kafka topic if we
 * ever need to extract a service boundary.
 *
 * Each event carries a correlationId so the full call chain remains traceable
 * across async listeners.
 */
public abstract class DomainEvent {

    private final Instant occurredAt;
    private final String  correlationId;

    protected DomainEvent(String correlationId) {
        this.occurredAt    = Instant.now();
        this.correlationId = correlationId;
    }

    public Instant getOccurredAt()    { return occurredAt;    }
    public String  getCorrelationId() { return correlationId; }
}
