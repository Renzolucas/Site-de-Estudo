package com.studyos.api.service.user;

import com.studyos.api.dto.gamification.response.LeaderboardUserResponse;
import com.studyos.api.dto.gamification.response.StudyStatsResponse;
import com.studyos.api.dto.user.request.UserRegisterRequest;
import com.studyos.api.dto.user.request.UserUpdateRequest;
import com.studyos.api.dto.user.response.UserResponse;
import com.studyos.api.exception.custom.BusinessRuleException;
import com.studyos.api.exception.custom.ResourceNotFoundException;
import com.studyos.api.model.User;
import com.studyos.api.model.enums.TaskStatus;
import com.studyos.api.repository.task.TaskRepository;
import com.studyos.api.repository.timelog.TimeLogRepository;
import com.studyos.api.repository.user.UserRepository;
import com.studyos.api.service.gamification.GamificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final TimeLogRepository timeLogRepository;
    private final GamificationService gamificationService;

    @Transactional
    public UserResponse register(UserRegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BusinessRuleException("O e-mail informado já está cadastrado.");
        }

        User user = User.builder()
                .name(request.name())
                .email(request.email())
                .password(request.password())
                .level(1)
                .currentXp(0L)
                .streakDays(0)
                .frozenCount(0)
                .build();

        User savedUser = userRepository.save(user);
        return UserResponse.fromEntity(savedUser);
    }

    @Transactional
    public UserResponse findById(Long id) {
        User user = findEntityById(id);
        if (user.getStreakDays() == null || user.getStreakDays() == 0 || user.getFrozenCount() == null || (user.getStreakDays() >= 30 && (user.getFrozenCount() == null || user.getFrozenCount() == 0))) {
            User synced = gamificationService.syncStreakFromValidTaskHistory(id);
            if (synced != null) {
                user = synced;
            }
        }
        return UserResponse.fromEntity(user);
    }

    @Transactional(readOnly = true)
    public User findEntityById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado com o ID: " + id));
    }

    @Transactional
    public UserResponse update(Long id, UserUpdateRequest request) {
        User user = findEntityById(id);
        user.setName(request.name());
        User updated = userRepository.save(user);
        return UserResponse.fromEntity(updated);
    }

    @Transactional(readOnly = true)
    public List<LeaderboardUserResponse> getLeaderboard() {
        return userRepository.findTop10ByOrderByCurrentXpDesc()
                .stream()
                .map(LeaderboardUserResponse::fromEntity)
                .toList();
    }

    @Transactional
    public StudyStatsResponse getUserStats(Long userId) {
        User user = findEntityById(userId);
        if (user.getStreakDays() == null || user.getStreakDays() == 0 || user.getFrozenCount() == null || (user.getStreakDays() >= 30 && (user.getFrozenCount() == null || user.getFrozenCount() == 0))) {
            User synced = gamificationService.syncStreakFromValidTaskHistory(userId);
            if (synced != null) {
                user = synced;
            }
        }
        Long totalStudyMinutes = timeLogRepository.sumTotalStudyMinutesByUserId(userId);
        long completedTasks = taskRepository.countByUserIdAndStatus(userId, TaskStatus.COMPLETED);

        return new StudyStatsResponse(
                totalStudyMinutes != null ? totalStudyMinutes : 0L,
                completedTasks,
                user.getStreakDays(),
                user.getCurrentXp(),
                user.getLevel(),
                user.getFrozenCount() != null ? user.getFrozenCount() : 0
        );
    }
}
