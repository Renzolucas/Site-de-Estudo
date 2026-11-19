package com.studyos.api.dto.user.response;

import com.studyos.api.model.User;

public record UserMentorResponse(
        Long id,
        String name
) {
    public static UserMentorResponse fromEntity(User user) {
        if (user == null) return null;
        return new UserMentorResponse(user.getId(), user.getName());
    }
}
