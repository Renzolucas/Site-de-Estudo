package com.studyos.api.dto.timelog.request;

import com.studyos.api.model.enums.CompletionStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record TimeLogCreateRequest(
        @NotNull(message = "O ID da tarefa é obrigatório")
        Long taskId,

        @NotNull(message = "A duração da sessão em minutos é obrigatória")
        @Positive(message = "A duração registrada deve ser maior que 0 minutos")
        Integer loggedDurationMinutes,

        @NotNull(message = "O status de conclusão da sessão é obrigatório")
        CompletionStatus completionStatus,

        String notes
) {}
