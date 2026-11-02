package com.studyos.api.controller;

import com.studyos.api.controller.season.SeasonController;
import com.studyos.api.dto.season.request.SeasonUpdateDTO;
import com.studyos.api.dto.season.response.SeasonResponse;
import com.studyos.api.model.enums.SeasonCode;
import com.studyos.api.service.season.SeasonService;
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

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class SeasonControllerTest {

    private MockMvc mockMvc;

    @Mock
    private SeasonService seasonService;

    @InjectMocks
    private SeasonController seasonController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(seasonController).build();
    }

    @Test
    @DisplayName("GET /api/v1/seasons/user/{userId} - Deve retornar estações do usuário")
    void shouldReturnUserSeasons() throws Exception {
        List<SeasonResponse> seasons = List.of(
                new SeasonResponse(1L, SeasonCode.SUMMER, "Verão", "Metas de Verão", "Q1", 1L),
                new SeasonResponse(2L, SeasonCode.AUTUMN, "Outono", "Metas de Outono", "Q2", 1L),
                new SeasonResponse(3L, SeasonCode.WINTER, "Inverno", "Metas de Inverno", "Q3", 1L),
                new SeasonResponse(4L, SeasonCode.SPRING, "Primavera", "Metas de Primavera", "Q4", 1L)
        );

        when(seasonService.findByUserId(1L)).thenReturn(seasons);

        mockMvc.perform(get("/api/v1/seasons/user/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(4))
                .andExpect(jsonPath("$[0].code").value("SUMMER"))
                .andExpect(jsonPath("$[0].quarter").value("Q1"))
                .andExpect(jsonPath("$[0].title").value("Verão"))
                .andExpect(jsonPath("$[1].code").value("AUTUMN"))
                .andExpect(jsonPath("$[1].quarter").value("Q2"));
    }

    @Test
    @DisplayName("GET /api/v1/seasons/{id} - Deve retornar estação por ID")
    void shouldFindSeasonById() throws Exception {
        SeasonResponse response = new SeasonResponse(1L, SeasonCode.SUMMER, "Verão", "Metas", "Q1", 1L);

        when(seasonService.findById(1L)).thenReturn(response);

        mockMvc.perform(get("/api/v1/seasons/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.code").value("SUMMER"))
                .andExpect(jsonPath("$.title").value("Verão"));
    }

    @Test
    @DisplayName("PUT /api/v1/seasons/{id} - Deve atualizar título e descrição da estação")
    void shouldUpdateSeason() throws Exception {
        SeasonResponse updated = new SeasonResponse(1L, SeasonCode.SUMMER, "Verão 2026", "Novas metas e foco total", "Q1", 1L);

        when(seasonService.update(eq(1L), any(SeasonUpdateDTO.class))).thenReturn(updated);

        String jsonPayload = """
                {
                    "title": "Verão 2026",
                    "description": "Novas metas e foco total"
                }
                """;

        mockMvc.perform(put("/api/v1/seasons/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("Verão 2026"))
                .andExpect(jsonPath("$.description").value("Novas metas e foco total"));
    }
}
