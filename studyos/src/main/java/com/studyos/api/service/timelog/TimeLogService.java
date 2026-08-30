package com.studyos.api.service.timelog;

import com.studyos.api.dto.timelog.request.TimeLogCreateRequest;
import com.studyos.api.dto.timelog.response.TimeLogResponse;
import com.studyos.api.exception.custom.ResourceNotFoundException;
import com.studyos.api.model.Task;
import com.studyos.api.model.TimeLog;
import com.studyos.api.model.User;
import com.studyos.api.model.enums.CompletionStatus;
import com.studyos.api.model.enums.TaskStatus;
import com.studyos.api.repository.task.TaskRepository;
import com.studyos.api.repository.timelog.TimeLogRepository;
import com.studyos.api.service.gamification.GamificationService;
import com.studyos.api.service.task.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TimeLogService {

    private final TimeLogRepository timeLogRepository;
    private final TaskService taskService;
    private final TaskRepository taskRepository;
    private final GamificationService gamificationService;

    @Transactional
    public TimeLogResponse logTime(TimeLogCreateRequest request) {
        Task task = taskService.findEntityById(request.taskId());
        User user = task.getUser();

        TimeLog timeLog = TimeLog.builder()
                .task(task)
                .loggedDurationMinutes(request.loggedDurationMinutes())
                .completionStatus(request.completionStatus())
                .notes(request.notes())
                .build();

        TimeLog savedTimeLog = timeLogRepository.save(timeLog);

        // Atualiza a duracao real acumulada na tarefa
        int updatedActualDuration = (task.getActualDurationMinutes() != null ? task.getActualDurationMinutes() : 0)
                + request.loggedDurationMinutes();
        task.setActualDurationMinutes(updatedActualDuration);

        // Se a sessao foi COMPLETED e a tarefa ainda estava pendente/em progresso, atualiza a tarefa
        if (request.completionStatus() == CompletionStatus.COMPLETED && task.getStatus() != TaskStatus.COMPLETED) {
            task.setStatus(TaskStatus.COMPLETED);
            if (task.getXpReward() != null && task.getXpReward() > 0) {
                gamificationService.grantXp(user, task.getXpReward());
            }
        } else if (task.getStatus() == TaskStatus.PENDING) {
            task.setStatus(TaskStatus.IN_PROGRESS);
        }

        taskRepository.save(task);

        // Concede XP pelo tempo de foco registrado
        int sessionXp = gamificationService.calculateTimeLogXp(request.loggedDurationMinutes(), request.completionStatus());
        gamificationService.grantXp(user, sessionXp);

        return TimeLogResponse.fromEntity(savedTimeLog);
    }

    @Transactional(readOnly = true)
    public TimeLogResponse findById(Long id) {
        TimeLog timeLog = timeLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Registro de tempo não encontrado com o ID: " + id));
        return TimeLogResponse.fromEntity(timeLog);
    }

    @Transactional(readOnly = true)
    public List<TimeLogResponse> findByTaskId(Long taskId) {
        taskService.findEntityById(taskId); // Valida existencia da tarefa
        return timeLogRepository.findByTaskId(taskId)
                .stream()
                .map(TimeLogResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TimeLogResponse> findByUserId(Long userId) {
        return timeLogRepository.findByTaskUserId(userId)
                .stream()
                .map(TimeLogResponse::fromEntity)
                .toList();
    }

    @Transactional
    public void delete(Long id) {
        TimeLog timeLog = timeLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Registro de tempo não encontrado com o ID: " + id));
        timeLogRepository.delete(timeLog);
    }
}
