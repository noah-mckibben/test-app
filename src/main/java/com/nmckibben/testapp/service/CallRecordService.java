package com.nmckibben.testapp.service;

import com.nmckibben.testapp.dto.CallRecordDto;
import com.nmckibben.testapp.entity.CallRecord;
import com.nmckibben.testapp.entity.CallStatus;
import com.nmckibben.testapp.entity.User;
import com.nmckibben.testapp.repository.CallRecordRepository;
import com.nmckibben.testapp.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Business logic for creating and updating call records.
 *
 * <p>A call record is written when a call is initiated (status: {@code INITIATED}) and
 * updated as the call progresses through its lifecycle. When a call reaches a terminal
 * state ({@code ENDED}, {@code MISSED}, or {@code REJECTED}), the end time and duration
 * are automatically computed and persisted.
 */
@Service
public class CallRecordService {

    private final CallRecordRepository callRecordRepository;
    private final UserRepository userRepository;

    public CallRecordService(CallRecordRepository callRecordRepository, UserRepository userRepository) {
        this.callRecordRepository = callRecordRepository;
        this.userRepository = userRepository;
    }

    /**
     * Creates an in-app call record between two registered users.
     *
     * @param callerUsername username of the user initiating the call
     * @param calleeId       database ID of the intended recipient
     * @return the persisted call record as a DTO
     */
    public CallRecordDto createCallRecord(String callerUsername, Long calleeId) {
        User caller = userRepository.findByUsername(callerUsername).orElseThrow();
        User callee = userRepository.findById(calleeId).orElseThrow();
        CallRecord record = new CallRecord();
        record.setCaller(caller);
        record.setCallee(callee);
        record.setStatus(CallStatus.INITIATED);
        return CallRecordDto.from(callRecordRepository.save(record));
    }

    /**
     * Creates a PSTN call record where the callee is an external phone number (not an app user).
     *
     * @param callerUsername username of the user initiating the call
     * @param calleeNumber   destination phone number in E.164 format
     * @return the persisted call record as a DTO
     */
    public CallRecordDto createPstnCallRecord(String callerUsername, String calleeNumber) {
        User caller = userRepository.findByUsername(callerUsername).orElseThrow();
        CallRecord record = new CallRecord();
        record.setCaller(caller);
        record.setCalleeNumber(calleeNumber);
        record.setStatus(CallStatus.INITIATED);
        return CallRecordDto.from(callRecordRepository.save(record));
    }

    /**
     * Updates the status of an existing call record.
     *
     * <p>If the new status is a terminal state ({@code ENDED}, {@code MISSED}, or
     * {@code REJECTED}), {@code endTime} is set to now and {@code durationSeconds}
     * is computed from the difference between start and end times.
     *
     * @param id     the call record ID
     * @param status the new {@link CallStatus}
     * @return the updated call record as a DTO
     */
    public CallRecordDto updateCallRecord(Long id, CallStatus status) {
        CallRecord record = callRecordRepository.findById(id).orElseThrow();
        record.setStatus(status);
        if (status == CallStatus.ENDED || status == CallStatus.MISSED || status == CallStatus.REJECTED) {
            record.setEndTime(LocalDateTime.now());
            if (record.getStartTime() != null) {
                record.setDurationSeconds(ChronoUnit.SECONDS.between(record.getStartTime(), record.getEndTime()));
            }
        }
        return CallRecordDto.from(callRecordRepository.save(record));
    }

    public List<CallRecordDto> getCallHistory(String username) {
        User user = userRepository.findByUsername(username).orElseThrow();
        return callRecordRepository.findByUser(user).stream()
                .map(CallRecordDto::from)
                .toList();
    }
}
