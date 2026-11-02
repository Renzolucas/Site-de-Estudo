package com.studyos.api.dto.task.response;

import com.studyos.api.model.Task;
import com.studyos.api.model.enums.SeasonCode;
import com.studyos.api.model.enums.TaskCategory;
import com.studyos.api.model.enums.TaskStatus;

import java.time.LocalDate;

public record TaskResponse(
        Long id,
        Long userId,
        String title,
        String description,
        TaskCategory category,
        SeasonCode season,
        Long seasonId,
        Integer plannedDurationMinutes,
        Integer actualDurationMinutes,
        TaskStatus status,
        LocalDate targetDate,
        Integer xpReward,
        Boolean streakProcessed
) {
    public TaskResponse(
            Long id,
            Long userId,
            String title,
            String description,
            TaskCategory category,
            SeasonCode season,
            Integer plannedDurationMinutes,
            Integer actualDurationMinutes,
            TaskStatus status,
            LocalDate targetDate,
            Integer xpReward
    ) {
        this(id, userId, title, description, category, season, null, plannedDurationMinutes, actualDurationMinutes, status, targetDate, xpReward, false);
    }

    public TaskResponse(
            Long id,
            Long userId,
            String title,
            String description,
            TaskCategory category,
            SeasonCode season,
            Long seasonId,
            Integer plannedDurationMinutes,
            Integer actualDurationMinutes,
            TaskStatus status,
            LocalDate targetDate,
            Integer xpReward
    ) {
        this(id, userId, title, description, category, season, seasonId, plannedDurationMinutes, actualDurationMinutes, status, targetDate, xpReward, false);
    }

    public static TaskResponse fromEntity(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getUser() != null ? task.getUser().getId() : null,
                task.getTitle(),
                task.getDescription(),
                task.getCategory(),
                task.getSeason(),
                task.getSeasonEntity() != null ? task.getSeasonEntity().getId() : null,
                task.getPlannedDurationMinutes(),
                task.getActualDurationMinutes(),
                task.getStatus(),
                task.getTargetDate(),
                task.getXpReward(),
                task.getStreakProcessed() != null ? task.getStreakProcessed() : false
        );
    }
}
