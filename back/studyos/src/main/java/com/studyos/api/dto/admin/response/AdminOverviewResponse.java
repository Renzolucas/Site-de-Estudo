package com.studyos.api.dto.admin.response;

import java.util.List;

public record AdminOverviewResponse(
        long studentsCount,
        long mentorsCount,
        long adminsCount,
        long activeUsersCount,
        long inactiveUsersCount,
        long studentsWithoutMentorCount,
        long totalTasks,
        long completedTasks,
        long totalStudyMinutes,
        long totalAnnouncements,
        List<AdminActionLogResponse> recentActions
) {}
