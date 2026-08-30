package com.studyos.api.dto.user.response;

import com.studyos.api.model.User;

public record UserResponse(
        Long id,
        String name,
        String email,
        Integer level,
        Long currentXp,
        Integer streakDays
) {
    public static UserResponse fromEntity(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getLevel(),
                user.getCurrentXp(),
                user.getStreakDays()
        );
    }
}
