package com.studyos.api.controller;

import com.studyos.api.model.Season;
import com.studyos.api.model.Task;
import com.studyos.api.model.TimeLog;
import com.studyos.api.model.User;
import com.studyos.api.model.enums.CompletionStatus;
import com.studyos.api.model.enums.SeasonCode;
import com.studyos.api.model.enums.TaskCategory;
import com.studyos.api.model.enums.TaskStatus;
import com.studyos.api.model.enums.UserRole;
import com.studyos.api.repository.admin.AdminActionLogRepository;
import com.studyos.api.repository.announcement.AnnouncementRepository;
import com.studyos.api.repository.notification.NotificationRepository;
import com.studyos.api.repository.season.SeasonRepository;
import com.studyos.api.repository.task.TaskRepository;
import com.studyos.api.repository.timelog.TimeLogRepository;
import com.studyos.api.repository.user.UserRepository;
import com.studyos.api.service.auth.JwtTokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Transactional
class MentorControllerTest {

    private static final ZoneId SAO_PAULO_ZONE = ZoneId.of("America/Sao_Paulo");

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private TimeLogRepository timeLogRepository;

    @Autowired
    private SeasonRepository seasonRepository;

    @Autowired
    private AnnouncementRepository announcementRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private AdminActionLogRepository adminActionLogRepository;

    @Autowired
    private JwtTokenService jwtTokenService;

    private User mentor1;
    private User mentor2;
    private User mentorWithoutStudents;
    private User student1;
    private User student2;
    private User studentOfOtherMentor;
    private User studentWithoutMentor;
    private User inactiveStudent;
    private User adminUser;

    private String mentor1Token;
    private String mentor2Token;
    private String mentorWithoutStudentsToken;
    private String student1Token;
    private String adminToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();

        // 1. Mentores
        mentor1 = userRepository.save(User.builder()
                .name("Professor Mentor Principal")
                .email("mentor1.test@studyos.com")
                .password("Senha@123")
                .role(UserRole.MENTOR)
                .active(true)
                .build());
        mentor1Token = jwtTokenService.generateToken(mentor1);

        mentor2 = userRepository.save(User.builder()
                .name("Professor Outro Mentor")
                .email("mentor2.test@studyos.com")
                .password("Senha@123")
                .role(UserRole.MENTOR)
                .active(true)
                .build());
        mentor2Token = jwtTokenService.generateToken(mentor2);

        mentorWithoutStudents = userRepository.save(User.builder()
                .name("Professor Sem Alunos")
                .email("mentor.empty@studyos.com")
                .password("Senha@123")
                .role(UserRole.MENTOR)
                .active(true)
                .build());
        mentorWithoutStudentsToken = jwtTokenService.generateToken(mentorWithoutStudents);

        // 2. Estudante do mentor 1 (ativo)
        student1 = userRepository.save(User.builder()
                .name("Estudante Vinculado 1")
                .email("student1.test@studyos.com")
                .password("Senha@123")
                .role(UserRole.STUDENT)
                .mentor(mentor1)
                .active(true)
                .level(2)
                .currentXp(150L)
                .streakDays(3)
                .frozenCount(1)
                .build());
        student1Token = jwtTokenService.generateToken(student1);

        // 3. Estudante do mentor 1 (ativo)
        student2 = userRepository.save(User.builder()
                .name("Estudante Vinculado 2")
                .email("student2.test@studyos.com")
                .password("Senha@123")
                .role(UserRole.STUDENT)
                .mentor(mentor1)
                .active(true)
                .level(1)
                .currentXp(50L)
                .streakDays(0)
                .frozenCount(0)
                .build());

        // 4. Estudante de outro mentor
        studentOfOtherMentor = userRepository.save(User.builder()
                .name("Estudante De Outro Mentor")
                .email("student.other@studyos.com")
                .password("Senha@123")
                .role(UserRole.STUDENT)
                .mentor(mentor2)
                .active(true)
                .build());

