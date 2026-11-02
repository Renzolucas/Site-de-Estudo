package com.studyos.api.dto.task.request;

import com.studyos.api.model.enums.SeasonCode;
import com.studyos.api.model.enums.TaskCategory;
import jakarta.validation.constraints.AssertTrue;
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

        @Positive(message = "A duração planejada deve ser maior que 0 minutos")
        Integer plannedDurationMinutes,

        @Positive(message = "O tempo mínimo diário deve ser maior que 0 minutos")
        Integer dailyMinMinutes,

        @NotNull(message = "A data de início é obrigatória")
        LocalDate startDate,

        @NotNull(message = "A data de fim é obrigatória")
        LocalDate endDate,

        @PositiveOrZero(message = "O XP de recompensa deve ser positivo ou zero")
        Integer xpReward
) {
    @AssertTrue(message = "A data de fim não pode ser anterior à data de início")
    public boolean isDateRangeValid() {
        if (startDate == null || endDate == null) {
            return true;
        }
        return !endDate.isBefore(startDate);
    }

    public TaskCreateRequest(
            Long userId,
            String title,
            String description,
            TaskCategory category,
            SeasonCode season,
            Integer plannedDurationMinutes,
            LocalDate startDate,
            LocalDate endDate,
            Integer xpReward
    ) {
        this(userId, title, description, category, season, null, plannedDurationMinutes, plannedDurationMinutes, startDate, endDate, xpReward);
    }

    public TaskCreateRequest(
            Long userId,
            String title,
            String description,
            TaskCategory category,
            SeasonCode season,
            Long seasonId,
            Integer plannedDurationMinutes,
            LocalDate startDate,
            LocalDate endDate,
            Integer xpReward
    ) {
        this(userId, title, description, category, season, seasonId, plannedDurationMinutes, plannedDurationMinutes, startDate, endDate, xpReward);
    }
}
