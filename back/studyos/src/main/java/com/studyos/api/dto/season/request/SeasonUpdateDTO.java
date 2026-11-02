package com.studyos.api.dto.season.request;

import jakarta.validation.constraints.Size;

public record SeasonUpdateDTO(
        @Size(max = 100, message = "O título deve ter no máximo 100 caracteres")
        String title,

        String description
) {}
