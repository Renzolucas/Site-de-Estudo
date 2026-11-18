package com.studyos.api.dto.auth.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank(message = "O e-mail é obrigatório")
        @Email(message = "Formato de e-mail inválido")
        String email,

        @NotBlank(message = "O código é obrigatório")
        @Pattern(regexp = "^\\d{6}$", message = "O código deve conter exatamente 6 dígitos")
        String code,

        @NotBlank(message = "A nova senha é obrigatória")
        @Size(min = 6, max = 100, message = "A senha deve ter no mínimo 6 caracteres")
        String newPassword
) {}
