package com.studyos.api.exception.handler;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.LocalDateTime;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
        int status,
        String error,
        String message,
        String path,
        LocalDateTime timestamp,
        List<ValidationErrorField> errors
) {
    public static ErrorResponse of(int status, String error, String message, String path) {
        return new ErrorResponse(status, error, message, path, LocalDateTime.now(), null);
    }

    public static ErrorResponse ofValidation(int status, String error, String message, String path, List<ValidationErrorField> errors) {
        return new ErrorResponse(status, error, message, path, LocalDateTime.now(), errors);
    }
}
