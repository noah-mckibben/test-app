package com.nmckibben.testapp.dto;

import com.nmckibben.testapp.entity.CallRecord;
import java.time.LocalDateTime;

public class CallRecordDto {
    private Long id;
    private UserDto caller;
    private UserDto callee;
    private String calleeNumber;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Long durationSeconds;
    private String status;

    public static CallRecordDto from(CallRecord record) {
        CallRecordDto dto = new CallRecordDto();
        dto.id = record.getId();
        dto.caller = UserDto.from(record.getCaller());
        dto.callee = record.getCallee() != null ? UserDto.from(record.getCallee()) : null;
        dto.calleeNumber = record.getCalleeNumber();
        dto.startTime = record.getStartTime();
        dto.endTime = record.getEndTime();
        dto.durationSeconds = record.getDurationSeconds();
        dto.status = record.getStatus().name();
        return dto;
    }

    public Long getId() { return id; }
    public UserDto getCaller() { return caller; }
    public UserDto getCallee() { return callee; }
    public String getCalleeNumber() { return calleeNumber; }
    public LocalDateTime getStartTime() { return startTime; }
    public LocalDateTime getEndTime() { return endTime; }
    public Long getDurationSeconds() { return durationSeconds; }
    public String getStatus() { return status; }
}
