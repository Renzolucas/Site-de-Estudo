package com.studyos.api.controller.notification;

import com.studyos.api.dto.notification.response.NotificationResponse;
import com.studyos.api.dto.notification.response.UnreadCountResponse;
import com.studyos.api.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(value = "unreadOnly", defaultValue = "false") boolean unreadOnly,
            @RequestParam(value = "limit", defaultValue = "50") int limit) {
        return ResponseEntity.ok(notificationService.getNotifications(authHeader, unreadOnly, limit));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<UnreadCountResponse> getUnreadCount(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        return ResponseEntity.ok(notificationService.getUnreadCount(authHeader));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        return ResponseEntity.ok(notificationService.markAsRead(authHeader, id));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<UnreadCountResponse> markAllAsRead(
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        return ResponseEntity.ok(notificationService.markAllAsRead(authHeader));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id) {
        notificationService.deleteNotification(authHeader, id);
        return ResponseEntity.noContent().build();
    }
}
