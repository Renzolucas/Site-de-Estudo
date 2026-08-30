package com.studyos.api.dto.timelog.response;

import com.studyos.api.model.TimeLog;
import com.studyos.api.model.enums.CompletionStatus;

import java.time.LocalDateTime;

public record TimeLogResponse(
        Long id,
        Long taskId,
        String taskTitle,
        Integer loggedDurationMinutes,
        CompletionStatus completionStatus,
        String notes,
        LocalDateTime createdAt
) {
    public static TimeLogResponse fromEntity(TimeLog timeLog) {
        return new TimeLogResponse(
                timeLog.getId(),
                timeLog.getTask() != null ? timeLog.getTask().getId() : null,
                timeLog.getTask() != null ? timeLog.getTask().getTitle() : null,
                timeLog.getLoggedDurationMinutes(),
                timeLog.getCompletionStatus(),
                timeLog.getNotes(),
                timeLog.getCreatedAt()
        );
    }
}
