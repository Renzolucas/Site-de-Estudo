package com.studyos.api.dto.mentor.response;

import java.time.LocalDate;

public record MentorDailyStudyResponse(
        LocalDate date,
        String dayOfWeek,
        int minutes
) {
}
