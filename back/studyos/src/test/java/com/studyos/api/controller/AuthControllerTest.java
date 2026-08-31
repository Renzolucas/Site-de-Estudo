package com.studyos.api.controller;

import com.studyos.api.controller.auth.AuthController;
import com.studyos.api.dto.auth.request.LoginRequest;
import com.studyos.api.dto.auth.response.AuthResponse;
import com.studyos.api.dto.user.request.UserRegisterRequest;
import com.studyos.api.dto.user.response.UserResponse;
import com.studyos.api.service.auth.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
    }

    @Test
    @DisplayName("POST /api/v1/auth/register - Deve cadastrar novo usuário com sucesso e retornar 201")
    void shouldRegisterUserSuccessfully() throws Exception {
        UserResponse userResponse = new UserResponse(1L, "Alexandre Dev", "alexandre@studyos.com", 1, 0L, 0);
        AuthResponse authResponse = AuthResponse.of("mock-jwt-token-12345", userResponse);

        when(authService.register(any(UserRegisterRequest.class))).thenReturn(authResponse);

        String jsonPayload = """
                {
                    "name": "Alexandre Dev",
                    "email": "alexandre@studyos.com",
                    "password": "password123"
                }
                """;

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("mock-jwt-token-12345"))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.id").value(1))
                .andExpect(jsonPath("$.user.name").value("Alexandre Dev"))
                .andExpect(jsonPath("$.user.email").value("alexandre@studyos.com"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login - Deve autenticar usuário com sucesso e retornar 200")
    void shouldLoginSuccessfully() throws Exception {
        UserResponse userResponse = new UserResponse(1L, "Alexandre Dev", "alexandre@studyos.com", 2, 650L, 5);
        AuthResponse authResponse = AuthResponse.of("valid-jwt-token", userResponse);

        when(authService.login(any(LoginRequest.class))).thenReturn(authResponse);

        String jsonPayload = """
                {
                    "email": "alexandre@studyos.com",
                    "password": "password123"
                }
                """;

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("valid-jwt-token"))
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.id").value(1))
                .andExpect(jsonPath("$.user.name").value("Alexandre Dev"))
                .andExpect(jsonPath("$.user.level").value(2))
                .andExpect(jsonPath("$.user.currentXp").value(650));
    }

    @Test
    @DisplayName("GET /api/v1/auth/me - Deve retornar perfil do usuário autenticado com Bearer token")
    void shouldGetAuthenticatedUser() throws Exception {
        UserResponse userResponse = new UserResponse(1L, "Alexandre Dev", "alexandre@studyos.com", 3, 1200L, 7);

        when(authService.getAuthenticatedUser(eq("Bearer valid-jwt-token"))).thenReturn(userResponse);

        mockMvc.perform(get("/api/v1/auth/me")
                        .header("Authorization", "Bearer valid-jwt-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Alexandre Dev"))
                .andExpect(jsonPath("$.level").value(3))
                .andExpect(jsonPath("$.currentXp").value(1200))
                .andExpect(jsonPath("$.streakDays").value(7));
    }
}
