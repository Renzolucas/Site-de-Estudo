package com.studyos.api.dto.auth.response;

public record VerifyResetCodeResponse(
        String message,
        boolean valid
) {}
