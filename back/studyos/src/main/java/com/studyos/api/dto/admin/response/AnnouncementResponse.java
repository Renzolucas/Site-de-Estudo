package com.studyos.api.dto.admin.response;

import com.studyos.api.model.Announcement;
import com.studyos.api.model.enums.AnnouncementAudience;

import java.time.LocalDateTime;

public record AnnouncementResponse(
        Long id,
        String title,
        String message,
        AnnouncementAudience audience,
        LocalDateTime createdAt,
        int recipientsCount,
        String authorName
) {
    public static AnnouncementResponse fromEntity(Announcement entity) {
        if (entity == null) return null;
        return new AnnouncementResponse(
                entity.getId(),
                entity.getTitle(),
                entity.getMessage(),
                entity.getAudience(),
                entity.getCreatedAt(),
                entity.getRecipientsCount(),
                entity.getAuthor() != null ? entity.getAuthor().getName() : "Administrador"
        );
    }
}
