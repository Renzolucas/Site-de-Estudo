package com.studyos.api.dto.gamification.response;

public record StudyStatsResponse(
        Long totalStudyMinutes,
        Long totalTasksCompleted,
        Integer streakDays,
        Long currentXp,
        Integer level
) {}
