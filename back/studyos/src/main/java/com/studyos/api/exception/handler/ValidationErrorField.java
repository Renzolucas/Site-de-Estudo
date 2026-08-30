package com.studyos.api.exception.handler;

public record ValidationErrorField(
        String field,
        String message
) {}
