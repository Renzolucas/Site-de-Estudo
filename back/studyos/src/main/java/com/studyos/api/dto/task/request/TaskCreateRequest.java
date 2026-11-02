package com.studyos.api.dto.task.request;

import com.studyos.api.model.enums.SeasonCode;
import com.studyos.api.model.enums.TaskCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record TaskCreateRequest(
        @NotNull(message = "O ID do usuário é obrigatório")
        Long userId,

        @NotBlank(message = "O título da tarefa é obrigatório")
        @Size(max = 200, message = "O título deve ter no máximo 200 caracteres")
        String title,

        String description,

        @NotNull(message = "A categoria da tarefa é obrigatória")
        TaskCategory category,

        SeasonCode season,

        Long seasonId,

        @NotNull(message = "A duração planejada em minutos é obrigatória")
        @Positive(message = "A duração planejada deve ser maior que 0 minutos")
        Integer plannedDurationMinutes,

        LocalDate targetDate,

        @PositiveOrZero(message = "O XP de recompensa deve ser positivo ou zero")
        Integer xpReward
) {
    public TaskCreateRequest(
            Long userId,
            String title,
            String description,
            TaskCategory category,
            SeasonCode season,
            Integer plannedDurationMinutes,
            LocalDate targetDate,
            Integer xpReward
    ) {
        this(userId, title, description, category, season, null, plannedDurationMinutes, targetDate, xpReward);
    }
}
