package com.studyos.api.controller;

import com.studyos.api.controller.gamification.GamificationController;
import com.studyos.api.dto.gamification.response.LeaderboardUserResponse;
import com.studyos.api.service.user.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class GamificationControllerTest {

    private MockMvc mockMvc;

    @Mock
    private UserService userService;

    @InjectMocks
    private GamificationController gamificationController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(gamificationController).build();
    }

    @Test
    @DisplayName("GET /api/v1/gamification/leaderboard - Deve retornar o leaderboard de usuários")
    void shouldGetLeaderboard() throws Exception {
        List<LeaderboardUserResponse> leaderboard = List.of(
                new LeaderboardUserResponse(1L, "Player Top 1", 10, 5000L, 30),
                new LeaderboardUserResponse(2L, "Player Top 2", 8, 3800L, 20),
                new LeaderboardUserResponse(3L, "Player Top 3", 6, 2600L, 15)
        );

        when(userService.getLeaderboard()).thenReturn(leaderboard);

        mockMvc.perform(get("/api/v1/gamification/leaderboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].name").value("Player Top 1"))
                .andExpect(jsonPath("$[0].level").value(10))
                .andExpect(jsonPath("$[0].currentXp").value(5000))
                .andExpect(jsonPath("$[1].name").value("Player Top 2"))
                .andExpect(jsonPath("$[2].name").value("Player Top 3"));
    }
}
