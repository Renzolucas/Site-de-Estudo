package com.studyos.api.dto.mentor.response;

import com.studyos.api.model.enums.CompletionStatus;

import java.time.LocalDateTime;

public record MentorSessionResponse(
        Long id,
        LocalDateTime date,
        Integer durationMinutes,
        CompletionStatus completionStatus
) {
}