        // 5. Estudante sem mentor
        studentWithoutMentor = userRepository.save(User.builder()
                .name("Estudante Sem Mentor")
                .email("student.nomentor@studyos.com")
                .password("Senha@123")
                .role(UserRole.STUDENT)
                .active(true)
                .build());

        // 6. Estudante inativo
        inactiveStudent = userRepository.save(User.builder()
                .name("Estudante Inativo")
                .email("student.inactive@studyos.com")
                .password("Senha@123")
                .role(UserRole.STUDENT)
                .mentor(mentor1)
                .active(false)
                .build());

        // 7. Administrador
        adminUser = userRepository.save(User.builder()
                .name("Admin Teste")
                .email("admin.mentor.test@studyos.com")
                .password("Senha@123")
                .role(UserRole.ADMIN)
                .active(true)
                .build());
        adminToken = jwtTokenService.generateToken(adminUser);
    }

    // ── 1. POLÍTICA DE ACESSO: Sem token = 401, Student e Admin = 403 ─────────

    @Test
    @DisplayName("Cenário 1: GET /mentor/overview sem token responde 401; com token de estudante ou admin responde 403")
    void testOverviewAccessControl() throws Exception {
        // Sem token -> 401
        mockMvc.perform(get("/api/v1/mentor/overview"))
                .andExpect(status().isUnauthorized());

        // Estudante -> 403
        mockMvc.perform(get("/api/v1/mentor/overview")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isForbidden());

        // Admin -> 403
        mockMvc.perform(get("/api/v1/mentor/overview")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden());

        // Mentor -> 200
        mockMvc.perform(get("/api/v1/mentor/overview")
                        .header("Authorization", "Bearer " + mentor1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalStudents", is(2)));
    }

    @Test
    @DisplayName("Cenário 2: GET /mentor/students sem token responde 401; com estudante ou admin responde 403")
    void testStudentsAccessControl() throws Exception {
        mockMvc.perform(get("/api/v1/mentor/students"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/mentor/students")
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/mentor/students")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/mentor/students")
                        .header("Authorization", "Bearer " + mentor1Token))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Cenário 3: GET /mentor/students/{id} sem token responde 401; com estudante ou admin responde 403")
    void testStudentDetailAccessControl() throws Exception {
        mockMvc.perform(get("/api/v1/mentor/students/" + student1.getId()))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/mentor/students/" + student1.getId())
                        .header("Authorization", "Bearer " + student1Token))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/mentor/students/" + student1.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/mentor/students/" + student1.getId())
                        .header("Authorization", "Bearer " + mentor1Token))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Cenário 4: POST /mentor/announcements sem token responde 401; com estudante ou admin responde 403")
    void testAnnouncementsAccessControl() throws Exception {
        String body = """
                {
                    "title": "Aviso de Teste",
                    "message": "Mensagem do aviso acadêmico para turma"
                }
                """;

        mockMvc.perform(post("/api/v1/mentor/announcements")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/mentor/announcements")
                        .header("Authorization", "Bearer " + student1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden());

        mockMvc.perform(post("/api/v1/mentor/announcements")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isForbidden());
    }

    // ── 2. ISOLAMENTO DO MENTOR: Apenas alunos ativos vinculados, 404 para demais ──

    @Test
    @DisplayName("Cenário 5: Mentor enxerga apenas próprios alunos ativos na listagem e na busca")
    void testMentorListsOnlyOwnActiveStudents() throws Exception {
        mockMvc.perform(get("/api/v1/mentor/students")
                        .header("Authorization", "Bearer " + mentor1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[*].name", containsInAnyOrder("Estudante Vinculado 1", "Estudante Vinculado 2")))
                .andExpect(jsonPath("$[*].name", not(hasItem("Estudante De Outro Mentor"))))
                .andExpect(jsonPath("$[*].name", not(hasItem("Estudante Sem Mentor"))))
                .andExpect(jsonPath("$[*].name", not(hasItem("Estudante Inativo"))));

        // Busca filtrada por nome
        mockMvc.perform(get("/api/v1/mentor/students?search=Vinculado 1")
                        .header("Authorization", "Bearer " + mentor1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name", is("Estudante Vinculado 1")));
    }

    @Test
    @DisplayName("Cenário 6: Detalhe responde 404 para aluno de outro mentor, sem mentor, inativo ou inexistente")
    void testStudentDetailReturns404ForUnauthorizedOrInactiveStudents() throws Exception {
        // Aluno de outro mentor -> 404 (NÃO 403)
        mockMvc.perform(get("/api/v1/mentor/students/" + studentOfOtherMentor.getId())
                        .header("Authorization", "Bearer " + mentor1Token))
                .andExpect(status().isNotFound());

        // Aluno sem mentor -> 404
        mockMvc.perform(get("/api/v1/mentor/students/" + studentWithoutMentor.getId())
                        .header("Authorization", "Bearer " + mentor1Token))
                .andExpect(status().isNotFound());

        // Aluno inativo -> 404
        mockMvc.perform(get("/api/v1/mentor/students/" + inactiveStudent.getId())
                        .header("Authorization", "Bearer " + mentor1Token))
                .andExpect(status().isNotFound());

        // Aluno inexistente -> 404
        mockMvc.perform(get("/api/v1/mentor/students/999999")
                        .header("Authorization", "Bearer " + mentor1Token))
                .andExpect(status().isNotFound());
    }

    // ── 3. PRIVACIDADE: Respostas NÃO contêm email, password, description nem notes ──

    @Test
    @DisplayName("Cenário 7: As respostas de /mentor NÃO contêm email, password, description nem notes")
    void testPrivacyNoEmailPasswordDescriptionOrNotes() throws Exception {
        Season season = seasonRepository.save(Season.builder()
                .code(SeasonCode.SUMMER)
                .title("Verão")
                .quarter("Q1")
                .user(student1)
                .build());

        Task task = taskRepository.save(Task.builder()
                .title("Tarefa Segredo")
                .description("Esta descricao confidencial nao deve vazar para o mentor!")
                .category(TaskCategory.JAVA_BACKEND)
                .seasonEntity(season)
                .plannedDurationMinutes(60)
                .dailyMinMinutes(60)
                .actualDurationMinutes(40)
                .status(TaskStatus.IN_PROGRESS)
                .user(student1)
                .build());

        timeLogRepository.save(TimeLog.builder()
                .task(task)
                .loggedDurationMinutes(40)
                .completionStatus(CompletionStatus.COMPLETED)
                .notes("Anotacoes intimas e privadas sobre a sessao de estudo")
                .createdAt(LocalDateTime.now())
                .build());

        // 1. Overview
        mockMvc.perform(get("/api/v1/mentor/overview")
                        .header("Authorization", "Bearer " + mentor1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.*.email").doesNotExist())
                .andExpect(jsonPath("$.*.password").doesNotExist())
                .andExpect(jsonPath("$.*.description").doesNotExist())
                .andExpect(jsonPath("$.*.notes").doesNotExist());

        // 2. Students List
        mockMvc.perform(get("/api/v1/mentor/students")
                        .header("Authorization", "Bearer " + mentor1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].email").doesNotExist())
                .andExpect(jsonPath("$[*].password").doesNotExist())
                .andExpect(jsonPath("$[*].description").doesNotExist())
                .andExpect(jsonPath("$[*].notes").doesNotExist());

        // 3. Student Detail
        mockMvc.perform(get("/api/v1/mentor/students/" + student1.getId())
                        .header("Authorization", "Bearer " + mentor1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").doesNotExist())
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.description").doesNotExist())
                .andExpect(jsonPath("$.notes").doesNotExist())
                // Garante que lista de tarefas não tem description
                .andExpect(jsonPath("$.tasks[*].description").doesNotExist())
                // Garante que lista de sessões não tem notes
                .andExpect(jsonPath("$.recentSessions[*].notes").doesNotExist());
    }

    // ── 4. AGREGADOS E LIMITES DE DIAS: 3, 4, 7 e 8 DIAS PARA STATUS DE ATIVIDADE ──

    @Test
    @DisplayName("Cenário 8: ActivityStatus nos limites exatos de 3 dias (UP_TO_DATE), 4 e 7 dias (ATTENTION), 8 dias e nunca (INACTIVE)")
    void testActivityStatusBoundaries() throws Exception {
        LocalDate today = LocalDate.now(SAO_PAULO_ZONE);

        // Aluno A: última atividade há 3 dias -> UP_TO_DATE
        User studentA = userRepository.save(User.builder()
                .name("Aluno 3 Dias")
                .email("aluno.3d@studyos.com")
                .password("Senha@123")
                .role(UserRole.STUDENT)
                .mentor(mentor1)
                .active(true)
                .build());

        Task taskA = taskRepository.save(Task.builder()
                .title("Tarefa A")
                .category(TaskCategory.JAVA_BACKEND)
                .plannedDurationMinutes(30)
                .dailyMinMinutes(30)
                .user(studentA)
                .build());

        timeLogRepository.save(TimeLog.builder()
                .task(taskA)
                .loggedDurationMinutes(30)
                .completionStatus(CompletionStatus.COMPLETED)
                .createdAt(today.minusDays(3).atTime(12, 0))
                .build());

        // Aluno B: última atividade há 4 dias -> ATTENTION
        User studentB = userRepository.save(User.builder()
                .name("Aluno 4 Dias")
                .email("aluno.4d@studyos.com")
                .password("Senha@123")
                .role(UserRole.STUDENT)
                .mentor(mentor1)
                .active(true)
                .build());

        Task taskB = taskRepository.save(Task.builder()
                .title("Tarefa B")
                .category(TaskCategory.JAVA_BACKEND)
                .plannedDurationMinutes(30)
                .dailyMinMinutes(30)
                .user(studentB)
                .build());

        timeLogRepository.save(TimeLog.builder()
                .task(taskB)
                .loggedDurationMinutes(30)
                .completionStatus(CompletionStatus.COMPLETED)
                .createdAt(today.minusDays(4).atTime(12, 0))
                .build());

        // Aluno C: última atividade há 7 dias -> ATTENTION
        User studentC = userRepository.save(User.builder()
                .name("Aluno 7 Dias")
                .email("aluno.7d@studyos.com")
                .password("Senha@123")
                .role(UserRole.STUDENT)
                .mentor(mentor1)
                .active(true)
                .build());

        Task taskC = taskRepository.save(Task.builder()
                .title("Tarefa C")
                .category(TaskCategory.JAVA_BACKEND)
                .plannedDurationMinutes(30)
                .dailyMinMinutes(30)
                .user(studentC)
                .build());

        timeLogRepository.save(TimeLog.builder()
                .task(taskC)
                .loggedDurationMinutes(30)
                .completionStatus(CompletionStatus.COMPLETED)
                .createdAt(today.minusDays(7).atTime(12, 0))
                .build());

        // Aluno D: última atividade há 8 dias -> INACTIVE
        User studentD = userRepository.save(User.builder()
                .name("Aluno 8 Dias")
                .email("aluno.8d@studyos.com")
                .password("Senha@123")
                .role(UserRole.STUDENT)
                .mentor(mentor1)
                .active(true)
                .build());

        Task taskD = taskRepository.save(Task.builder()
                .title("Tarefa D")
                .category(TaskCategory.JAVA_BACKEND)
                .plannedDurationMinutes(30)
                .dailyMinMinutes(30)
                .user(studentD)
                .build());

        timeLogRepository.save(TimeLog.builder()
                .task(taskD)
                .loggedDurationMinutes(30)
                .completionStatus(CompletionStatus.COMPLETED)
                .createdAt(today.minusDays(8).atTime(12, 0))
                .build());

        // Verifica na listagem
        mockMvc.perform(get("/api/v1/mentor/students?search=Aluno 3 Dias")
                        .header("Authorization", "Bearer " + mentor1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].activityStatus", is("UP_TO_DATE")));

        mockMvc.perform(get("/api/v1/mentor/students?search=Aluno 4 Dias")
                        .header("Authorization", "Bearer " + mentor1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].activityStatus", is("ATTENTION")));

        mockMvc.perform(get("/api/v1/mentor/students?search=Aluno 7 Dias")
                        .header("Authorization", "Bearer " + mentor1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].activityStatus", is("ATTENTION")));

        mockMvc.perform(get("/api/v1/mentor/students?search=Aluno 8 Dias")
                        .header("Authorization", "Bearer " + mentor1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].activityStatus", is("INACTIVE")));
    }

    // ── 5. AVISOS: Envio geral, envio individual, mentor sem alunos ───────────

    @Test
    @DisplayName("Cenário 9: Envio de aviso para todos notifica apenas alunos ativos vinculados")
    void testSendAnnouncementToAllStudents() throws Exception {
        String body = """
                {
                    "title": "Aviso Geral da Turma",
                    "message": "Lembrete sobre a entrega do projeto trimestral."
                }
                """;

        mockMvc.perform(post("/api/v1/mentor/announcements")
                        .header("Authorization", "Bearer " + mentor1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title", is("Aviso Geral da Turma")))
                .andExpect(jsonPath("$.recipientsCount", is(2)))
                .andExpect(jsonPath("$.audience", is("MY_STUDENTS")));

        // Verifica histórico
        mockMvc.perform(get("/api/v1/mentor/announcements")
                        .header("Authorization", "Bearer " + mentor1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title", is("Aviso Geral da Turma")))
                .andExpect(jsonPath("$[0].authorName", is("Professor Mentor Principal")));
    }

    @Test
    @DisplayName("Cenário 10: Envio de aviso para aluno específico e 404 para aluno de outro mentor")
    void testSendAnnouncementToOneStudent() throws Exception {
        // Envio para student1 -> sucesso (recipientsCount = 1)
        String bodySuccess = String.format("""
                {
                    "title": "Feedback Individual",
                    "message": "Excelente progresso no módulo de Spring Data JPA!",
                    "studentId": %d
                }
                """, student1.getId());

        mockMvc.perform(post("/api/v1/mentor/announcements")
                        .header("Authorization", "Bearer " + mentor1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bodySuccess))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.recipientsCount", is(1)))
                .andExpect(jsonPath("$.audience", is("ONE_STUDENT")));

        // Envio para studentOfOtherMentor -> 404
        String bodyOther = String.format("""
                {
                    "title": "Tentativa Invalida",
                    "message": "Nao deve ser permitido enviar para aluno de outro",
                    "studentId": %d
                }
                """, studentOfOtherMentor.getId());

        mockMvc.perform(post("/api/v1/mentor/announcements")
                        .header("Authorization", "Bearer " + mentor1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bodyOther))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Cenário 11: Mentor sem alunos vinculados recebe 400 amigável ao tentar enviar aviso geral")
    void testMentorWithoutStudentsReceives400OnAnnouncement() throws Exception {
        String body = """
                {
                    "title": "Aviso Sem Destinatarios",
                    "message": "Este aviso nao possui alunos na base para receber."
                }
                """;

        mockMvc.perform(post("/api/v1/mentor/announcements")
                        .header("Authorization", "Bearer " + mentorWithoutStudentsToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Você ainda não tem alunos vinculados")));
    }
}
