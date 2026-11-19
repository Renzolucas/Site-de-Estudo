package com.studyos.api.dto.admin.response;

import com.studyos.api.dto.user.response.UserMentorResponse;
import com.studyos.api.model.User;
import com.studyos.api.model.enums.UserRole;

public record AdminUserResponse(
        Long id,
        String name,
        String email,
        UserRole role,
        Boolean active,
        UserMentorResponse mentor,
        Integer level,
        Long currentXp
) {
    public static AdminUserResponse fromEntity(User user) {
        if (user == null) return null;
        return new AdminUserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole() != null ? user.getRole() : UserRole.STUDENT,
                user.getActive() != null ? user.getActive() : true,
                user.getMentor() != null ? UserMentorResponse.fromEntity(user.getMentor()) : null,
                user.getLevel() != null ? user.getLevel() : 1,
                user.getCurrentXp() != null ? user.getCurrentXp() : 0L
        );
    }
}
