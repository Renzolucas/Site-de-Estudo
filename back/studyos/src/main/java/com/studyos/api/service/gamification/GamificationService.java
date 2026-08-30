package com.studyos.api.service.gamification;

import com.studyos.api.model.User;
import com.studyos.api.model.enums.CompletionStatus;
import com.studyos.api.model.enums.TaskCategory;
import com.studyos.api.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class GamificationService {

    private final UserRepository userRepository;

    private static final int BASE_XP_PER_MINUTE = 1;
    private static final int BASE_TASK_XP_PER_15_MIN = 10;
    private static final int XP_PER_LEVEL = 500;

    /**
     * Calcula o XP base para uma tarefa com base na duração planejada e categoria.
     */
    public int calculateTaskXp(Integer plannedMinutes, TaskCategory category) {
        if (plannedMinutes == null || plannedMinutes <= 0) {
            return 20;
        }

        int blocks = Math.max(1, plannedMinutes / 15);
        int baseXp = blocks * BASE_TASK_XP_PER_15_MIN;

        // Bônus leve por categoria de alta concentração
        return switch (category) {
            case JAVA_BACKEND, DATABASE, DEVOPS -> (int) (baseXp * 1.2);
            case ENGLISH, EXERCISE -> (int) (baseXp * 1.1);
            default -> baseXp;
        };
    }

    /**
     * Calcula o XP ganho a partir de um registro de tempo (TimeLog).
     */
    public int calculateTimeLogXp(int loggedMinutes, CompletionStatus completionStatus) {
        if (loggedMinutes <= 0) {
            return 0;
        }

        double multiplier = switch (completionStatus) {
            case COMPLETED -> 1.0;
            case PARTIAL -> 0.8;
            case INTERRUPTED -> 0.5;
        };

        return (int) Math.round(loggedMinutes * BASE_XP_PER_MINUTE * multiplier);
    }

    /**
     * Concede XP ao usuário e recalcula o nível caso atinja o limite.
     */
    @Transactional
    public User grantXp(User user, int xpGained) {
        if (xpGained <= 0) {
            return user;
        }

        long updatedXp = user.getCurrentXp() + xpGained;
        user.setCurrentXp(updatedXp);

        int newLevel = calculateLevel(updatedXp);
        if (newLevel > user.getLevel()) {
            log.info("Parabéns! Usuário {} subiu para o nível {}", user.getEmail(), newLevel);
            user.setLevel(newLevel);
        }

        return userRepository.save(user);
    }

    /**
     * Fórmula de progressão de nível: Nível = (XP total / 500) + 1
     */
    public int calculateLevel(long totalXp) {
        return (int) (totalXp / XP_PER_LEVEL) + 1;
    }
}
