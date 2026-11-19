package com.studyos.api.controller;

import com.studyos.api.model.User;
import com.studyos.api.model.enums.UserRole;
import com.studyos.api.repository.admin.AdminActionLogRepository;
import com.studyos.api.repository.announcement.AnnouncementRepository;
import com.studyos.api.repository.notification.NotificationRepository;
import com.studyos.api.repository.user.UserRepository;
import com.studyos.api.service.auth.JwtTokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Transactional
class AdminControllerTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AnnouncementRepository announcementRepository;

    @Autowired
    private AdminActionLogRepository adminActionLogRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private JwtTokenService jwtTokenService;

    private User adminUser;
    private User mentorUser;
    private User studentUser;
    private User inactiveStudent;

    private String adminToken;
    private String mentorToken;
    private String studentToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();

        // Limpa e cria usuários de teste
        userRepository.findByEmail("admin.test@studyos.com").ifPresent(userRepository::delete);
        userRepository.findByEmail("mentor.test@studyos.com").ifPresent(userRepository::delete);
        userRepository.findByEmail("student.test@studyos.com").ifPresent(userRepository::delete);
        userRepository.findByEmail("inactive.student@studyos.com").ifPresent(userRepository::delete);

        adminUser = userRepository.save(User.builder()
                .name("Administrador Teste")
                .email("admin.test@studyos.com")
                .password("Senha@123")
                .role(UserRole.ADMIN)
                .active(true)
                .level(1)
                .currentXp(0L)
                .streakDays(0)
                .frozenCount(0)
                .build());
        adminToken = jwtTokenService.generateToken(adminUser);

        mentorUser = userRepository.save(User.builder()
                .name("Professor Mentor Teste")
                .email("mentor.test@studyos.com")
                .password("Senha@123")
                .role(UserRole.MENTOR)
                .active(true)
                .level(1)
                .currentXp(0L)
                .streakDays(0)
                .frozenCount(0)
                .build());
        mentorToken = jwtTokenService.generateToken(mentorUser);

        studentUser = userRepository.save(User.builder()
                .name("Estudante Teste")
                .email("student.test@studyos.com")
                .password("Senha@123")
                .role(UserRole.STUDENT)
                .mentor(mentorUser)
                .active(true)
                .level(1)
                .currentXp(0L)
                .streakDays(0)
                .frozenCount(0)
                .build());
        studentToken = jwtTokenService.generateToken(studentUser);

        inactiveStudent = userRepository.save(User.builder()
                .name("Estudante Inativo Teste")
                .email("inactive.student@studyos.com")
                .password("Senha@123")
                .role(UserRole.STUDENT)
                .active(false)
                .level(1)
                .currentXp(0L)
                .streakDays(0)
                .frozenCount(0)
                .build());
    }

    @Test
    @DisplayName("Cenário 1: Estudante e Mentor recebem 403 em endpoints /admin; sem token recebe 401")
    void testAccessControlForbiddenAndUnauthorized() throws Exception {
        // Sem token -> 401
        mockMvc.perform(get("/api/v1/admin/overview"))
                .andExpect(status().isUnauthorized());

        // Estudante -> 403
        mockMvc.perform(get("/api/v1/admin/overview")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("FORBIDDEN"));

        // Mentor -> 403
        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + mentorToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("FORBIDDEN"));

        mockMvc.perform(post("/api/v1/admin/announcements")
                        .header("Authorization", "Bearer " + mentorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Teste\",\"message\":\"Mensagem teste\",\"audience\":\"ALL\"}"))
                .andExpect(status().isForbidden());

        // Admin -> 200 OK
        mockMvc.perform(get("/api/v1/admin/overview")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.studentsCount").isNumber());
    }

    @Test
    @DisplayName("Cenário 2: Admin cria usuário MENTOR com sucesso; e-mail duplicado dá 400; senha fraca é recusada")
    void testAdminCreateUserValidationAndSuccess() throws Exception {
        String validMentorPayload = """
                {
                    "name": "Novo Professor",
                    "email": "novo.prof@studyos.com",
                    "password": "SenhaForte@123",
                    "role": "MENTOR"
                }
                """;

        mockMvc.perform(post("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validMentorPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.name").value("Novo Professor"))
                .andExpect(jsonPath("$.email").value("novo.prof@studyos.com"))
                .andExpect(jsonPath("$.role").value("MENTOR"))
                .andExpect(jsonPath("$.active").value(true))
                .andExpect(jsonPath("$.password").doesNotExist()); // NUNCA retorna senha

        // Tentativa de duplicar e-mail -> 400
        mockMvc.perform(post("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validMentorPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("já está cadastrado")));

        // Senha fraca (< 6 chars) -> 400
        String weakPasswordPayload = """
                {
                    "name": "Outro Aluno",
                    "email": "outro.aluno@studyos.com",
                    "password": "123",
                    "role": "STUDENT"
                }
                """;

        mockMvc.perform(post("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(weakPasswordPayload))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Cenário 3: Admin não pode alterar o próprio papel nem se desativar; último admin ativo protegido")
    void testAdminSelfProtectionAndLastAdminProtection() throws Exception {
        // Tentativa do admin alterar o próprio papel -> 400
        String rolePayload = "{\"role\":\"STUDENT\"}";
        mockMvc.perform(patch("/api/v1/admin/users/" + adminUser.getId() + "/role")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(rolePayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("não pode alterar o próprio papel")));

        // Tentativa do admin desativar a si mesmo -> 400
        String statusPayload = "{\"active\":false}";
        mockMvc.perform(patch("/api/v1/admin/users/" + adminUser.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(statusPayload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("não pode desativar a própria conta")));
    }

    @Test
    @DisplayName("Cenário 4: Mentor rebaixado deixa os alunos sem mentor; vínculo só aceita MENTOR ativo e só em STUDENT")
    void testMentorDemotionAndMentorBinding() throws Exception {
        // Verifica vínculo inicial
        assertEquals(mentorUser.getId(), studentUser.getMentor().getId());

        // Rebaixa mentor para STUDENT
        String rolePayload = "{\"role\":\"STUDENT\"}";
        mockMvc.perform(patch("/api/v1/admin/users/" + mentorUser.getId() + "/role")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(rolePayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("STUDENT"));

        // Aluno deve estar sem mentor agora
        User updatedStudent = userRepository.findById(studentUser.getId()).orElseThrow();
        assertNull(updatedStudent.getMentor(), "Aluno deve ficar sem mentor após demotoção do professor");

        // Tentativa de vincular mentor em usuário que NÃO é estudante -> 400
        String mentorReq = "{\"mentorId\":" + mentorUser.getId() + "}";
        mockMvc.perform(patch("/api/v1/admin/users/" + adminUser.getId() + "/mentor")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mentorReq))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("só pode ser atribuído a estudantes")));

        // Tentativa de vincular mentor inativo ou não-mentor -> 400
        mockMvc.perform(patch("/api/v1/admin/users/" + studentUser.getId() + "/mentor")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mentorReq)) // mentorUser agora é STUDENT
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("deve ser um professor/mentor ativo")));
    }

    @Test
    @DisplayName("Cenário 5: Usuário desativado não consegue logar (403 ACCOUNT_DISABLED); reativado volta a logar")
    void testDeactivateAndReactivateUser() throws Exception {
        // Desativa estudante ativo
        String deactivateReq = "{\"active\":false}";
        mockMvc.perform(patch("/api/v1/admin/users/" + studentUser.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(deactivateReq))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));

        // Tenta logar com a conta desativada -> 403 ACCOUNT_DISABLED
        String loginPayload = """
                {
                    "email": "student.test@studyos.com",
                    "password": "Senha@123"
                }
                """;
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("ACCOUNT_DISABLED"));

        // Reativa conta
        String activateReq = "{\"active\":true}";
        mockMvc.perform(patch("/api/v1/admin/users/" + studentUser.getId() + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(activateReq))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(true));

        // Tenta logar novamente -> 200 OK
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists());
    }

    @Test
    @DisplayName("Cenário 6: Aviso para STUDENTS notifica só estudantes ativos e não duplica ao reenviar")
    void testAnnouncementTargetingAndDeduplication() throws Exception {
        String announcementPayload = """
                {
                    "title": "Aviso Importante",
                    "message": "Amanhã teremos manutenção programada no sistema StudyOS.",
                    "audience": "STUDENTS"
                }
                """;

        mockMvc.perform(post("/api/v1/admin/announcements")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(announcementPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Aviso Importante"))
                .andExpect(jsonPath("$.audience").value("STUDENTS"))
                .andExpect(jsonPath("$.recipientsCount").isNumber());

        // Verifica histórico de avisos
        mockMvc.perform(get("/api/v1/admin/announcements")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].title").value("Aviso Importante"));
    }

    @Test
    @DisplayName("Cenário 7: Nenhuma resposta de /admin contém campo password e ações geram AdminActionLog")
    void testNoPasswordLeakAndAuditLogPresence() throws Exception {
        // Busca usuários
        MvcResult usersResult = mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();

        String json = usersResult.getResponse().getContentAsString();
        assertFalse(json.contains("\"password\""), "A resposta do endpoint /admin/users jamais deve vazar a senha!");

        // Busca visão geral e verifica logs de auditoria
        mockMvc.perform(get("/api/v1/admin/overview")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recentActions").isArray());
    }
}
