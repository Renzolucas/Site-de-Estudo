package com.studyos.api.dto.mentor.response;

import java.util.List;

public record MentorOverviewResponse(
        long totalStudents,
        double totalStudyHours,
        long completedTasks,
        long totalTasks,
        double averageXp,
        long inactiveStudents,
        List<MentorTopStudentResponse> topStudents
) {
}
