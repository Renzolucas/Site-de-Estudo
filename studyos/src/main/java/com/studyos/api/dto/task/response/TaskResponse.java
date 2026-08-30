package com.studyos.api.dto.task.response;

import com.studyos.api.model.Task;
import com.studyos.api.model.enums.Season;
import com.studyos.api.model.enums.TaskCategory;
import com.studyos.api.model.enums.TaskStatus;

import java.time.LocalDate;

public record TaskResponse(
        Long id,
        Long userId,
        String title,
        String description,
        TaskCategory category,
        Season season,
        Integer plannedDurationMinutes,
        Integer actualDurationMinutes,
        TaskStatus status,
        LocalDate targetDate,
        Integer xpReward
) {
    public static TaskResponse fromEntity(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getUser() != null ? task.getUser().getId() : null,
                task.getTitle(),
                task.getDescription(),
                task.getCategory(),
                task.getSeason(),
                task.getPlannedDurationMinutes(),
                task.getActualDurationMinutes(),
                task.getStatus(),
                task.getTargetDate(),
                task.getXpReward()
        );
    }
}
