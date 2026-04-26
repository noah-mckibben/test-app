package com.nmckibben.testapp.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nmckibben.testapp.entity.CallFlow;
import com.nmckibben.testapp.entity.CallTrace;
import com.nmckibben.testapp.entity.WorkType;
import com.nmckibben.testapp.repository.CallFlowRepository;
import com.twilio.twiml.VoiceResponse;
import com.twilio.twiml.voice.Client;
import com.twilio.twiml.voice.Dial;
import com.twilio.twiml.voice.Gather;
import com.twilio.twiml.voice.Hangup;
import com.twilio.twiml.voice.Say;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

/**
 * Call Flow domain — interprets a saved call flow (stored as React-Flow JSON)
 * and produces TwiML.
 *
 * Dependency change (microservice prep):
 *   Previously injected WorkTypeRepository directly (cross-domain repo access).
 *   Now delegates to WorkTypeService, which is the public API of the Routing
 *   domain.  If Routing becomes a separate service, this call becomes an HTTP
 *   request — the executor doesn't change.
 *
 * Node types handled:
 *   start        – entry point, follow the outgoing edge
 *   greeting     – <Say> the configured message
 *   menu         – <Gather numDigits="1"> with IVR prompt
 *   route_queue  – <Dial> online agents in the named WorkType
 *   route_agent  – <Dial><Client>username</Client></Dial>
 *   voicemail    – <Say> prompt then <Record transcribe="true">
 *   end          – <Hangup>
 */
@Service
public class CallFlowExecutorService {

    private final UserService        userService;
    private final WorkTypeService    workTypeService;   // ← Routing domain service, not repo
    private final CallFlowRepository callFlowRepo;
    private final CallTraceService   traceService;
    private final ObjectMapper       mapper = new ObjectMapper();

    public CallFlowExecutorService(UserService userService,
                                   WorkTypeService workTypeService,
                                   CallFlowRepository callFlowRepo,
                                   CallTraceService traceService) {
        this.userService     = userService;
        this.workTypeService = workTypeService;
        this.callFlowRepo    = callFlowRepo;
        this.traceService    = traceService;
    }

    // ── Public execute API ────────────────────────────────────────────────────

    public String execute(CallFlow flow, String baseUrl) {
        return execute(flow, baseUrl, null, null, null);
    }

    public String execute(CallFlow flow, String baseUrl, String callSid) {
        return execute(flow, baseUrl, callSid, null, null);
    }

    public String execute(CallFlow flow, String baseUrl, String callSid,
                          Long workTypeId, String workTypeName) {
        try {
            traceService.log(CallTrace.of("FLOW_START", "INFO", "Starting flow: " + flow.getName())
                    .callSid(callSid)
                    .flow(flow.getId(), flow.getName())
                    .workType(workTypeId, workTypeName));

            JsonNode root  = mapper.readTree(flow.getFlowJson());
            List<JsonNode> nodes = toList(root.get("nodes"));
            List<JsonNode> edges = toList(root.get("edges"));

            JsonNode start = nodes.stream()
                    .filter(n -> "start".equals(n.path("type").asText()))
                    .findFirst().orElse(null);

            if (start == null) return error("No start node found in flow.");

            VoiceResponse.Builder response = new VoiceResponse.Builder();
            traverse(start, nodes, edges, response, flow.getId(), baseUrl, callSid, workTypeId, workTypeName);
            return response.build().toXml();

        } catch (Exception ex) {
            traceService.log(CallTrace.of("FLOW_ERROR", "FAILURE",
                    "Flow execution error: " + ex.getMessage())
                    .callSid(callSid)
                    .flow(flow.getId(), flow.getName())
                    .workType(workTypeId, workTypeName));
            return error("Flow execution error: " + ex.getMessage());
        }
    }

    // ── ID-based helpers (used by Twilio webhook endpoints) ───────────────────

    /** Execute a flow looked up by ID — used by /flow/{flowId}/voice webhook. */
    public String executeById(Long flowId, String baseUrl) {
        return callFlowRepo.findById(flowId)
                .map(f -> execute(f, baseUrl))
                .orElse(error("Call flow not found."));
    }

