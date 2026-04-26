package com.nmckibben.testapp.service;

import com.nmckibben.testapp.entity.CallFlow;
import com.nmckibben.testapp.entity.User;
import com.nmckibben.testapp.entity.WorkType;
import com.nmckibben.testapp.infrastructure.events.CallRoutedEvent.RouteType;
import com.nmckibben.testapp.repository.CallFlowRepository;
import com.nmckibben.testapp.repository.WorkTypeRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Owns the call-routing decision for the Telephony domain.
 *
 * TwilioController used to directly inject CallFlowRepository and
 * WorkTypeRepository, making it responsible for routing logic.  Extracting
 * that logic here enforces a clean boundary:
 *
 *   Telephony (TwilioController)
 *     → asks RoutingService "where does this call go?"
 *     → receives a RouteDecision value object
 *     → builds TwiML based on the decision
 *     → publishes a CallRoutedEvent (analytics handles the write)
 *
 * When routing is eventually extracted into its own microservice, this class
 * becomes the client stub — you change the implementation (HTTP call) not the
 * interface (RouteDecision).
 *
 * Routing priority (mirrors the original TwilioController logic):
 *   1. client:xyz          → APP_TO_APP
 *   2. Active CallFlow on trigger number → CALL_FLOW
 *   3. WorkType DNIS with active CallFlow → WORK_TYPE_FLOW
 *   4. WorkType DNIS (no flow)           → WORK_TYPE_QUEUE
 *   5. Not our own number                → OUTBOUND_PSTN
 *   6. Fallback                          → FALLBACK (simulring all online agents)
 */
@Service
public class RoutingService {

    private final CallFlowRepository callFlowRepo;
    private final WorkTypeRepository workTypeRepo;
    private final UserService        userService;

    public RoutingService(CallFlowRepository callFlowRepo,
                          WorkTypeRepository workTypeRepo,
                          UserService userService) {
        this.callFlowRepo = callFlowRepo;
        this.workTypeRepo = workTypeRepo;
        this.userService  = userService;
    }

    /**
     * Resolve a call to a routing decision.
     *
     * @param to              the destination string (may be client:id, E.164, or blank)
     * @param twilioOwnNumber the Twilio phone number of this account (E.164)
     */
    public RouteDecision resolve(String to, String twilioOwnNumber) {

        // 1. App-to-app
        if (to != null && to.startsWith("client:")) {
            String clientId = to.substring("client:".length());
            return RouteDecision.appToApp(clientId);
        }

        if (to != null && !to.isBlank()) {

            // 2. Active CallFlow bound to this trigger number
            Optional<CallFlow> flowByNumber = callFlowRepo.findByTriggerNumberAndActiveTrue(to);
            if (flowByNumber.isPresent()) {
                return RouteDecision.callFlow(flowByNumber.get());
            }

            // 3 & 4. WorkType DNIS match
            Optional<WorkType> workTypeOpt = workTypeRepo.findByDnis(to);
            if (workTypeOpt.isPresent()) {
                WorkType wt = workTypeOpt.get();
                if (wt.getCallFlow() != null && wt.getCallFlow().isActive()) {
                    return RouteDecision.workTypeFlow(wt, wt.getCallFlow());
                }
                List<String> agents = onlineAgentsFor(wt);
                return RouteDecision.workTypeQueue(wt, agents);
            }

            // 5. Outbound PSTN
            if (!to.equals(twilioOwnNumber)) {
                return RouteDecision.outboundPstn(to);
            }
        }

        // 6. Fallback: simulring all online agents
        return RouteDecision.fallback(userService.getOnlineUsernames());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private List<String> onlineAgentsFor(WorkType wt) {
        Set<String> staffed = wt.getAgents().stream()
                .map(User::getUsername)
                .collect(Collectors.toSet());
        List<String> online = userService.getOnlineUsernames().stream()
                .filter(staffed::contains)
                .collect(Collectors.toList());
        return online.isEmpty() ? userService.getOnlineUsernames() : online;
    }

    // ── Value object returned to the controller ───────────────────────────────

    /**
     * Immutable value object describing where a call should be routed.
     * The controller uses the type discriminator to build the correct TwiML —
     * it doesn't need to understand routing logic.
     */
    public static final class RouteDecision {

        public final RouteType type;

        // APP_TO_APP
        public final String clientId;

        // CALL_FLOW / WORK_TYPE_FLOW
        public final CallFlow callFlow;

        // WORK_TYPE_QUEUE / WORK_TYPE_FLOW
        public final WorkType workType;
        public final List<String> agentUsernames; // pre-resolved online agents

        // OUTBOUND_PSTN
        public final String destinationNumber;

        private RouteDecision(RouteType type, String clientId, CallFlow callFlow,
                              WorkType workType, List<String> agents, String dest) {
            this.type              = type;
            this.clientId          = clientId;
            this.callFlow          = callFlow;
            this.workType          = workType;
            this.agentUsernames    = agents != null ? agents : List.of();
            this.destinationNumber = dest;
        }

        static RouteDecision appToApp(String clientId) {
            return new RouteDecision(RouteType.APP_TO_APP, clientId, null, null, null, null);
        }
        static RouteDecision callFlow(CallFlow flow) {
            return new RouteDecision(RouteType.CALL_FLOW, null, flow, null, null, null);
        }
        static RouteDecision workTypeFlow(WorkType wt, CallFlow flow) {
            return new RouteDecision(RouteType.WORK_TYPE_FLOW, null, flow, wt, null, null);
        }
        static RouteDecision workTypeQueue(WorkType wt, List<String> agents) {
            return new RouteDecision(RouteType.WORK_TYPE_QUEUE, null, null, wt, agents, null);
        }
        static RouteDecision outboundPstn(String dest) {
            return new RouteDecision(RouteType.OUTBOUND_PSTN, null, null, null, null, dest);
        }
        static RouteDecision fallback(List<String> agents) {
            return new RouteDecision(RouteType.FALLBACK, null, null, null, agents, null);
        }

        // Convenience accessors
        public Long   flowId()       { return callFlow  != null ? callFlow.getId()   : null; }
        public String flowName()     { return callFlow  != null ? callFlow.getName() : null; }
        public Long   workTypeId()   { return workType  != null ? workType.getId()   : null; }
        public String workTypeName() { return workType  != null ? workType.getName() : null; }
    }
}
