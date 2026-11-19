package com.studyos.api.dto.mentor.response;

import com.studyos.api.model.enums.MentorActivityStatus;

import java.time.LocalDateTime;
import java.util.List;

public record MentorStudentDetailResponse(
        Long id,
        String name,
        Integer level,
        Long currentXp,
        Integer streakDays,
        Integer frozenCount,
        long tasksTotal,
        long tasksCompleted,
        Double completionRate,
        int minutesLast7Days,
        LocalDateTime lastActivityAt,
        MentorActivityStatus activityStatus,
        List<MentorDailyStudyResponse> dailyStudyMinutes,
        List<MentorTaskResponse> tasks,
        List<MentorSessionResponse> recentSessions
) {
}
