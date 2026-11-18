package com.studyos.api.service.notification;

import com.studyos.api.dto.notification.response.NotificationResponse;
import com.studyos.api.dto.notification.response.UnreadCountResponse;
import com.studyos.api.exception.custom.ResourceNotFoundException;
import com.studyos.api.exception.custom.UnauthorizedException;
import com.studyos.api.model.Notification;
import com.studyos.api.model.Task;
import com.studyos.api.model.User;
import com.studyos.api.model.enums.NotificationType;
import com.studyos.api.model.enums.TaskStatus;
import com.studyos.api.repository.notification.NotificationRepository;
import com.studyos.api.repository.task.TaskRepository;
import com.studyos.api.repository.user.UserRepository;
import com.studyos.api.service.auth.JwtTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    public static final ZoneId APP_TIMEZONE = ZoneId.of("America/Sao_Paulo");
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final NotificationRepository notificationRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final JwtTokenService jwtTokenService;

    @Transactional
    public List<NotificationResponse> getNotifications(String authHeader, boolean unreadOnly, int limit) {
        User user = getAuthenticatedUser(authHeader);

        // Sincroniza lembretes antes de buscar
        syncTaskReminders(user);

        int sanitizedLimit = Math.min(Math.max(limit, 1), 100);
        Pageable pageable = PageRequest.of(0, sanitizedLimit);

        List<Notification> notifications;
        if (unreadOnly) {
            notifications = notificationRepository.findByUserIdAndReadAtIsNullOrderByCreatedAtDesc(user.getId(), pageable);
        } else {
            notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable);
        }

        return notifications.stream()
                .map(NotificationResponse::fromEntity)
                .toList();
    }

    @Transactional
    public UnreadCountResponse getUnreadCount(String authHeader) {
        User user = getAuthenticatedUser(authHeader);

        // Sincroniza lembretes antes de contar
        syncTaskReminders(user);

        long count = notificationRepository.countByUserIdAndReadAtIsNull(user.getId());
        return new UnreadCountResponse(count);
    }

    @Transactional
    public NotificationResponse markAsRead(String authHeader, Long id) {
        User user = getAuthenticatedUser(authHeader);

        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notificação não encontrada com o ID: " + id));

        // Notificação de outro usuário deve responder 404 (não 403)
        if (!notification.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Notificação não encontrada com o ID: " + id);
        }

        if (notification.getReadAt() == null) {
            notification.setReadAt(LocalDateTime.now(APP_TIMEZONE));
            notification = notificationRepository.save(notification);
        }

        return NotificationResponse.fromEntity(notification);
    }

    @Transactional
    public UnreadCountResponse markAllAsRead(String authHeader) {
        User user = getAuthenticatedUser(authHeader);

        notificationRepository.markAllAsReadByUserId(user.getId(), LocalDateTime.now(APP_TIMEZONE));
        return new UnreadCountResponse(0);
    }

    @Transactional
    public void deleteNotification(String authHeader, Long id) {
        User user = getAuthenticatedUser(authHeader);

        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notificação não encontrada com o ID: " + id));

        // Notificação de outro usuário deve responder 404 (não 403)
        if (!notification.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException("Notificação não encontrada com o ID: " + id);
        }

        notificationRepository.delete(notification);
    }

    /**
     * Sincroniza lembretes de tarefas: vencendo hoje/amanhã (TASK_DUE_SOON) ou atrasadas (TASK_OVERDUE).
     * Garante idempotência através de referenceKey e try-catch individual.
     */
    @Transactional
    public void syncTaskReminders(User user) {
        if (user == null || user.getId() == null) {
            return;
        }

        try {
            LocalDate today = LocalDate.now(APP_TIMEZONE);
            LocalDate tomorrow = today.plusDays(1);

            List<Task> pendingTasks = taskRepository.findByUserId(user.getId())
                    .stream()
                    .filter(t -> t.getStatus() != TaskStatus.COMPLETED && t.getEndDate() != null)
                    .toList();

            for (Task task : pendingTasks) {
                LocalDate endDate = task.getEndDate();

                if (endDate.isBefore(today)) {
                    // Tarefa atrasada
                    String refKey = "TASK_OVERDUE:" + task.getId();
                    if (!notificationRepository.existsByUserIdAndReferenceKey(user.getId(), refKey)) {
                        createNotificationSilently(
                                user,
                                NotificationType.TASK_OVERDUE,
                                "Tarefa em atraso",
                                "A tarefa '" + task.getTitle() + "' está atrasada desde " + endDate.format(DATE_FORMATTER) + ".",
                                refKey
                        );
                    }
                } else if (endDate.isEqual(today) || endDate.isEqual(tomorrow)) {
                    // Tarefa vencendo hoje ou amanhã
                    String refKey = "TASK_DUE_SOON:" + task.getId() + ":" + endDate;
                    if (!notificationRepository.existsByUserIdAndReferenceKey(user.getId(), refKey)) {
                        String dueText = endDate.isEqual(today) ? "hoje" : "amanhã";
                        createNotificationSilently(
                                user,
                                NotificationType.TASK_DUE_SOON,
                                "Tarefa vencendo em breve",
                                "A tarefa '" + task.getTitle() + "' vence " + dueText + " (" + endDate.format(DATE_FORMATTER) + ").",
                                refKey
                        );
                    }
                }
            }
        } catch (Exception e) {
            log.warn("[NOTIFICACOES] Falha não impeditiva ao sincronizar lembretes de tarefas para usuário {}: {}",
                    user.getEmail(), e.getMessage());
        }
    }

    /**
     * Criação segura de notificação em bloco try-catch silencioso.
     * NUNCA lança exceção para a ação chamadora.
     */
    @Transactional
    public Notification createNotificationSilently(User user, NotificationType type, String title, String message, String referenceKey) {
        try {
            if (user == null) {
                log.warn("[NOTIFICACOES] Tentativa de criar notificação para usuário nulo.");
                return null;
            }

            if (referenceKey != null && notificationRepository.existsByUserIdAndReferenceKey(user.getId(), referenceKey)) {
                log.debug("[NOTIFICACOES] Notificação com referenceKey {} já existe para o usuário {}.", referenceKey, user.getId());
                return null;
            }

            Notification notification = Notification.builder()
                    .user(user)
                    .type(type)
                    .title(title)
                    .message(message)
                    .createdAt(LocalDateTime.now(APP_TIMEZONE))
                    .readAt(null)
                    .referenceKey(referenceKey)
                    .build();

            return notificationRepository.save(notification);
        } catch (Exception e) {
            log.warn("[NOTIFICACOES] Falha não impeditiva ao criar notificação tipo {}: {}", type, e.getMessage());
            return null;
        }
    }

    public User getAuthenticatedUser(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Token de autorização não fornecido ou formato inválido.");
        }

        String token = authHeader.substring(7).trim();
        if (!jwtTokenService.validateToken(token)) {
            throw new UnauthorizedException("Token JWT inválido ou expirado.");
        }

        Long userId = jwtTokenService.extractUserId(token);
        if (userId != null) {
            return userRepository.findById(userId)
                    .orElseThrow(() -> new UnauthorizedException("Usuário do token não encontrado."));
        }

        String email = jwtTokenService.extractEmail(token);
        if (email != null) {
            return userRepository.findByEmail(email)
                    .orElseThrow(() -> new UnauthorizedException("Usuário do token não encontrado."));
        }

        throw new UnauthorizedException("Token inválido.");
    }
}
