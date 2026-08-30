package com.studyos.api.dto.task.request;

import com.studyos.api.model.enums.TaskStatus;
import jakarta.validation.constraints.NotNull;

public record TaskStatusUpdateRequest(
        @NotNull(message = "O status da tarefa é obrigatório")
        TaskStatus status
) {}
