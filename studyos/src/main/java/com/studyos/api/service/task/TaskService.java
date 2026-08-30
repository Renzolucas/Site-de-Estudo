package com.studyos.api.service.task;

import com.studyos.api.dto.task.request.TaskCreateRequest;
import com.studyos.api.dto.task.request.TaskUpdateRequest;
import com.studyos.api.dto.task.response.TaskResponse;
import com.studyos.api.exception.custom.ResourceNotFoundException;
import com.studyos.api.model.Task;
import com.studyos.api.model.User;
import com.studyos.api.model.enums.Season;
import com.studyos.api.model.enums.TaskStatus;
import com.studyos.api.repository.task.TaskRepository;
import com.studyos.api.service.gamification.GamificationService;
import com.studyos.api.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserService userService;
    private final GamificationService gamificationService;

    @Transactional
    public TaskResponse create(TaskCreateRequest request) {
        User user = userService.findEntityById(request.userId());

        int calculatedXp = request.xpReward() != null && request.xpReward() > 0
                ? request.xpReward()
                : gamificationService.calculateTaskXp(request.plannedDurationMinutes(), request.category());

        Task task = Task.builder()
                .title(request.title())
                .description(request.description())
                .category(request.category())
                .season(request.season())
                .plannedDurationMinutes(request.plannedDurationMinutes())
                .actualDurationMinutes(0)
                .status(TaskStatus.PENDING)
                .targetDate(request.targetDate())
                .xpReward(calculatedXp)
                .user(user)
                .build();

        Task savedTask = taskRepository.save(task);
        return TaskResponse.fromEntity(savedTask);
    }

    @Transactional(readOnly = true)
    public TaskResponse findById(Long id) {
        Task task = findEntityById(id);
        return TaskResponse.fromEntity(task);
    }

    @Transactional(readOnly = true)
    public Task findEntityById(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tarefa não encontrada com o ID: " + id));
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> findByUserId(Long userId) {
        userService.findEntityById(userId); // Valida existência do usuário
        return taskRepository.findByUserId(userId)
                .stream()
                .map(TaskResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> findByUserIdAndSeason(Long userId, Season season) {
        userService.findEntityById(userId);
        return taskRepository.findByUserIdAndSeason(userId, season)
                .stream()
                .map(TaskResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> findByUserIdAndStatus(Long userId, TaskStatus status) {
        userService.findEntityById(userId);
        return taskRepository.findByUserIdAndStatus(userId, status)
                .stream()
                .map(TaskResponse::fromEntity)
                .toList();
    }

    @Transactional
    public TaskResponse update(Long id, TaskUpdateRequest request) {
        Task task = findEntityById(id);

        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setCategory(request.category());
        task.setSeason(request.season());
        task.setPlannedDurationMinutes(request.plannedDurationMinutes());
        task.setTargetDate(request.targetDate());

        if (request.xpReward() != null && request.xpReward() > 0) {
            task.setXpReward(request.xpReward());
        }

        Task updatedTask = taskRepository.save(task);
        return TaskResponse.fromEntity(updatedTask);
    }

    @Transactional
    public TaskResponse updateStatus(Long id, TaskStatus newStatus) {
        Task task = findEntityById(id);
        TaskStatus previousStatus = task.getStatus();

        task.setStatus(newStatus);

        // Se a tarefa foi marcada como COMPLETED pela primeira vez, concede XP de recompensa
        if (newStatus == TaskStatus.COMPLETED && previousStatus != TaskStatus.COMPLETED) {
            int reward = task.getXpReward() != null ? task.getXpReward() : 20;
            gamificationService.grantXp(task.getUser(), reward);
        }

        Task updatedTask = taskRepository.save(task);
        return TaskResponse.fromEntity(updatedTask);
    }

    @Transactional
    public void delete(Long id) {
        Task task = findEntityById(id);
        taskRepository.delete(task);
    }
}
