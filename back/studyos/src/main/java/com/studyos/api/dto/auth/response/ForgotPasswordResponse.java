package com.studyos.api.dto.auth.response;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ForgotPasswordResponse(
        String message,
        String demoCode
) {
    public static ForgotPasswordResponse of(String message) {
        return new ForgotPasswordResponse(message, null);
    }

    public static ForgotPasswordResponse of(String message, String demoCode) {
        return new ForgotPasswordResponse(message, demoCode);
    }
}
