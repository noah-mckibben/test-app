package com.nmckibben.testapp.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nmckibben.testapp.entity.CallFlow;
import com.nmckibben.testapp.entity.WorkType;
import com.nmckibben.testapp.repository.WorkTypeRepository;
import com.twilio.twiml.VoiceResponse;
import com.twilio.twiml.voice.*;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

/**
 * Interprets a saved call flow (stored as React-Flow JSON) and produces TwiML.
 *
 * Node types handled:
 *   start        – entry point, follow the outgoing edge
 *   greeting     – <Say> the configured message
 *   menu         – <Gather numDigits="1"> with IVR prompt; posts back to /flow/{id}/gather
 *   route_queue  – <Dial> all ONLINE agents staffed in the named WorkType
 *   route_agent  – <Dial><Client>username</Client></Dial>
 *   voicemail    – <Say> prompt then <Record transcribe="true">
 *   end          – <Hangup>
 */
@Service
public class CallFlowExecutorService {

    private final UserService userService;
    private final WorkTypeRepository workTypeRepo;
    private final ObjectMapper mapper = new ObjectMapper();

    public CallFlowExecutorService(UserService userService, WorkTypeRepository workTypeRepo) {
        this.userService  = userService;
        this.workTypeRepo = workTypeRepo;
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /** Execute a call flow from its Start node and return TwiML XML. */
    public String execute(CallFlow flow, String baseUrl) {
        try {
            JsonNode root  = mapper.readTree(flow.getFlowJson());
            List<JsonNode> nodes = toList(root.get("nodes"));
            List<JsonNode> edges = toList(root.get("edges"));

            JsonNode start = nodes.stream()
                    .filter(n -> "start".equals(n.path("type").asText()))
                    .findFirst().orElse(null);

            if (start == null) return error("No start node found in flow.");

            VoiceResponse.Builder response = new VoiceResponse.Builder();
            traverse(start, nodes, edges, response, flow.getId(), baseUrl);
            return response.build().toXml();

        } catch (Exception ex) {
            return error("Flow execution error: " + ex.getMessage());
        }
    }

    /**
     * Handle an IVR gather callback.
     * Called by Twilio after the caller presses a digit on a menu node.
     *
     * @param flow       the call flow
     * @param menuNodeId the ID of the menu node that collected the digit
     * @param digit      the digit pressed ("1", "2", etc.)
     * @param baseUrl    app base URL for nested callbacks
     */
    public String handleGather(CallFlow flow, String menuNodeId, String digit, String baseUrl) {
        try {
            JsonNode root  = mapper.readTree(flow.getFlowJson());
            List<JsonNode> nodes = toList(root.get("nodes"));
            List<JsonNode> edges = toList(root.get("edges"));

            JsonNode menuNode = nodes.stream()
                    .filter(n -> menuNodeId.equals(n.path("id").asText()))
                    .findFirst().orElse(null);
            if (menuNode == null) return error("Menu node not found.");

            // Outgoing edges from this menu node, in encounter order
            List<JsonNode> outEdges = edges.stream()
                    .filter(e -> menuNodeId.equals(e.path("source").asText()))
                    .collect(Collectors.toList());

            // Parse "1=Sales\n2=Support\n0=Operator" → ordered digit list
            JsonNode data = menuNode.path("data");
            String optionsText = data.path("options").asText("");
            List<String> digitOrder = Arrays.stream(optionsText.split("\n"))
                    .map(line -> line.contains("=") ? line.split("=")[0].trim() : "")
                    .filter(d -> !d.isEmpty())
                    .collect(Collectors.toList());

            int idx = digitOrder.indexOf(digit);
            String nextNodeId = null;
            if (idx >= 0 && idx < outEdges.size()) {
                nextNodeId = outEdges.get(idx).path("target").asText();
            } else if (!outEdges.isEmpty()) {
                nextNodeId = outEdges.get(0).path("target").asText(); // fallback: first edge
            }

            if (nextNodeId == null) return error("No route for digit " + digit);

            String nid = nextNodeId;
            JsonNode nextNode = nodes.stream()
                    .filter(n -> nid.equals(n.path("id").asText()))
                    .findFirst().orElse(null);

            VoiceResponse.Builder response = new VoiceResponse.Builder();
            if (nextNode != null) {
                traverse(nextNode, nodes, edges, response, flow.getId(), baseUrl);
            } else {
                response.hangup(new Hangup.Builder().build());
            }
            return response.build().toXml();

        } catch (Exception ex) {
            return error("Gather handler error: " + ex.getMessage());
        }
    }

    // ── Node traversal ────────────────────────────────────────────────────────

    private void traverse(JsonNode current, List<JsonNode> nodes, List<JsonNode> edges,
                          VoiceResponse.Builder response, Long flowId, String baseUrl) {
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
                    return; // Twilio will POST back; stop building TwiML here
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
                    String prompt = data.path("prompt").asText("Please leave a message after the tone.").trim();
                    response.say(new Say.Builder(prompt).build());
                    response.record(new Record.Builder().transcribe(true).build());
                    return;
                }

                case "end" -> {
                    response.hangup(new Hangup.Builder().build());
                    return;
                }
            }

            // Follow the first outgoing edge
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

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void buildGather(VoiceResponse.Builder response, JsonNode menuNode,
                             Long flowId, String baseUrl) {
        JsonNode data  = menuNode.path("data");
        String prompt  = data.path("prompt").asText("Please make a selection.").trim();
        String nodeId  = menuNode.path("id").asText();
        String action  = baseUrl + "/api/twilio/flow/" + flowId + "/gather?nodeId=" + nodeId;

        response.gather(new Gather.Builder()
                .numDigits(1)
                .action(action)
                .say(new Say.Builder(prompt).build())
                .build());

        // Timeout fallback
        response.say(new Say.Builder("We did not receive your input. Goodbye.").build());
        response.hangup(new Hangup.Builder().build());
    }

    /** Dial all ONLINE agents in the named WorkType queue (falls back to all agents). */
    public void buildQueueDial(VoiceResponse.Builder response, String queueName) {
        List<String> agents;

        if (!queueName.isEmpty()) {
            Optional<WorkType> wt = workTypeRepo.findAll().stream()
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

    private String error(String msg) {
        return new VoiceResponse.Builder()
                .say(new Say.Builder("We are sorry, an error occurred. " + msg).build())
                .hangup(new Hangup.Builder().build())
                .build().toXml();
    }

    private List<JsonNode> toList(JsonNode arr) {
        if (arr == null || !arr.isArray()) return Collections.emptyList();
        return StreamSupport.stream(arr.spliterator(), false).collect(Collectors.toList());
    }
}
