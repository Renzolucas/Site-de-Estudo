package com.studyos.api.exception.custom;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.FORBIDDEN)
public class ForbiddenException extends RuntimeException {

    private final String errorCode;

    public ForbiddenException(String message) {
        super(message);
        this.errorCode = "FORBIDDEN";
    }

    public ForbiddenException(String errorCode, String message) {
        super(message);
        this.errorCode = errorCode != null ? errorCode : "FORBIDDEN";
    }

    public String getErrorCode() {
        return errorCode;
    }
}
