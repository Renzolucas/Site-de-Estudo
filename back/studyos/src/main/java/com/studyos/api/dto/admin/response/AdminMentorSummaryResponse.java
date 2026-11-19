package com.studyos.api.dto.admin.response;

import com.studyos.api.model.User;

public record AdminMentorSummaryResponse(
        Long id,
        String name
) {
    public static AdminMentorSummaryResponse fromEntity(User user) {
        if (user == null) return null;
        return new AdminMentorSummaryResponse(
                user.getId(),
                user.getName()
        );
    }
}
