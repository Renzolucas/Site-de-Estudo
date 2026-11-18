package com.studyos.api.controller;

import com.studyos.api.config.DemoDataSeeder;
import com.studyos.api.exception.custom.ForbiddenException;
import com.studyos.api.model.User;
import com.studyos.api.model.enums.UserRole;
import com.studyos.api.repository.user.UserRepository;
import com.studyos.api.service.auth.CurrentUserService;
import com.studyos.api.service.auth.JwtTokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Transactional
class RoleAndAccessControlTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenService jwtTokenService;

    @Autowired
    private CurrentUserService currentUserService;

    @Autowired
    private DemoDataSeeder demoDataSeeder;

    private User mentorUser;
    private User studentUser;
    private User inactiveUser;
    private String studentToken;
    private String inactiveToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();

        userRepository.findByEmail("prof.teste@studyos.com").ifPresent(userRepository::delete);
        userRepository.findByEmail("aluno.teste.role@studyos.com").ifPresent(userRepository::delete);
        userRepository.findByEmail("inativo.teste@studyos.com").ifPresent(userRepository::delete);

        mentorUser = User.builder()
                .name("Prof Mentor Teste")
                .email("prof.teste@studyos.com")
                .password("Senha@123")
                .role(UserRole.MENTOR)
                .active(true)
                .level(1)
                .currentXp(0L)
                .streakDays(0)
                .frozenCount(0)
                .build();
        mentorUser = userRepository.save(mentorUser);

        studentUser = User.builder()
                .name("Aluno Com Mentor")
                .email("aluno.teste.role@studyos.com")
                .password("Senha@123")
                .role(UserRole.STUDENT)
                .mentor(mentorUser)
                .active(true)
                .level(1)
                .currentXp(0L)
                .streakDays(0)
                .frozenCount(0)
                .build();
        studentUser = userRepository.save(studentUser);
        studentToken = jwtTokenService.generateToken(studentUser);

        inactiveUser = User.builder()
                .name("Aluno Desativado")
                .email("inativo.teste@studyos.com")
                .password("Senha@123")
                .role(UserRole.STUDENT)
                .active(false)
                .level(1)
                .currentXp(0L)
                .streakDays(0)
                .frozenCount(0)
                .build();
        inactiveUser = userRepository.save(inactiveUser);
        inactiveToken = jwtTokenService.generateToken(inactiveUser);
    }

    @Test
    @DisplayName("Cenário 1: Cadastro público ignora 'role' no payload e sempre cria STUDENT ativo")
    void testPublicRegistrationAlwaysCreatesStudent() throws Exception {
        String payload = """
                {
                    "name": "Tentativa Hacker",
                    "email": "hacker.%d@studyos.com",
                    "password": "SenhaSegura@123",
                    "role": "ADMIN"
                }
                """.formatted(System.currentTimeMillis());

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.role").value("STUDENT"))
                .andExpect(jsonPath("$.user.active").value(true));
    }

    @Test
    @DisplayName("Cenário 2: /auth/me devolve role e dados do mentor vinculado")
    void testAuthMeReturnsRoleAndMentor() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + studentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("STUDENT"))
                .andExpect(jsonPath("$.active").value(true))
                .andExpect(jsonPath("$.mentor").exists())
                .andExpect(jsonPath("$.mentor.id").value(mentorUser.getId()))
                .andExpect(jsonPath("$.mentor.name").value("Prof Mentor Teste"));
    }

    @Test
    @DisplayName("Cenário 3: Login de usuário inativo retorna 403 com código ACCOUNT_DISABLED")
    void testInactiveUserLoginReturns403AccountDisabled() throws Exception {
        String loginPayload = """
                {
                    "email": "inativo.teste@studyos.com",
                    "password": "Senha@123"
                }
                """;

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginPayload))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("ACCOUNT_DISABLED"))
                .andExpect(jsonPath("$.message", containsString("Conta desativada. Procure o administrador.")));
    }

    @Test
    @DisplayName("Cenário 4: Requisição autenticada com token de usuário inativo retorna 401")
    void testInactiveUserTokenReturns401OnAuthenticatedEndpoints() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer " + inactiveToken))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/notifications")
                        .header("Authorization", "Bearer " + inactiveToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Cenário 5: CurrentUserService.requireRole permite papel autorizado e lança Forbidden para outros")
    void testRequireRoleAllowsAuthorizedAndThrowsForbiddenForOthers() {
        // Aluno tem papel STUDENT
        assertDoesNotThrow(() -> {
            currentUserService.requireRole("Bearer " + studentToken, UserRole.STUDENT);
        });

        assertDoesNotThrow(() -> {
            currentUserService.requireRole("Bearer " + studentToken, UserRole.STUDENT, UserRole.MENTOR);
        });

        // Aluno tentando acessar recurso de MENTOR ou ADMIN
        ForbiddenException ex = assertThrows(ForbiddenException.class, () -> {
            currentUserService.requireRole("Bearer " + studentToken, UserRole.ADMIN, UserRole.MENTOR);
        });

        assertEquals("FORBIDDEN", ex.getErrorCode());
        assertEquals("Você não tem permissão para acessar este recurso.", ex.getMessage());
    }

    @Test
    @DisplayName("Cenário 6: DemoDataSeeder cria as 3 contas quando ligado e é idempotente")
    void testDemoDataSeederCreatesAccountsAndIsIdempotent() {
        userRepository.findByEmail("admin@studyos.demo").ifPresent(userRepository::delete);
        userRepository.findByEmail("professor@studyos.demo").ifPresent(userRepository::delete);
        userRepository.findByEmail("aluno@studyos.demo").ifPresent(userRepository::delete);

        // 1. Desligado não cria nada
        ReflectionTestUtils.setField(demoDataSeeder, "demoSeedEnabled", false);
        demoDataSeeder.run();
        assertFalse(userRepository.findByEmail("admin@studyos.demo").isPresent());

        // 2. Ligado cria as 3 contas
        ReflectionTestUtils.setField(demoDataSeeder, "demoSeedEnabled", true);
        demoDataSeeder.run();

        User admin = userRepository.findByEmail("admin@studyos.demo").orElseThrow();
        assertEquals(UserRole.ADMIN, admin.getRole());
        assertEquals("Administrador Demo", admin.getName());
        assertTrue(admin.getActive());

        User professor = userRepository.findByEmail("professor@studyos.demo").orElseThrow();
        assertEquals(UserRole.MENTOR, professor.getRole());
        assertEquals("Professor Demo", professor.getName());
        assertTrue(professor.getActive());

        User aluno = userRepository.findByEmail("aluno@studyos.demo").orElseThrow();
        assertEquals(UserRole.STUDENT, aluno.getRole());
        assertEquals("Aluno Demo", aluno.getName());
        assertNotNull(aluno.getMentor());
        assertEquals(professor.getId(), aluno.getMentor().getId());
        assertTrue(aluno.getActive());

        // 3. Executar novamente não duplica nem lança erro
        assertDoesNotThrow(() -> demoDataSeeder.run());
    }
}
