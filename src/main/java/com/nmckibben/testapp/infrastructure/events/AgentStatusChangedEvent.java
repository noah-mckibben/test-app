package com.nmckibben.testapp.infrastructure.events;

/**
 * Published by the Agent domain (UserService) when an agent's presence changes.
 * Consumed by:
 *   - Routing domain  → invalidates cached online-agent lists
 *   - Campaign domain → may pause/resume dialing if no agents available
 *   - Analytics       → logs presence change for occupancy reporting
 */
public class AgentStatusChangedEvent extends DomainEvent {

    private final String username;
    private final String previousStatus;
    private final String newStatus;

    public AgentStatusChangedEvent(String correlationId,
                                   String username,
                                   String previousStatus,
                                   String newStatus) {
        super(correlationId);
        this.username       = username;
        this.previousStatus = previousStatus;
        this.newStatus      = newStatus;
    }

    public String getUsername()       { return username;       }
    public String getPreviousStatus() { return previousStatus; }
    public String getNewStatus()      { return newStatus;      }

    public boolean isGoingOnline()  { return "ONLINE".equals(newStatus);  }
    public boolean isGoingOffline() { return "OFFLINE".equals(newStatus); }
}
