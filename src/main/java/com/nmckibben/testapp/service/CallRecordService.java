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

@Service
public class CallRecordService {

    private final CallRecordRepository callRecordRepository;
    private final UserRepository userRepository;

    public CallRecordService(CallRecordRepository callRecordRepository, UserRepository userRepository) {
        this.callRecordRepository = callRecordRepository;
        this.userRepository = userRepository;
    }

    public CallRecordDto createCallRecord(String callerUsername, Long calleeId) {
        User caller = userRepository.findByUsername(callerUsername).orElseThrow();
        User callee = userRepository.findById(calleeId).orElseThrow();
        CallRecord record = new CallRecord();
        record.setCaller(caller);
        record.setCallee(callee);
        record.setStatus(CallStatus.INITIATED);
        return CallRecordDto.from(callRecordRepository.save(record));
    }

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
