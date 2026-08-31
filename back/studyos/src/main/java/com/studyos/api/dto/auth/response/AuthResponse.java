package com.studyos.api.dto.auth.response;

import com.studyos.api.dto.user.response.UserResponse;

public record AuthResponse(
        String token,
        String tokenType,
        UserResponse user
) {
    public static AuthResponse of(String token, UserResponse user) {
        return new AuthResponse(token, "Bearer", user);
    }
}
