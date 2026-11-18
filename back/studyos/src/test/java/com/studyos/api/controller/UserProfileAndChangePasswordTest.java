package com.studyos.api.controller;

import com.studyos.api.model.User;
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

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Transactional
class UserProfileAndChangePasswordTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenService jwtTokenService;

    private User userA;
    private User userB;
    private String tokenA;
    private String tokenB;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();

        userRepository.findByEmail("aluno.a@studyos.com").ifPresent(userRepository::delete);
        userRepository.findByEmail("aluno.b@studyos.com").ifPresent(userRepository::delete);

        userA = User.builder()
                .name("Aluno A Original")
                .email("aluno.a@studyos.com")
                .password("senhaAtual123")
                .level(2)
                .currentXp(120L)
                .streakDays(5)
                .frozenCount(1)
                .build();
        userA = userRepository.save(userA);
        tokenA = jwtTokenService.generateToken(userA);

        userB = User.builder()
                .name("Aluno B")
                .email("aluno.b@studyos.com")
                .password("senhaAlunoB123")
                .level(1)
                .currentXp(0L)
                .streakDays(0)
                .frozenCount(0)
                .build();
        userB = userRepository.save(userB);
        tokenB = jwtTokenService.generateToken(userB);
    }

    @Test
    @DisplayName("Cenário 1: Alteração de nome com sucesso (200)")
    void testUpdateNameSuccess() throws Exception {
        String json = """
                {
                    "name": "Aluno A Atualizado"
                }
                """;

        mockMvc.perform(patch("/api/v1/users/me")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(userA.getId()))
                .andExpect(jsonPath("$.name").value("Aluno A Atualizado"))
                .andExpect(jsonPath("$.email").value("aluno.a@studyos.com"));

        User reloaded = userRepository.findById(userA.getId()).orElseThrow();
        assertEquals("Aluno A Atualizado", reloaded.getName());
    }

    @Test
    @DisplayName("Cenário 2: Validação de nome - vazio, curto (<2) e longo (>100) retornam 400")
    void testUpdateNameValidation() throws Exception {
        // Nome vazio/espaços
        String emptyJson = """
                {
                    "name": "   "
                }
                """;
        mockMvc.perform(patch("/api/v1/users/me")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(emptyJson))
                .andExpect(status().isBadRequest());

        // Nome curto (< 2 caracteres)
        String shortJson = """
                {
                    "name": "A"
                }
                """;
        mockMvc.perform(patch("/api/v1/users/me")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(shortJson))
                .andExpect(status().isBadRequest());

        // Nome muito longo (> 100 caracteres)
        String longJson = """
                {
                    "name": "%s"
                }
                """.formatted("A".repeat(101));
        mockMvc.perform(patch("/api/v1/users/me")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(longJson))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Cenário 3: Alteração de senha com sucesso (200) e login funcional com nova senha")
    void testChangePasswordSuccessAndLogin() throws Exception {
        String changeJson = """
                {
                    "currentPassword": "senhaAtual123",
                    "newPassword": "novaSenhaSegura456"
                }
                """;

        mockMvc.perform(post("/api/v1/auth/change-password")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(changeJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Senha alterada com sucesso."));

        // Login com a senha antiga deve falhar (400)
        String oldLoginJson = """
                {
                    "email": "aluno.a@studyos.com",
                    "password": "senhaAtual123"
                }
                """;
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(oldLoginJson))
                .andExpect(status().isBadRequest());

        // Login com a nova senha deve ter sucesso (200)
        String newLoginJson = """
                {
                    "email": "aluno.a@studyos.com",
                    "password": "novaSenhaSegura456"
                }
                """;
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(newLoginJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.user.email").value("aluno.a@studyos.com"));
    }

    @Test
    @DisplayName("Cenário 4: Validação de alteração de senha - senha errada, igual à atual, ou fraca")
    void testChangePasswordValidations() throws Exception {
        // Senha atual incorreta
        String wrongCurrentJson = """
                {
                    "currentPassword": "senhaTotalmenteErrada",
                    "newPassword": "novaSenha123"
                }
                """;
        mockMvc.perform(post("/api/v1/auth/change-password")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(wrongCurrentJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Senha atual incorreta")));

        // Nova senha idêntica à atual
        String samePasswordJson = """
                {
                    "currentPassword": "senhaAtual123",
                    "newPassword": "senhaAtual123"
                }
                """;
        mockMvc.perform(post("/api/v1/auth/change-password")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(samePasswordJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("diferente")));

        // Nova senha fraca (< 6 caracteres)
        String weakPasswordJson = """
                {
                    "currentPassword": "senhaAtual123",
                    "newPassword": "12345"
                }
                """;
        mockMvc.perform(post("/api/v1/auth/change-password")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(weakPasswordJson))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Cenário 5: Chamadas sem token retornam 401 Unauthorized")
    void testMissingTokenReturns401() throws Exception {
        String nameJson = """
                {
                    "name": "Nome Sem Token"
                }
                """;
        mockMvc.perform(patch("/api/v1/users/me")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(nameJson))
                .andExpect(status().isUnauthorized());

        String passwordJson = """
                {
                    "currentPassword": "senhaAtual123",
                    "newPassword": "novaSenha123"
                }
                """;
        mockMvc.perform(post("/api/v1/auth/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(passwordJson))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Cenário 6: Usuário A não altera dados de Usuário B - isolamento via Bearer token")
    void testUserCannotAlterOtherUserData() throws Exception {
        // Usuário A altera seu próprio nome
        String updateNameA = """
                {
                    "name": "Nome Modificado de A"
                }
                """;
        mockMvc.perform(patch("/api/v1/users/me")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateNameA))
                .andExpect(status().isOk());

        // Verifica que Usuário B permanece inalterado
        User checkB = userRepository.findById(userB.getId()).orElseThrow();
        assertEquals("Aluno B", checkB.getName());

        // Usuário B altera sua senha usando tokenB
        String changePasswordB = """
                {
                    "currentPassword": "senhaAlunoB123",
                    "newPassword": "novaSenhaB456"
                }
                """;
        mockMvc.perform(post("/api/v1/auth/change-password")
                        .header("Authorization", "Bearer " + tokenB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(changePasswordB))
                .andExpect(status().isOk());

        // Verifica que a senha de Usuário A permanece inalterada
        User checkA = userRepository.findById(userA.getId()).orElseThrow();
        assertEquals("senhaAtual123", checkA.getPassword());
    }
}
