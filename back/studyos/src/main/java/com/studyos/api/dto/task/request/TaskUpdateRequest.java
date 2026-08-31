package com.studyos.api.dto.task.request;

import com.studyos.api.model.enums.Season;
import com.studyos.api.model.enums.TaskCategory;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record TaskUpdateRequest(
        @Size(max = 200, message = "O título deve ter no máximo 200 caracteres")
        String title,

        String description,

        TaskCategory category,

        Season season,

        @Positive(message = "A duração planejada deve ser maior que 0 minutos")
        Integer plannedDurationMinutes,

        LocalDate targetDate,

        @PositiveOrZero(message = "O XP de recompensa deve ser positivo ou zero")
        Integer xpReward
) {}
