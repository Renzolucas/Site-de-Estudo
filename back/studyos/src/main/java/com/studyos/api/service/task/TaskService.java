package com.studyos.api.service.task;

import com.studyos.api.dto.task.request.TaskCreateRequest;
import com.studyos.api.dto.task.request.TaskUpdateRequest;
import com.studyos.api.dto.task.response.TaskResponse;
import com.studyos.api.exception.custom.ResourceNotFoundException;
import com.studyos.api.model.Season;
import com.studyos.api.model.Task;
import com.studyos.api.model.User;
import com.studyos.api.model.enums.SeasonCode;
import com.studyos.api.model.enums.TaskStatus;
import com.studyos.api.repository.task.TaskRepository;
import com.studyos.api.service.gamification.GamificationService;
import com.studyos.api.service.season.SeasonService;
import com.studyos.api.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserService userService;
    private final GamificationService gamificationService;
    private final SeasonService seasonService;

    @Transactional
    public TaskResponse create(TaskCreateRequest request) {
        User user = userService.findEntityById(request.userId());

        if (request.startDate() == null || request.endDate() == null) {
            throw new IllegalArgumentException("As datas de início e fim são obrigatórias.");
        }
        if (request.endDate().isBefore(request.startDate())) {
            throw new IllegalArgumentException("A data de fim não pode ser anterior à data de início.");
        }

        Season seasonEntity = null;
        if (request.seasonId() != null) {
            seasonEntity = seasonService.findEntityById(request.seasonId());
        } else if (request.season() != null) {
            seasonEntity = seasonService.getOrCreateSeasonByUserAndCode(user.getId(), request.season());
        }

        int minMinutes = request.dailyMinMinutes() != null
                ? request.dailyMinMinutes()
                : (request.plannedDurationMinutes() != null ? request.plannedDurationMinutes() : 30);
        int plannedMinutes = request.plannedDurationMinutes() != null
                ? request.plannedDurationMinutes()
                : minMinutes;

        int calculatedXp = request.xpReward() != null
                ? request.xpReward()
                : gamificationService.calculateTaskXp(plannedMinutes, request.category());

        Task task = Task.builder()
                .title(request.title())
                .description(request.description())
                .category(request.category())
                .seasonEntity(seasonEntity)
                .plannedDurationMinutes(plannedMinutes)
                .dailyMinMinutes(minMinutes)
                .actualDurationMinutes(0)
                .status(TaskStatus.PENDING)
                .streakProcessed(false)
                .startDate(request.startDate())
                .endDate(request.endDate())
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
    public List<TaskResponse> findByUserIdAndSeason(Long userId, SeasonCode season) {
        userService.findEntityById(userId);
        return taskRepository.findByUserIdAndSeason(userId, season)
                .stream()
                .map(TaskResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> findByUserIdAndSeasonId(Long userId, Long seasonId) {
        userService.findEntityById(userId);
        return taskRepository.findByUserIdAndSeasonId(userId, seasonId)
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

        if (request.title() != null && !request.title().isBlank()) {
            task.setTitle(request.title());
        }
        if (request.description() != null) {
            task.setDescription(request.description());
        }
        if (request.category() != null) {
            task.setCategory(request.category());
        }
        if (request.seasonId() != null) {
            Season seasonEntity = seasonService.findEntityById(request.seasonId());
            task.setSeasonEntity(seasonEntity);
        } else if (request.season() != null) {
            Season seasonEntity = seasonService.getOrCreateSeasonByUserAndCode(task.getUser().getId(), request.season());
            task.setSeasonEntity(seasonEntity);
        }
        if (request.dailyMinMinutes() != null && request.dailyMinMinutes() > 0) {
            task.setDailyMinMinutes(request.dailyMinMinutes());
        }
        if (request.plannedDurationMinutes() != null && request.plannedDurationMinutes() > 0) {
            task.setPlannedDurationMinutes(request.plannedDurationMinutes());
        }

        if (request.startDate() != null || request.endDate() != null) {
            LocalDate newStart = request.startDate() != null ? request.startDate() : task.getStartDate();
            LocalDate newEnd = request.endDate() != null ? request.endDate() : task.getEndDate();

            if (newStart != null && newEnd != null && newEnd.isBefore(newStart)) {
                throw new IllegalArgumentException("A data de fim não pode ser anterior à data de início.");
            }
            if (newStart != null) {
                task.setStartDate(newStart);
            }
            if (newEnd != null) {
                task.setEndDate(newEnd);
            }
        }

        if (request.xpReward() != null && request.xpReward() >= 0) {
            task.setXpReward(request.xpReward());
        }

        Task updatedTask = taskRepository.save(task);
        return TaskResponse.fromEntity(updatedTask);
    }

    @Transactional
    public TaskResponse updateStatus(Long id, TaskStatus newStatus) {
        Task task = findEntityById(id);

        if (newStatus == TaskStatus.COMPLETED) {
            gamificationService.processLessonCompletion(task);
        } else {
            task.setStatus(newStatus);
            taskRepository.save(task);
        }

        return TaskResponse.fromEntity(task);
    }

    @Transactional
    public void delete(Long id) {
        Task task = findEntityById(id);
        taskRepository.delete(task);
    }
}
