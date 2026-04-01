package com.nmckibben.testapp.controller;

import com.nmckibben.testapp.dto.CallRecordDto;
import com.nmckibben.testapp.entity.CallStatus;
import com.nmckibben.testapp.service.CallRecordService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/calls")
public class CallRecordController {

    private final CallRecordService callRecordService;

    public CallRecordController(CallRecordService callRecordService) {
        this.callRecordService = callRecordService;
    }

    @PostMapping("/{calleeId}")
    public ResponseEntity<CallRecordDto> initiateCall(@AuthenticationPrincipal UserDetails userDetails,
                                                       @PathVariable Long calleeId) {
        return ResponseEntity.ok(callRecordService.createCallRecord(userDetails.getUsername(), calleeId));
    }

    @PutMapping("/{callId}/status")
    public ResponseEntity<CallRecordDto> updateStatus(@PathVariable Long callId,
                                                       @RequestParam CallStatus status) {
        return ResponseEntity.ok(callRecordService.updateCallRecord(callId, status));
    }

    @GetMapping
    public ResponseEntity<List<CallRecordDto>> getCallHistory(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(callRecordService.getCallHistory(userDetails.getUsername()));
    }
}
