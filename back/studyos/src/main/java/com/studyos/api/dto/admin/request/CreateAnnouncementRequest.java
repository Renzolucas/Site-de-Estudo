package com.studyos.api.dto.admin.request;

import com.studyos.api.model.enums.AnnouncementAudience;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateAnnouncementRequest(
        @NotBlank(message = "O título é obrigatório")
        @Size(min = 3, max = 80, message = "O título deve ter entre 3 e 80 caracteres")
        String title,

        @NotBlank(message = "A mensagem é obrigatória")
        @Size(min = 5, max = 300, message = "A mensagem deve ter entre 5 e 300 caracteres")
        String message,

        @NotNull(message = "O público-alvo é obrigatório")
        AnnouncementAudience audience
) {}
