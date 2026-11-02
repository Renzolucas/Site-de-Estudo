package com.studyos.api.dto.season.response;

import com.studyos.api.model.Season;
import com.studyos.api.model.enums.SeasonCode;

public record SeasonResponse(
        Long id,
        SeasonCode code,
        String title,
        String description,
        String quarter,
        Long userId
) {
    public static SeasonResponse fromEntity(Season season) {
        return new SeasonResponse(
                season.getId(),
                season.getCode(),
                season.getTitle(),
                season.getDescription(),
                season.getQuarter(),
                season.getUser() != null ? season.getUser().getId() : null
        );
    }
}
