package com.studyos.api.dto.gamification.response;

import com.studyos.api.model.User;

public record LeaderboardUserResponse(
        Long id,
        String name,
        Integer level,
        Long currentXp,
        Integer streakDays
) {
    public static LeaderboardUserResponse fromEntity(User user) {
        return new LeaderboardUserResponse(
                user.getId(),
                user.getName(),
                user.getLevel(),
                user.getCurrentXp(),
                user.getStreakDays()
        );
    }
}
