package com.studyos.api.controller;

import com.studyos.api.model.PasswordResetToken;
import com.studyos.api.model.User;
import com.studyos.api.repository.auth.PasswordResetTokenRepository;
import com.studyos.api.repository.user.UserRepository;
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

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@Transactional
class PasswordResetFlowTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordResetTokenRepository tokenRepository;

    private User testUser;
    private final String testEmail = "aluno.recupera@studyos.com";

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
        tokenRepository.deleteAll();
        userRepository.findByEmail(testEmail).ifPresent(userRepository::delete);

        testUser = User.builder()
                .name("Aluno Recuperacao")
                .email(testEmail)
                .password("senhaAntiga123")
                .level(1)
                .currentXp(0L)
                .streakDays(0)
                .frozenCount(0)
                .build();
        userRepository.save(testUser);
    }

    @Test
    @DisplayName("Cenário 1: Fluxo completo de recuperação com sucesso e login com nova senha")
    void testCompletePasswordResetFlow() throws Exception {
        String forgotJson = """
                {
                    "email": "%s"
                }
                """.formatted(testEmail);

        MvcResult forgotResult = mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(forgotJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists())
                .andExpect(jsonPath("$.demoCode").exists())
                .andReturn();

        PasswordResetToken savedToken = tokenRepository.findTopByEmailOrderByCreatedAtDesc(testEmail).orElseThrow();
        String generatedCode = savedToken.getCode();
        assertNotNull(generatedCode);
        assertEquals(6, generatedCode.length());

        String verifyJson = """
                {
                    "email": "%s",
                    "code": "%s"
                }
                """.formatted(testEmail, generatedCode);

        mockMvc.perform(post("/api/v1/auth/verify-reset-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(verifyJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid").value(true));

        String resetJson = """
                {
                    "email": "%s",
                    "code": "%s",
                    "newPassword": "novaSenha456"
                }
                """.formatted(testEmail, generatedCode);

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(resetJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Senha redefinida com sucesso!"));

        String loginJson = """
                {
                    "email": "%s",
                    "password": "novaSenha456"
                }
                """.formatted(testEmail);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists());
    }

    @Test
    @DisplayName("Cenário 2: E-mail inexistente retorna resposta genérica 200 sem expor código")
    void testForgotPasswordWithNonExistentEmail() throws Exception {
        String forgotJson = """
                {
                    "email": "inexistente@studyos.com"
                }
                """;

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(forgotJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Se o e-mail estiver cadastrado, um código de verificação foi enviado."))
                .andExpect(jsonPath("$.demoCode").doesNotExist());
    }

    @Test
    @DisplayName("Cenário 3: Código incorreto retorna 400 e incrementa tentativas")
    void testWrongCodeIncrementsAttempts() throws Exception {
        String forgotJson = """
                {
                    "email": "%s"
                }
                """.formatted(testEmail);

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(forgotJson))
                .andExpect(status().isOk());

        String verifyJson = """
                {
                    "email": "%s",
                    "code": "000000"
                }
                """.formatted(testEmail);

        mockMvc.perform(post("/api/v1/auth/verify-reset-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(verifyJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Código incorreto. Você tem mais 4 tentativa(s)."));

        PasswordResetToken token = tokenRepository.findTopByEmailOrderByCreatedAtDesc(testEmail).orElseThrow();
        assertEquals(1, token.getAttempts());
        assertFalse(token.getUsed());
    }

    @Test
    @DisplayName("Cenário 4: 5 tentativas erradas invalidam o código")
    void testFiveFailedAttemptsInvalidateToken() throws Exception {
        String forgotJson = """
                {
                    "email": "%s"
                }
                """.formatted(testEmail);

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(forgotJson))
                .andExpect(status().isOk());

        for (int i = 0; i < 4; i++) {
            String attemptJson = """
                    {
                        "email": "%s",
                        "code": "00000%d"
                    }
                    """.formatted(testEmail, i);

            mockMvc.perform(post("/api/v1/auth/verify-reset-code")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(attemptJson))
                    .andExpect(status().isBadRequest());
        }

        String finalAttemptJson = """
                {
                    "email": "%s",
                    "code": "999999"
                }
                """.formatted(testEmail);

        mockMvc.perform(post("/api/v1/auth/verify-reset-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(finalAttemptJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Número máximo de tentativas excedido. O código foi invalidado. Solicite um novo código."));

        PasswordResetToken token = tokenRepository.findTopByEmailOrderByCreatedAtDesc(testEmail).orElseThrow();
        assertEquals(5, token.getAttempts());
        assertTrue(token.getUsed());
    }

    @Test
    @DisplayName("Cenário 5: Código expirado (mais de 10 minutos) é rejeitado")
    void testExpiredCodeIsRejected() throws Exception {
        PasswordResetToken expiredToken = PasswordResetToken.builder()
                .email(testEmail)
                .user(testUser)
                .code("123456")
                .expiresAt(LocalDateTime.now().minusMinutes(1))
                .attempts(0)
                .used(false)
                .build();
        tokenRepository.save(expiredToken);

        String verifyJson = """
                {
                    "email": "%s",
                    "code": "123456"
                }
                """.formatted(testEmail);

        mockMvc.perform(post("/api/v1/auth/verify-reset-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(verifyJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Código expirado. O código tem validade de 10 minutos. Solicite um novo código."));
    }

    @Test
    @DisplayName("Cenário 6: Código já utilizado não pode ser reutilizado")
    void testAlreadyUsedCodeCannotBeReused() throws Exception {
        PasswordResetToken usedToken = PasswordResetToken.builder()
                .email(testEmail)
                .user(testUser)
                .code("654321")
                .expiresAt(LocalDateTime.now().plusMinutes(10))
                .attempts(0)
                .used(true)
                .build();
        tokenRepository.save(usedToken);

        String verifyJson = """
                {
                    "email": "%s",
                    "code": "654321"
                }
                """.formatted(testEmail);

        mockMvc.perform(post("/api/v1/auth/verify-reset-code")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(verifyJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Este código já foi utilizado. Solicite um novo código."));
    }

    @Test
    @DisplayName("Cenário 7: POST /auth/forgot-password deve responder 200 tanto para e-mail cadastrado quanto inexistente")
    void testForgotPasswordAlwaysReturns200ForRegisteredAndNonExistentEmail() throws Exception {
        // 1. E-mail cadastrado
        String registeredJson = """
                {
                    "email": "%s"
                }
                """.formatted(testEmail);

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registeredJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Se o e-mail estiver cadastrado, um código de verificação foi enviado."));

        // 2. E-mail inexistente
        String nonExistentJson = """
                {
                    "email": "desconhecido@studyos.com"
                }
                """;

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(nonExistentJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Se o e-mail estiver cadastrado, um código de verificação foi enviado."));
    }
}