    /** Handle gather callback looked up by flow ID — used by /flow/{flowId}/gather webhook. */
    public String handleGatherById(Long flowId, String nodeId, String digit, String baseUrl) {
        return callFlowRepo.findById(flowId)
                .map(f -> handleGather(f, nodeId, digit, baseUrl, null))
                .orElse(error("Call flow not found."));
    }

    /**
     * Execute a WorkType's call flow (or fall back to ringing agents directly).
     * Used by /worktype/{workTypeId}/voice webhook.
     */
    public String executeByWorkTypeId(Long workTypeId, String baseUrl) {
        WorkType wt;
        try { wt = workTypeService.get(workTypeId); }
        catch (Exception e) { return error("Work type not found."); }
        if (wt.getCallFlow() != null && wt.getCallFlow().isActive()) {
            return execute(wt.getCallFlow(), baseUrl);
        }
        VoiceResponse.Builder response = new VoiceResponse.Builder();
        response.say(new Say.Builder("Please hold while we connect you to an agent.").build());
        buildQueueDial(response, wt.getName());
        return response.build().toXml();
    }

    // ── Gather callback ───────────────────────────────────────────────────────

    public String handleGather(CallFlow flow, String menuNodeId, String digit, String baseUrl) {
        return handleGather(flow, menuNodeId, digit, baseUrl, null);
    }

    public String handleGather(CallFlow flow, String menuNodeId, String digit,
                               String baseUrl, String callSid) {
        try {
            JsonNode root  = mapper.readTree(flow.getFlowJson());
            List<JsonNode> nodes = toList(root.get("nodes"));
            List<JsonNode> edges = toList(root.get("edges"));

            JsonNode menuNode = nodes.stream()
                    .filter(n -> menuNodeId.equals(n.path("id").asText()))
                    .findFirst().orElse(null);
            if (menuNode == null) return error("Menu node not found.");

            List<JsonNode> outEdges = edges.stream()
                    .filter(e -> menuNodeId.equals(e.path("source").asText()))
                    .collect(Collectors.toList());

            String optionsText = menuNode.path("data").path("options").asText("");
            List<String> digitOrder = Arrays.stream(optionsText.split("\n"))
                    .map(line -> line.contains("=") ? line.split("=")[0].trim() : "")
                    .filter(d -> !d.isEmpty())
                    .collect(Collectors.toList());

            int idx = digitOrder.indexOf(digit);
            String nextNodeId = null;
            if (idx >= 0 && idx < outEdges.size()) {
                nextNodeId = outEdges.get(idx).path("target").asText();
            } else if (!outEdges.isEmpty()) {
                nextNodeId = outEdges.get(0).path("target").asText();
            }
            if (nextNodeId == null) return error("No route for digit " + digit);

            String nid = nextNodeId;
            JsonNode nextNode = nodes.stream()
                    .filter(n -> nid.equals(n.path("id").asText()))
                    .findFirst().orElse(null);

            VoiceResponse.Builder response = new VoiceResponse.Builder();
            if (nextNode != null) {
                traverse(nextNode, nodes, edges, response, flow.getId(), baseUrl, callSid, null, null);
            } else {
                response.hangup(new Hangup.Builder().build());
            }
            return response.build().toXml();

        } catch (Exception ex) {
            return error("Gather handler error: " + ex.getMessage());
        }
    }

    // ── Dial helpers (called by TwilioController fallback paths) ─────────────

    /** Simulring all ONLINE agents — exposed for the campaign/fallback webhook. */
    public void dialAllOnlineAgents(VoiceResponse.Builder response) {
        List<String> online = userService.getOnlineUsernames();
        if (online.isEmpty()) {
            response.say(new Say.Builder(
                    "Sorry, no agents are available right now. Please try again later.").build());
        } else {
            Dial.Builder dial = new Dial.Builder();
            for (String u : online) dial.client(new Client.Builder(u).build());
            response.dial(dial.build());
        }
    }

