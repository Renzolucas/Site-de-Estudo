package com.studyos.api.service.gamification;

import com.studyos.api.model.Task;
import com.studyos.api.model.User;
import com.studyos.api.model.enums.CompletionStatus;
import com.studyos.api.model.enums.TaskCategory;
import com.studyos.api.model.enums.TaskStatus;
import com.studyos.api.repository.task.TaskRepository;
import com.studyos.api.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class GamificationService {

    public static final ZoneId APP_TIMEZONE = ZoneId.of("America/Sao_Paulo");

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;

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

    /**
     * Processa a conclusão de uma lição (Task) aplicando rigorosamente as regras de negócio:
     * 1. Se XP > 0: usuário ganha +1 dia de streak.
     * 2. Se XP == 0: o streak NÃO aumenta.
     * 3. Idempotente: evita duplicações por reload, double-submit ou retry (streakProcessed).
     * 4. A cada 30 dias de streak (30, 60, 90, ...), concede +1 Frozen persistido no banco.
     */
    @Transactional
    public User processLessonCompletion(Task task) {
        if (task == null) {
            throw new IllegalArgumentException("Tarefa não pode ser nula");
        }

        User user = task.getUser();
        if (user == null) {
            throw new IllegalArgumentException("Usuário vinculado à tarefa não pode ser nulo");
        }

        // Se a conclusão desta lição já foi processada anteriormente, é uma chamada duplicada
        if (Boolean.TRUE.equals(task.getStreakProcessed())) {
            log.info("Conclusão da tarefa #{} já havia sido processada. Operação idempotente preservada.", task.getId());
            return user;
        }

        int xpReward = task.getXpReward() != null ? task.getXpReward() : 0;

        if (xpReward > 0) {
            // Concede XP e recalcula nível
            grantXp(user, xpReward);

            // Regra 1: Se a lição conceder XP > 0: +1 streak
            int oldStreak = user.getStreakDays() != null ? user.getStreakDays() : 0;
            int newStreak = oldStreak + 1;
            user.setStreakDays(newStreak);
            user.setLastStreakDate(LocalDate.now(APP_TIMEZONE));

            // Regra 4: A cada 30 dias consecutivos (30, 60, 90, ...): +1 Frozen
            int oldMilestones = oldStreak / 30;
            int newMilestones = newStreak / 30;
            if (newMilestones > oldMilestones) {
                int earnedFrozen = newMilestones - oldMilestones;
                int currentFrozen = user.getFrozenCount() != null ? user.getFrozenCount() : 0;
                user.setFrozenCount(currentFrozen + earnedFrozen);
                log.info("Usuário {} atingiu {} dias de streak e recebeu {} Frozen! Total: {}",
                        user.getEmail(), newStreak, earnedFrozen, user.getFrozenCount());
            }
        } else {
            // Regra 1: Se a lição conceder 0 XP: NÃO deve aumentar o streak
            log.info("Tarefa #{} concedeu 0 XP. Streak do usuário {} permaneceu inalterado.",
                    task.getId(), user.getEmail());
        }

        // Marca a lição como concluída e processada para evitar duplicações
        task.setStatus(TaskStatus.COMPLETED);
        task.setStreakProcessed(true);
        if (task.getCompletedAt() == null) {
            task.setCompletedAt(LocalDateTime.now(APP_TIMEZONE));
        }

        taskRepository.save(task);
        return userRepository.save(user);
    }

    /**
     * Sincroniza e reconcilia o streak de um usuário a partir do histórico real de lições/tarefas
     * concluídas com XP > 0, corrigindo inconsistências de dados legados (ex: 912 XP mas streak 0)
     * sem usar fórmulas arbitrárias puramente baseadas em XP total.
     */
    @Transactional
    public User syncStreakFromValidTaskHistory(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return null;
        }

        List<Task> completedTasks = taskRepository.findByUserIdAndStatus(userId, TaskStatus.COMPLETED);
        long validLessonsCount = 0;

        for (Task task : completedTasks) {
            int xp = task.getXpReward() != null ? task.getXpReward() : 0;
            if (xp > 0) {
                validLessonsCount++;
            }
            if (!Boolean.TRUE.equals(task.getStreakProcessed())) {
                task.setStreakProcessed(true);
                if (task.getCompletedAt() == null) {
                    task.setCompletedAt(LocalDateTime.now(APP_TIMEZONE));
                }
                taskRepository.save(task);
            }
        }

        int currentStreak = user.getStreakDays() != null ? user.getStreakDays() : 0;
        int currentFrozen = user.getFrozenCount() != null ? user.getFrozenCount() : 0;
        int targetStreak = Math.max(currentStreak, (int) validLessonsCount);
        int targetFrozen = Math.max(currentFrozen, targetStreak / 30);

        boolean changed = false;
        if (user.getStreakDays() == null || user.getStreakDays() != targetStreak) {
            user.setStreakDays(targetStreak);
            changed = true;
        }
        if (user.getFrozenCount() == null || user.getFrozenCount() != targetFrozen) {
            user.setFrozenCount(targetFrozen);
            changed = true;
        }

        if (changed) {
            user = userRepository.save(user);
            log.info("Streak sincronizado com sucesso para usuário {}: {} dias válidos, {} Frozen.",
                    user.getEmail(), user.getStreakDays(), user.getFrozenCount());
        }

        return user;
    }
}
