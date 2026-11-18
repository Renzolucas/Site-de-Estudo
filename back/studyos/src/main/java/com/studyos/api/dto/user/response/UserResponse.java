package com.studyos.api.dto.user.response;

import com.studyos.api.model.User;
import com.studyos.api.model.enums.UserRole;

public record UserResponse(
        Long id,
        String name,
        String email,
        Integer level,
        Long currentXp,
        Integer streakDays,
        Integer frozenCount,
        UserRole role,
        UserMentorResponse mentor,
        Boolean active
) {
    public UserResponse(Long id, String name, String email, Integer level, Long currentXp, Integer streakDays) {
        this(id, name, email, level, currentXp, streakDays, 0, UserRole.STUDENT, null, true);
    }

    public UserResponse(Long id, String name, String email, Integer level, Long currentXp, Integer streakDays, Integer frozenCount) {
        this(id, name, email, level, currentXp, streakDays, frozenCount, UserRole.STUDENT, null, true);
    }

    public static UserResponse fromEntity(User user) {
        if (user == null) {
            return null;
        }
        UserRole userRole = user.getRole() != null ? user.getRole() : UserRole.STUDENT;
        Boolean userActive = user.getActive() != null ? user.getActive() : true;
        UserMentorResponse mentorResponse = null;
        if (user.getMentor() != null) {
            mentorResponse = new UserMentorResponse(user.getMentor().getId(), user.getMentor().getName());
        }

        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getLevel(),
                user.getCurrentXp(),
                user.getStreakDays(),
                user.getFrozenCount() != null ? user.getFrozenCount() : 0,
                userRole,
                mentorResponse,
                userActive
        );
    }
}
