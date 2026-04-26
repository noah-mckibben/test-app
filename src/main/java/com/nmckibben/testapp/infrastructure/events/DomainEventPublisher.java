package com.nmckibben.testapp.infrastructure.events;

import com.nmckibben.testapp.infrastructure.correlation.CorrelationIdFilter;
import org.slf4j.MDC;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

/**
 * Thin facade over Spring's ApplicationEventPublisher.
 *
 * Why a facade instead of injecting ApplicationEventPublisher directly?
 *   1. Automatically stamps each event with the current request's correlationId
 *      from MDC — callers don't have to remember to do this.
 *   2. Single seam to swap to Kafka/EventBridge later: change this class, not
 *      every publisher site across the codebase.
 *   3. Makes the event bus dependency explicit and mockable in unit tests.
 *
 * Usage:
 *   eventBus.publish(CallRoutedEvent.builder(callSid, RouteType.CALL_FLOW)
 *       .from(from).to(to).flow(flowId, flowName).message("…").build());
 */
@Component
public class DomainEventPublisher {

    private final ApplicationEventPublisher publisher;

    public DomainEventPublisher(ApplicationEventPublisher publisher) {
        this.publisher = publisher;
    }

    public void publish(DomainEvent event) {
        publisher.publishEvent(event);
    }
}