    /**
     * Dial online agents in a named WorkType queue.
     * Uses WorkTypeService (Routing domain API) not WorkTypeRepository.
     */
    public void buildQueueDial(VoiceResponse.Builder response, String queueName) {
        List<String> agents;
        if (!queueName.isBlank()) {
            // Delegate lookup to the Routing domain's service
            Optional<WorkType> wt = workTypeService.getAll().stream()
                    .filter(w -> queueName.equalsIgnoreCase(w.getName()))
                    .findFirst();
            if (wt.isPresent()) {
                Set<String> staffed = wt.get().getAgents().stream()
                        .map(com.nmckibben.testapp.entity.User::getUsername)
                        .collect(Collectors.toSet());
                agents = userService.getOnlineUsernames().stream()
                        .filter(staffed::contains)
                        .collect(Collectors.toList());
            } else {
                agents = userService.getOnlineUsernames();
            }
        } else {
            agents = userService.getOnlineUsernames();
        }

        if (agents.isEmpty()) {
            response.say(new Say.Builder(
                    "Sorry, no agents are available right now. Please try again later.").build());
            return;
        }
        Dial.Builder dial = new Dial.Builder();
        for (String u : agents) dial.client(new Client.Builder(u).build());
        response.dial(dial.build());
    }

    // ── Node traversal ────────────────────────────────────────────────────────

    private void traverse(JsonNode current, List<JsonNode> nodes, List<JsonNode> edges,
                          VoiceResponse.Builder response, Long flowId, String baseUrl,
                          String callSid, Long workTypeId, String workTypeName) {
        Set<String> visited = new HashSet<>();
        while (current != null) {
            String id   = current.path("id").asText();
            String type = current.path("type").asText();
            if (visited.contains(id)) break;
            visited.add(id);

            JsonNode data = current.path("data");

            switch (type) {
                case "start" -> { /* just follow the edge */ }

                case "greeting" -> {
                    String msg = data.path("message").asText("").trim();
                    if (!msg.isEmpty()) response.say(new Say.Builder(msg).build());
                }

                case "menu" -> {
                    buildGather(response, current, flowId, baseUrl);
                    return;
                }

                case "route_queue" -> {
                    buildQueueDial(response, data.path("queue").asText("").trim());
                    return;
                }

                case "route_agent" -> {
                    String username = data.path("agentUsername").asText("").trim();
                    if (!username.isEmpty()) {
                        response.dial(new Dial.Builder()
                                .client(new Client.Builder(username).build())
                                .build());
                    }
                    return;
                }

                case "voicemail" -> {
                    String prompt = data.path("prompt")
                            .asText("Please leave a message after the tone.").trim();
                    response.say(new Say.Builder(prompt).build());
                    response.record(new com.twilio.twiml.voice.Record.Builder()
                            .transcribe(true).build());
                    return;
                }

                case "end" -> {
                    response.hangup(new Hangup.Builder().build());
                    return;
                }
            }

            if (!type.equals("start")) {
                traceService.log(CallTrace.of("FLOW_NODE", "SUCCESS", "Executed node: " + type)
                        .callSid(callSid)
                        .flow(flowId, null)
                        .workType(workTypeId, workTypeName)
                        .node(id, type, data.path("label").asText(type)));
            }

            String cid = id;
            Optional<String> nextId = edges.stream()
                    .filter(e -> cid.equals(e.path("source").asText()))
                    .map(e -> e.path("target").asText())
                    .findFirst();
            if (nextId.isEmpty()) break;

            String nid = nextId.get();
            current = nodes.stream()
                    .filter(n -> nid.equals(n.path("id").asText()))
                    .findFirst().orElse(null);
        }
    }

    private void buildGather(VoiceResponse.Builder response, JsonNode menuNode,
                             Long flowId, String baseUrl) {
        JsonNode data = menuNode.path("data");
        String prompt = data.path("prompt").asText("Please make a selection.").trim();
        String nodeId = menuNode.path("id").asText();
        String action = baseUrl + "/api/twilio/flow/" + flowId + "/gather?nodeId=" + nodeId;

        response.gather(new Gather.Builder()
                .numDigits(1)
                .action(action)
                .say(new Say.Builder(prompt).build())
                .build());
        response.say(new Say.Builder("We did not receive your input. Goodbye.").build());
        response.hangup(new Hangup.Builder().build());
    }

    private String error(String msg) {
        return new VoiceResponse.Builder()
                .say(new Say.Builder("We are sorry, an error occurred.").build())
                .hangup(new Hangup.Builder().build())
                .build().toXml();
    }

    private List<JsonNode> toList(JsonNode arr) {
        if (arr == null || !arr.isArray()) return Collections.emptyList();
        return StreamSupport.stream(arr.spliterator(), false).collect(Collectors.toList());
    }
}
