package com.studyos.api.service.admin;

import com.studyos.api.dto.admin.request.CreateAnnouncementRequest;
import com.studyos.api.dto.admin.request.CreateUserRequest;
import com.studyos.api.dto.admin.request.UpdateMentorRequest;
import com.studyos.api.dto.admin.request.UpdateRoleRequest;
import com.studyos.api.dto.admin.request.UpdateStatusRequest;
import com.studyos.api.dto.admin.response.AdminActionLogResponse;
import com.studyos.api.dto.admin.response.AdminMentorSummaryResponse;
import com.studyos.api.dto.admin.response.AdminOverviewResponse;
import com.studyos.api.dto.admin.response.AdminUserResponse;
import com.studyos.api.dto.admin.response.AnnouncementResponse;
import com.studyos.api.exception.custom.BusinessRuleException;
import com.studyos.api.exception.custom.ResourceNotFoundException;
import com.studyos.api.model.AdminActionLog;
import com.studyos.api.model.Announcement;
import com.studyos.api.model.Notification;
import com.studyos.api.model.User;
import com.studyos.api.model.enums.AnnouncementAudience;
import com.studyos.api.model.enums.NotificationType;
import com.studyos.api.model.enums.TaskStatus;
import com.studyos.api.model.enums.UserRole;
import com.studyos.api.repository.admin.AdminActionLogRepository;
import com.studyos.api.repository.announcement.AnnouncementRepository;
import com.studyos.api.repository.task.TaskRepository;
import com.studyos.api.repository.timelog.TimeLogRepository;
import com.studyos.api.repository.user.UserRepository;
import com.studyos.api.service.auth.CurrentUserService;
import com.studyos.api.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private static final ZoneId APP_TIMEZONE = ZoneId.of("America/Sao_Paulo");

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final TimeLogRepository timeLogRepository;
    private final AnnouncementRepository announcementRepository;
    private final AdminActionLogRepository adminActionLogRepository;
    private final NotificationService notificationService;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public AdminOverviewResponse getOverview(String authHeader) {
        currentUserService.requireRole(authHeader, UserRole.ADMIN);

        long studentsCount = userRepository.countByRole(UserRole.STUDENT);
        long mentorsCount = userRepository.countByRole(UserRole.MENTOR);
        long adminsCount = userRepository.countByRole(UserRole.ADMIN);

        long activeUsersCount = userRepository.countByActive(true);
        long inactiveUsersCount = userRepository.countByActive(false);

        long studentsWithoutMentorCount = userRepository.countByRoleAndMentorIsNull(UserRole.STUDENT);

        long totalTasks = taskRepository.count();
        long completedTasks = taskRepository.countByStatus(TaskStatus.COMPLETED);

        Long totalStudyMinutes = timeLogRepository.sumTotalStudyMinutes();
        if (totalStudyMinutes == null) totalStudyMinutes = 0L;

        long totalAnnouncements = announcementRepository.count();

        List<AdminActionLogResponse> recentActions = adminActionLogRepository.findTop8ByOrderByCreatedAtDesc()
                .stream()
                .map(AdminActionLogResponse::fromEntity)
                .toList();

        return new AdminOverviewResponse(
                studentsCount,
                mentorsCount,
                adminsCount,
                activeUsersCount,
                inactiveUsersCount,
                studentsWithoutMentorCount,
                totalTasks,
                completedTasks,
                totalStudyMinutes,
                totalAnnouncements,
                recentActions
        );
    }

    @Transactional(readOnly = true)
    public List<AdminUserResponse> getUsers(String authHeader, String search, UserRole role, String status, Boolean noMentor) {
        currentUserService.requireRole(authHeader, UserRole.ADMIN);

        String sanitizedSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        Boolean activeFilter = null;
        if ("active".equalsIgnoreCase(status) || "true".equalsIgnoreCase(status)) {
            activeFilter = true;
        } else if ("inactive".equalsIgnoreCase(status) || "false".equalsIgnoreCase(status)) {
            activeFilter = false;
        }

        Pageable pageable = PageRequest.of(0, 100);
        List<User> users = userRepository.findUsersWithFilters(sanitizedSearch, role, activeFilter, noMentor, pageable);

        return users.stream()
                .map(AdminUserResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AdminMentorSummaryResponse> getActiveMentors(String authHeader) {
        currentUserService.requireRole(authHeader, UserRole.ADMIN);

        return userRepository.findByRoleAndActiveTrueOrderByNameAsc(UserRole.MENTOR)
                .stream()
                .map(AdminMentorSummaryResponse::fromEntity)
                .toList();
    }

    @Transactional
    public AdminUserResponse createUser(String authHeader, CreateUserRequest request) {
        User admin = currentUserService.requireRole(authHeader, UserRole.ADMIN);

        String email = request.email() != null ? request.email().trim().toLowerCase() : "";
        if (userRepository.existsByEmail(email)) {
            throw new BusinessRuleException("O e-mail informado já está cadastrado.");
        }

        if (request.password() == null || request.password().length() < 6) {
            throw new BusinessRuleException("A senha deve ter no mínimo 6 caracteres.");
        }

        User selectedMentor = null;
        if (request.mentorId() != null) {
            if (request.role() != UserRole.STUDENT) {
                throw new BusinessRuleException("Vínculo de mentor só é permitido para estudantes.");
            }
            selectedMentor = userRepository.findById(request.mentorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Mentor não encontrado."));
            if (selectedMentor.getRole() != UserRole.MENTOR || Boolean.FALSE.equals(selectedMentor.getActive())) {
                throw new BusinessRuleException("O mentor selecionado deve ser um professor/mentor ativo.");
            }
        }

        User newUser = User.builder()
                .name(request.name().trim())
                .email(email)
                .password(request.password())
                .role(request.role())
                .active(true)
                .mentor(selectedMentor)
                .level(1)
                .currentXp(0L)
                .streakDays(0)
                .frozenCount(0)
                .build();

        User savedUser = userRepository.save(newUser);

        // Gera notificação WELCOME como no cadastro
        notificationService.createNotificationSilently(
                savedUser,
                NotificationType.WELCOME,
                "Bem-vindo ao StudyOS!",
                "Sua jornada de estudos e organização começa agora. Defina seus objetivos e acompanhe sua evolução!",
                null
        );

        // Registra ação administrativa
        recordAction(
                admin,
                savedUser,
                "CREATE_USER",
                String.format("Criou usuário %s (%s) com papel %s", savedUser.getName(), savedUser.getEmail(), savedUser.getRole())
        );

        return AdminUserResponse.fromEntity(savedUser);
    }

    @Transactional
    public AdminUserResponse updateUserRole(String authHeader, Long targetUserId, UpdateRoleRequest request) {
        User admin = currentUserService.requireRole(authHeader, UserRole.ADMIN);

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

        // O administrador não pode alterar o próprio papel
        if (targetUser.getId().equals(admin.getId())) {
            throw new BusinessRuleException("O administrador não pode alterar o próprio papel.");
        }

        // O último administrador ativo não pode ser rebaixado
        if (targetUser.getRole() == UserRole.ADMIN && request.role() != UserRole.ADMIN) {
            long activeAdmins = userRepository.countByRoleAndActiveTrue(UserRole.ADMIN);
            if (activeAdmins <= 1) {
                throw new BusinessRuleException("O último administrador ativo não pode ser rebaixado.");
            }
        }

        UserRole oldRole = targetUser.getRole();

        // Se um MENTOR deixar de ser mentor, os alunos dele ficam sem mentor
        if (oldRole == UserRole.MENTOR && request.role() != UserRole.MENTOR) {
            List<User> students = userRepository.findByMentorId(targetUser.getId());
            if (!students.isEmpty()) {
                students.forEach(s -> s.setMentor(null));
                userRepository.saveAll(students);
                log.info("[ADMIN] {} alunos desvinculados do mentor demovido {}", students.size(), targetUser.getEmail());
            }
        }

        // Se um STUDENT virar outro papel, o mentor dele é limpo
        if (oldRole == UserRole.STUDENT && request.role() != UserRole.STUDENT) {
            targetUser.setMentor(null);
        }

        targetUser.setRole(request.role());
        User savedUser = userRepository.save(targetUser);

        recordAction(
                admin,
                savedUser,
                "UPDATE_ROLE",
                String.format("Alterou papel de %s de %s para %s", savedUser.getName(), oldRole, savedUser.getRole())
        );

        return AdminUserResponse.fromEntity(savedUser);
    }

    @Transactional
    public AdminUserResponse updateUserStatus(String authHeader, Long targetUserId, UpdateStatusRequest request) {
        User admin = currentUserService.requireRole(authHeader, UserRole.ADMIN);

        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado."));

        // O administrador não pode desativar a si mesmo
        if (targetUser.getId().equals(admin.getId()) && Boolean.FALSE.equals(request.active())) {
            throw new BusinessRuleException("O administrador não pode desativar a própria conta.");
        }

        // O último administrador ativo não pode ser desativado
        if (targetUser.getRole() == UserRole.ADMIN && Boolean.FALSE.equals(request.active())) {
            long activeAdmins = userRepository.countByRoleAndActiveTrue(UserRole.ADMIN);
            if (activeAdmins <= 1) {
                throw new BusinessRuleException("O último administrador ativo não pode ser desativado.");
            }
        }

        targetUser.setActive(request.active());
        User savedUser = userRepository.save(targetUser);

        recordAction(
                admin,
                savedUser,
                "UPDATE_STATUS",
                String.format("%s usuário %s (%s)", Boolean.TRUE.equals(request.active()) ? "Ativou" : "Desativou", savedUser.getName(), savedUser.getEmail())
        );

        return AdminUserResponse.fromEntity(savedUser);
    }

    @Transactional
    public AdminUserResponse updateUserMentor(String authHeader, Long studentId, UpdateMentorRequest request) {
        User admin = currentUserService.requireRole(authHeader, UserRole.ADMIN);

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Estudante não encontrado."));

        if (student.getRole() != UserRole.STUDENT) {
            throw new BusinessRuleException("Vínculo de mentor só pode ser atribuído a estudantes.");
        }

        String logDetails;
        if (request != null && request.mentorId() != null) {
            User mentor = userRepository.findById(request.mentorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Mentor não encontrado."));

            if (mentor.getRole() != UserRole.MENTOR || Boolean.FALSE.equals(mentor.getActive())) {
                throw new BusinessRuleException("O mentor deve ser um professor/mentor ativo.");
            }

            student.setMentor(mentor);
            logDetails = String.format("Vinculou aluno %s ao mentor %s", student.getName(), mentor.getName());
        } else {
            student.setMentor(null);
            logDetails = String.format("Removeu vínculo de mentor do aluno %s", student.getName());
        }

        User savedStudent = userRepository.save(student);

        recordAction(admin, savedStudent, "ASSIGN_MENTOR", logDetails);

        return AdminUserResponse.fromEntity(savedStudent);
    }

    @Transactional
    public AnnouncementResponse createAnnouncement(String authHeader, CreateAnnouncementRequest request) {
        User admin = currentUserService.requireRole(authHeader, UserRole.ADMIN);

        String title = request.title() != null ? request.title().trim() : "";
        String message = request.message() != null ? request.message().trim() : "";

        if (title.length() < 3 || title.length() > 80) {
            throw new BusinessRuleException("O título deve ter entre 3 e 80 caracteres.");
        }
        if (message.length() < 5 || message.length() > 300) {
            throw new BusinessRuleException("A mensagem deve ter entre 5 e 300 caracteres.");
        }
        if (request.audience() == null) {
            throw new BusinessRuleException("O público-alvo é obrigatório.");
        }

        Announcement announcement = Announcement.builder()
                .author(admin)
                .title(title)
                .message(message)
                .audience(request.audience())
                .createdAt(LocalDateTime.now(APP_TIMEZONE))
                .recipientsCount(0)
                .build();

        Announcement savedAnnouncement = announcementRepository.save(announcement);

        // Seleciona destinatários ATIVOS conforme o público-alvo
        List<User> recipients;
        if (request.audience() == AnnouncementAudience.ALL) {
            recipients = userRepository.findByActiveTrue();
        } else if (request.audience() == AnnouncementAudience.STUDENTS) {
            recipients = userRepository.findByRoleAndActiveTrue(UserRole.STUDENT);
        } else {
            recipients = userRepository.findByRoleAndActiveTrue(UserRole.MENTOR);
        }

        int count = 0;
        String refKey = "ANNOUNCEMENT:" + savedAnnouncement.getId();

        for (User recipient : recipients) {
            // Não envia ao próprio autor
            if (recipient.getId().equals(admin.getId())) {
                continue;
            }

            try {
                Notification notification = notificationService.createNotificationSilently(
                        recipient,
                        NotificationType.ANNOUNCEMENT,
                        savedAnnouncement.getTitle(),
                        savedAnnouncement.getMessage(),
                        refKey
                );
                if (notification != null) {
                    count++;
                }
            } catch (Exception e) {
                log.warn("[ADMIN] Falha não impeditiva ao enviar aviso {} para usuário {}: {}",
                        savedAnnouncement.getId(), recipient.getEmail(), e.getMessage());
            }
        }

        savedAnnouncement.setRecipientsCount(count);
        announcementRepository.save(savedAnnouncement);

        recordAction(
                admin,
                null,
                "SEND_ANNOUNCEMENT",
                String.format("Enviou aviso '%s' para %s (%d destinatários)", savedAnnouncement.getTitle(), savedAnnouncement.getAudience(), count)
        );

        return AnnouncementResponse.fromEntity(savedAnnouncement);
    }

    @Transactional(readOnly = true)
    public List<AnnouncementResponse> getAnnouncements(String authHeader) {
        currentUserService.requireRole(authHeader, UserRole.ADMIN);

        return announcementRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(AnnouncementResponse::fromEntity)
                .toList();
    }

    private void recordAction(User actor, User targetUser, String action, String details) {
        try {
            AdminActionLog logEntry = AdminActionLog.builder()
                    .actor(actor)
                    .targetUser(targetUser)
                    .action(action)
                    .details(details)
                    .createdAt(LocalDateTime.now(APP_TIMEZONE))
                    .build();
            adminActionLogRepository.save(logEntry);
        } catch (Exception e) {
            log.warn("[ADMIN AUDIT] Falha não impeditiva ao registrar log de ação {}: {}", action, e.getMessage());
        }
    }
}
