package com.studyos.api.dto.mentor.response;

public record MentorTopStudentResponse(
        Long id,
        String name,
        int minutesLast7Days,
        Long currentXp,
        Integer level
) {
}
