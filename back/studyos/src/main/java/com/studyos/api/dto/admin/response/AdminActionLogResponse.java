package com.studyos.api.dto.admin.response;

import com.studyos.api.model.AdminActionLog;

import java.time.LocalDateTime;

public record AdminActionLogResponse(
        Long id,
        String actorName,
        String actorEmail,
        String targetUserName,
        String action,
        String details,
        LocalDateTime createdAt
) {
    public static AdminActionLogResponse fromEntity(AdminActionLog entity) {
        if (entity == null) return null;
        return new AdminActionLogResponse(
                entity.getId(),
                entity.getActor() != null ? entity.getActor().getName() : "Sistema",
                entity.getActor() != null ? entity.getActor().getEmail() : null,
                entity.getTargetUser() != null ? entity.getTargetUser().getName() : null,
                entity.getAction(),
                entity.getDetails(),
                entity.getCreatedAt()
        );
    }
}
