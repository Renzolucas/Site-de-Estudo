package com.studyos.api.dto.mentor.response;

import com.studyos.api.model.enums.SeasonCode;
import com.studyos.api.model.enums.TaskCategory;
import com.studyos.api.model.enums.TaskStatus;

import java.time.LocalDate;

public record MentorTaskResponse(
        Long id,
        String title,
        TaskCategory category,
        SeasonCode season,
        TaskStatus status,
        Integer plannedMinutes,
        Integer completedMinutes,
        LocalDate startDate,
        LocalDate endDate
) {
}
