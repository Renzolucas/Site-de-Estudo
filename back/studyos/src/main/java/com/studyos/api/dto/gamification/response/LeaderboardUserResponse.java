package com.studyos.api.dto.gamification.response;

import com.studyos.api.model.User;

public record LeaderboardUserResponse(
        Long id,
        String name,
        Integer level,
        Long currentXp,
        Integer streakDays,
        Integer frozenCount
) {
    public LeaderboardUserResponse(Long id, String name, Integer level, Long currentXp, Integer streakDays) {
        this(id, name, level, currentXp, streakDays, 0);
    }

    public static LeaderboardUserResponse fromEntity(User user) {
        return new LeaderboardUserResponse(
                user.getId(),
                user.getName(),
                user.getLevel(),
                user.getCurrentXp(),
                user.getStreakDays(),
                user.getFrozenCount() != null ? user.getFrozenCount() : 0
        );
    }
}
