package com.studyos.api.dto.admin.request;

import com.studyos.api.model.enums.UserRole;
import jakarta.validation.constraints.NotNull;

public record UpdateRoleRequest(
        @NotNull(message = "O papel do usuário é obrigatório")
        UserRole role
) {}
