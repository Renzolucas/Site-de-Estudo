package com.studyos.api.dto.notification.response;

import com.studyos.api.model.Notification;
import com.studyos.api.model.enums.NotificationType;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        NotificationType type,
        String title,
        String message,
        LocalDateTime createdAt,
        LocalDateTime readAt,
        boolean read,
        String referenceKey
) {
    public static NotificationResponse fromEntity(Notification entity) {
        if (entity == null) {
            return null;
        }
        return new NotificationResponse(
                entity.getId(),
                entity.getType(),
                entity.getTitle(),
                entity.getMessage(),
                entity.getCreatedAt(),
                entity.getReadAt(),
                entity.getReadAt() != null,
                entity.getReferenceKey()
        );
    }
}
