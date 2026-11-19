package com.studyos.api.service.mentor;

import com.studyos.api.dto.admin.response.AnnouncementResponse;
import com.studyos.api.dto.mentor.request.CreateMentorAnnouncementRequest;
import com.studyos.api.dto.mentor.response.MentorDailyStudyResponse;
import com.studyos.api.dto.mentor.response.MentorOverviewResponse;
import com.studyos.api.dto.mentor.response.MentorSessionResponse;
import com.studyos.api.dto.mentor.response.MentorStudentDetailResponse;
import com.studyos.api.dto.mentor.response.MentorStudentSummaryResponse;
import com.studyos.api.dto.mentor.response.MentorTaskResponse;
import com.studyos.api.dto.mentor.response.MentorTopStudentResponse;
import com.studyos.api.exception.custom.BusinessRuleException;
import com.studyos.api.exception.custom.ResourceNotFoundException;
import com.studyos.api.model.AdminActionLog;
import com.studyos.api.model.Announcement;
import com.studyos.api.model.Task;
import com.studyos.api.model.TimeLog;
import com.studyos.api.model.User;
import com.studyos.api.model.enums.AnnouncementAudience;
import com.studyos.api.model.enums.MentorActivityStatus;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class MentorService {

    private static final ZoneId SAO_PAULO_ZONE = ZoneId.of("America/Sao_Paulo");

    private final CurrentUserService currentUserService;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final TimeLogRepository timeLogRepository;
    private final AnnouncementRepository announcementRepository;
    private final NotificationService notificationService;
    private final AdminActionLogRepository adminActionLogRepository;

    @Transactional(readOnly = true)
    public MentorOverviewResponse getOverview(String authHeader) {
        User mentor = currentUserService.requireRole(authHeader, UserRole.MENTOR);

        long totalStudents = userRepository.countByMentorIdAndActiveTrue(mentor.getId());
        Long totalMinutes = timeLogRepository.sumTotalStudyMinutesByMentorId(mentor.getId());
        double totalStudyHours = totalMinutes != null ? Math.round((totalMinutes / 60.0) * 10.0) / 10.0 : 0.0;

        long totalTasks = taskRepository.countTasksByMentorId(mentor.getId());
        long completedTasks = taskRepository.countCompletedTasksByMentorId(mentor.getId());

        Double avgXp = userRepository.findAverageXpByMentorId(mentor.getId());
        double averageXp = avgXp != null ? Math.round(avgXp * 10.0) / 10.0 : 0.0;

        List<User> students = userRepository.findByMentorIdAndActiveTrue(mentor.getId());
        LocalDateTime sevenDaysAgo = LocalDateTime.now(SAO_PAULO_ZONE).minusDays(7);
        Map<Long, Integer> minutesMap = fetchMinutesLast7DaysMap(mentor.getId(), sevenDaysAgo);

        long inactiveStudents = 0;
        List<MentorTopStudentResponse> topStudentCandidates = new ArrayList<>();

        for (User student : students) {
            int mins = minutesMap.getOrDefault(student.getId(), 0);
            if (mins == 0) {
                inactiveStudents++;
            }
            topStudentCandidates.add(new MentorTopStudentResponse(
                    student.getId(),
                    student.getName(),
                    mins,
                    student.getCurrentXp() != null ? student.getCurrentXp() : 0L,
                    student.getLevel() != null ? student.getLevel() : 1
            ));
        }

        topStudentCandidates.sort(
                Comparator.comparingInt(MentorTopStudentResponse::minutesLast7Days).reversed()
                        .thenComparing(Comparator.comparing(MentorTopStudentResponse::currentXp).reversed())
        );

        List<MentorTopStudentResponse> topStudents = topStudentCandidates.stream()
                .limit(3)
                .toList();

        return new MentorOverviewResponse(
                totalStudents,
                totalStudyHours,
                completedTasks,
                totalTasks,
                averageXp,
                inactiveStudents,
                topStudents
        );
    }

    @Transactional(readOnly = true)
    public List<MentorStudentSummaryResponse> getStudents(String authHeader, String search) {
        User mentor = currentUserService.requireRole(authHeader, UserRole.MENTOR);

        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        List<User> students = userRepository.findActiveStudentsByMentor(mentor.getId(), cleanSearch);

        // Mapas agregados no banco
        Map<Long, long[]> taskStatsMap = fetchTaskStatsMap(mentor.getId());
        Map<Long, LocalDateTime> lastActivityMap = fetchLastActivityMap(mentor.getId());
        LocalDateTime sevenDaysAgo = LocalDateTime.now(SAO_PAULO_ZONE).minusDays(7);
        Map<Long, Integer> minutesLast7DaysMap = fetchMinutesLast7DaysMap(mentor.getId(), sevenDaysAgo);

        List<MentorStudentSummaryResponse> summaries = new ArrayList<>();

        for (User student : students) {
            long[] stats = taskStatsMap.getOrDefault(student.getId(), new long[]{0L, 0L});
            long totalTasks = stats[0];
            long completedTasks = stats[1];
            double completionRate = totalTasks > 0
                    ? Math.round(((double) completedTasks / totalTasks) * 1000.0) / 10.0
                    : 0.0;

            int minutes7 = minutesLast7DaysMap.getOrDefault(student.getId(), 0);
            LocalDateTime lastActivityAt = lastActivityMap.get(student.getId());
            MentorActivityStatus activityStatus = calculateActivityStatus(lastActivityAt);

            summaries.add(new MentorStudentSummaryResponse(
                    student.getId(),
                    student.getName(),
                    student.getLevel() != null ? student.getLevel() : 1,
                    student.getCurrentXp() != null ? student.getCurrentXp() : 0L,
                    student.getStreakDays() != null ? student.getStreakDays() : 0,
                    student.getFrozenCount() != null ? student.getFrozenCount() : 0,
                    totalTasks,
                    completedTasks,
                    completionRate,
                    minutes7,
                    lastActivityAt,
                    activityStatus
            ));
        }

        return summaries;
    }

    @Transactional(readOnly = true)
    public MentorStudentDetailResponse getStudentDetail(String authHeader, Long studentId) {
        User mentor = currentUserService.requireRole(authHeader, UserRole.MENTOR);

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Aluno não encontrado ou não vinculado ao seu perfil."));

        if (!Boolean.TRUE.equals(student.getActive()) ||
                student.getMentor() == null ||
                !mentor.getId().equals(student.getMentor().getId())) {
            throw new ResourceNotFoundException("Aluno não encontrado ou não vinculado ao seu perfil.");
        }

        // Tarefas do aluno (SEM descrição)
        List<Task> tasks = taskRepository.findByUserIdOrderByStartDateDesc(student.getId());
        long totalTasks = tasks.size();
        long completedTasks = tasks.stream().filter(t -> t.getStatus() == TaskStatus.COMPLETED).count();
        double completionRate = totalTasks > 0
                ? Math.round(((double) completedTasks / totalTasks) * 1000.0) / 10.0
                : 0.0;

        List<MentorTaskResponse> mentorTasks = tasks.stream()
                .map(t -> new MentorTaskResponse(
                        t.getId(),
                        t.getTitle(),
                        t.getCategory(),
                        t.getSeason(),
                        t.getStatus(),
                        t.getDailyMinMinutes() != null ? t.getDailyMinMinutes() : t.getPlannedDurationMinutes(),
                        t.getActualDurationMinutes() != null ? t.getActualDurationMinutes() : 0,
                        t.getStartDate(),
                        t.getEndDate()
                ))
                .toList();

        // Últimas 10 sessões (SEM notes)
        List<TimeLog> sessions = timeLogRepository.findTop10ByTaskUserIdOrderByCreatedAtDesc(student.getId());
        List<MentorSessionResponse> recentSessions = sessions.stream()
                .map(s -> new MentorSessionResponse(
                        s.getId(),
                        s.getCreatedAt(),
                        s.getLoggedDurationMinutes() != null ? s.getLoggedDurationMinutes() : 0,
                        s.getCompletionStatus()
                ))
                .toList();

        LocalDateTime lastActivityAt = sessions.isEmpty() ? null : sessions.get(0).getCreatedAt();
        MentorActivityStatus activityStatus = calculateActivityStatus(lastActivityAt);

        // Minutos nos últimos 7 dias
        LocalDateTime sevenDaysAgo = LocalDateTime.now(SAO_PAULO_ZONE).minusDays(7);
        Long mins7 = timeLogRepository.sumStudyMinutesByUserIdAndPeriod(student.getId(), sevenDaysAgo, LocalDateTime.now());
        int minutesLast7Days = mins7 != null ? mins7.intValue() : 0;

        // Distribuição diária dos últimos 7 dias
        LocalDate today = LocalDate.now(SAO_PAULO_ZONE);
        LocalDate startPeriod = today.minusDays(6);
        List<TimeLog> weekLogs = timeLogRepository.findByTaskUserIdAndCreatedAtBetween(
                student.getId(),
                startPeriod.atStartOfDay(),
                LocalDateTime.now()
        );

        Map<LocalDate, Integer> dailyMinutesMap = new HashMap<>();
        for (TimeLog tl : weekLogs) {
            if (tl.getCreatedAt() != null && tl.getLoggedDurationMinutes() != null) {
                LocalDate logDate = tl.getCreatedAt().toLocalDate();
                dailyMinutesMap.merge(logDate, tl.getLoggedDurationMinutes(), Integer::sum);
            }
        }

        List<MentorDailyStudyResponse> dailyStudy = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate d = startPeriod.plusDays(i);
            dailyStudy.add(new MentorDailyStudyResponse(
                    d,
                    formatDayOfWeek(d),
                    dailyMinutesMap.getOrDefault(d, 0)
            ));
        }

        return new MentorStudentDetailResponse(
                student.getId(),
                student.getName(),
                student.getLevel() != null ? student.getLevel() : 1,
                student.getCurrentXp() != null ? student.getCurrentXp() : 0L,
                student.getStreakDays() != null ? student.getStreakDays() : 0,
                student.getFrozenCount() != null ? student.getFrozenCount() : 0,
                totalTasks,
                completedTasks,
                completionRate,
                minutesLast7Days,
                lastActivityAt,
                activityStatus,
                dailyStudy,
                mentorTasks,
                recentSessions
        );
    }

    @Transactional
    public AnnouncementResponse createAnnouncement(String authHeader, CreateMentorAnnouncementRequest request) {
        User mentor = currentUserService.requireRole(authHeader, UserRole.MENTOR);

        List<User> recipients;
        AnnouncementAudience audience;
        User targetStudent = null;

        if (request.studentId() != null) {
            User student = userRepository.findById(request.studentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Aluno não encontrado ou não vinculado ao seu perfil."));

            if (!Boolean.TRUE.equals(student.getActive()) ||
                    student.getMentor() == null ||
                    !mentor.getId().equals(student.getMentor().getId())) {
                throw new ResourceNotFoundException("Aluno não encontrado ou não vinculado ao seu perfil.");
            }

            recipients = List.of(student);
            audience = AnnouncementAudience.ONE_STUDENT;
            targetStudent = student;
        } else {
            recipients = userRepository.findByMentorIdAndActiveTrue(mentor.getId());
            if (recipients.isEmpty()) {
                throw new BusinessRuleException("Você ainda não tem alunos vinculados.");
            }
            audience = AnnouncementAudience.MY_STUDENTS;
        }

        Announcement announcement = Announcement.builder()
                .author(mentor)
                .title(request.title().trim())
                .message(request.message().trim())
                .audience(audience)
                .targetStudent(targetStudent)
                .recipientsCount(recipients.size())
                .build();

        Announcement saved = announcementRepository.save(announcement);

        String refKey = "ANNOUNCEMENT:" + saved.getId();
        String notificationMessage = saved.getMessage() + " — " + mentor.getName();
        int count = 0;

        for (User recipient : recipients) {
            try {
                notificationService.createNotificationSilently(
                        recipient,
                        NotificationType.ANNOUNCEMENT,
                        saved.getTitle(),
                        notificationMessage,
                        refKey
                );
                count++;
            } catch (Exception e) {
                log.error("Erro ao enviar notificação de comunicado {} para aluno {}: {}",
                        saved.getId(), recipient.getEmail(), e.getMessage());
            }
        }

        saved.setRecipientsCount(count);
        announcementRepository.save(saved);

        logAdminAction(
                mentor,
                targetStudent,
                "MENTOR_ANNOUNCEMENT",
                String.format("Mentor '%s' enviou aviso '%s' para %s (%d destinatários)",
                        mentor.getName(), saved.getTitle(), saved.getAudience(), count)
        );

        return AnnouncementResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<AnnouncementResponse> getAnnouncements(String authHeader) {
        User mentor = currentUserService.requireRole(authHeader, UserRole.MENTOR);
        return announcementRepository.findByAuthorIdOrderByCreatedAtDesc(mentor.getId())
                .stream()
                .map(AnnouncementResponse::fromEntity)
                .toList();
    }

    public static MentorActivityStatus calculateActivityStatus(LocalDateTime lastActivityAt) {
        if (lastActivityAt == null) {
            return MentorActivityStatus.INACTIVE;
        }
        LocalDate today = LocalDate.now(SAO_PAULO_ZONE);
        LocalDate lastDate = lastActivityAt.toLocalDate();
        long days = ChronoUnit.DAYS.between(lastDate, today);

        if (days <= 3) {
            return MentorActivityStatus.UP_TO_DATE;
        } else if (days <= 7) {
            return MentorActivityStatus.ATTENTION;
        } else {
            return MentorActivityStatus.INACTIVE;
        }
    }

    private Map<Long, long[]> fetchTaskStatsMap(Long mentorId) {
        Map<Long, long[]> map = new HashMap<>();
        List<Object[]> rows = taskRepository.findTaskStatsByMentorStudents(mentorId);
        for (Object[] r : rows) {
            Long studentId = (Long) r[0];
            long total = ((Number) r[1]).longValue();
            long completed = ((Number) r[2]).longValue();
            map.put(studentId, new long[]{total, completed});
        }
        return map;
    }

    private Map<Long, LocalDateTime> fetchLastActivityMap(Long mentorId) {
        Map<Long, LocalDateTime> map = new HashMap<>();
        List<Object[]> rows = timeLogRepository.findLastActivityByMentorStudents(mentorId);
        for (Object[] r : rows) {
            Long studentId = (Long) r[0];
            LocalDateTime dt = (LocalDateTime) r[1];
            map.put(studentId, dt);
        }
        return map;
    }

    private Map<Long, Integer> fetchMinutesLast7DaysMap(Long mentorId, LocalDateTime since) {
        Map<Long, Integer> map = new HashMap<>();
        List<Object[]> rows = timeLogRepository.findMinutesLast7DaysByMentorStudents(mentorId, since);
        for (Object[] r : rows) {
            Long studentId = (Long) r[0];
            int mins = ((Number) r[1]).intValue();
            map.put(studentId, mins);
        }
        return map;
    }

    private void logAdminAction(User actor, User targetUser, String action, String details) {
        try {
            AdminActionLog actionLog = AdminActionLog.builder()
                    .actor(actor)
                    .targetUser(targetUser)
                    .action(action)
                    .details(details)
                    .build();
            adminActionLogRepository.save(actionLog);
        } catch (Exception e) {
            log.error("Falha ao registrar log de auditoria do mentor: {}", e.getMessage());
        }
    }

    private String formatDayOfWeek(LocalDate date) {
        DayOfWeek dow = date.getDayOfWeek();
        return switch (dow) {
            case MONDAY -> "Seg";
            case TUESDAY -> "Ter";
            case WEDNESDAY -> "Qua";
            case THURSDAY -> "Qui";
            case FRIDAY -> "Sex";
            case SATURDAY -> "Sáb";
            case SUNDAY -> "Dom";
        };
    }
}
