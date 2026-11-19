package com.studyos.api.dto.admin.request;

import jakarta.validation.constraints.NotNull;

public record UpdateStatusRequest(
        @NotNull(message = "O status do usuário é obrigatório")
        Boolean active
) {}
