package com.studyos.api.dto.task.request;

import com.studyos.api.model.enums.Season;
import com.studyos.api.model.enums.TaskCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record TaskUpdateRequest(
        @NotBlank(message = "O título da tarefa é obrigatório")
        @Size(max = 200, message = "O título deve ter no máximo 200 caracteres")
        String title,

        String description,

        @NotNull(message = "A categoria da tarefa é obrigatória")
        TaskCategory category,

        @NotNull(message = "A estação do ano é obrigatória")
        Season season,

        @NotNull(message = "A duração planejada em minutos é obrigatória")
        @Positive(message = "A duração planejada deve ser maior que 0 minutos")
        Integer plannedDurationMinutes,

        LocalDate targetDate,

        @PositiveOrZero(message = "O XP de recompensa deve ser positivo ou zero")
        Integer xpReward
) {}
