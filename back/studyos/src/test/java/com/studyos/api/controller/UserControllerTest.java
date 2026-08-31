package com.studyos.api.controller;

import com.studyos.api.controller.user.UserController;
import com.studyos.api.dto.gamification.response.StudyStatsResponse;
import com.studyos.api.dto.user.request.UserRegisterRequest;
import com.studyos.api.dto.user.request.UserUpdateRequest;
import com.studyos.api.dto.user.response.UserResponse;
import com.studyos.api.service.user.UserService;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    private MockMvc mockMvc;

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(userController).build();
    }

    @Test
    @DisplayName("POST /api/v1/users - Deve cadastrar usuário via endpoint de usuários e retornar 201 com Location")
    void shouldRegisterUser() throws Exception {
        UserResponse response = new UserResponse(1L, "Alexandre Dev", "alexandre@studyos.com", 1, 0L, 0);

        when(userService.register(any(UserRegisterRequest.class))).thenReturn(response);

        String jsonPayload = """
                {
                    "name": "Alexandre Dev",
                    "email": "alexandre@studyos.com",
                    "password": "senhaSegura123"
                }
                """;

        mockMvc.perform(post("/api/v1/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Alexandre Dev"))
                .andExpect(jsonPath("$.email").value("alexandre@studyos.com"));
    }

    @Test
    @DisplayName("GET /api/v1/users/{id} - Deve retornar usuário por ID")
    void shouldFindUserById() throws Exception {
        UserResponse response = new UserResponse(1L, "Alexandre Dev", "alexandre@studyos.com", 5, 2400L, 12);

        when(userService.findById(1L)).thenReturn(response);

        mockMvc.perform(get("/api/v1/users/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Alexandre Dev"))
                .andExpect(jsonPath("$.level").value(5))
                .andExpect(jsonPath("$.currentXp").value(2400))
                .andExpect(jsonPath("$.streakDays").value(12));
    }

    @Test
    @DisplayName("PUT /api/v1/users/{id} - Deve atualizar dados do usuário")
    void shouldUpdateUser() throws Exception {
        UserResponse response = new UserResponse(1L, "Alexandre Atualizado", "alexandre@studyos.com", 5, 2400L, 12);

        when(userService.update(eq(1L), any(UserUpdateRequest.class))).thenReturn(response);

        String jsonPayload = """
                {
                    "name": "Alexandre Atualizado"
                }
                """;

        mockMvc.perform(put("/api/v1/users/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Alexandre Atualizado"));
    }

    @Test
    @DisplayName("GET /api/v1/users/{id}/stats - Deve retornar estatísticas de estudo e gamificação do usuário")
    void shouldGetUserStats() throws Exception {
        StudyStatsResponse stats = new StudyStatsResponse(1620L, 24L, 12, 2400L, 5);

        when(userService.getUserStats(1L)).thenReturn(stats);

        mockMvc.perform(get("/api/v1/users/1/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalStudyMinutes").value(1620))
                .andExpect(jsonPath("$.totalTasksCompleted").value(24))
                .andExpect(jsonPath("$.streakDays").value(12))
                .andExpect(jsonPath("$.currentXp").value(2400))
                .andExpect(jsonPath("$.level").value(5));
    }
}
