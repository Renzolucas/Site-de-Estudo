package com.studyos.api.controller.timelog;

import com.studyos.api.dto.timelog.request.TimeLogCreateRequest;
import com.studyos.api.dto.timelog.response.TimeLogResponse;
import com.studyos.api.service.timelog.TimeLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/timelogs")
@RequiredArgsConstructor
public class TimeLogController {

    private final TimeLogService timeLogService;

    @PostMapping
    public ResponseEntity<TimeLogResponse> logTime(@Valid @RequestBody TimeLogCreateRequest request) {
        TimeLogResponse response = timeLogService.logTime(request);
        URI location = ServletUriComponentsBuilder
                .fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.id())
                .toUri();
        return ResponseEntity.created(location).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TimeLogResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(timeLogService.findById(id));
    }

    @GetMapping("/task/{taskId}")
    public ResponseEntity<List<TimeLogResponse>> findByTask(@PathVariable Long taskId) {
        return ResponseEntity.ok(timeLogService.findByTaskId(taskId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<TimeLogResponse>> findByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(timeLogService.findByUserId(userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        timeLogService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
