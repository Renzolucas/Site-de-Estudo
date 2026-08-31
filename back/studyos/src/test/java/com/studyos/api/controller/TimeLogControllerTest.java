package com.studyos.api.controller;

import com.studyos.api.controller.timelog.TimeLogController;
import com.studyos.api.dto.timelog.request.TimeLogCreateRequest;
import com.studyos.api.dto.timelog.response.TimeLogResponse;
import com.studyos.api.model.enums.CompletionStatus;
import com.studyos.api.service.timelog.TimeLogService;
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

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class TimeLogControllerTest {

    private MockMvc mockMvc;

    @Mock
    private TimeLogService timeLogService;

    @InjectMocks
    private TimeLogController timeLogController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(timeLogController).build();
    }

    @Test
    @DisplayName("POST /api/v1/timelogs - Deve registrar tempo de estudo com sucesso e retornar 201 com Location")
    void shouldLogTimeSuccessfully() throws Exception {
        TimeLogResponse response = new TimeLogResponse(
                50L,
                10L,
                "Spring Boot Study",
                90,
                CompletionStatus.COMPLETED,
                "Sessão muito produtiva",
                LocalDateTime.now()
        );

        when(timeLogService.logTime(any(TimeLogCreateRequest.class))).thenReturn(response);

        String jsonPayload = """
                {
                    "taskId": 10,
                    "loggedDurationMinutes": 90,
                    "completionStatus": "COMPLETED",
                    "notes": "Sessão muito produtiva"
                }
                """;

        mockMvc.perform(post("/api/v1/timelogs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.id").value(50))
                .andExpect(jsonPath("$.taskId").value(10))
                .andExpect(jsonPath("$.loggedDurationMinutes").value(90))
                .andExpect(jsonPath("$.completionStatus").value("COMPLETED"))
                .andExpect(jsonPath("$.notes").value("Sessão muito produtiva"));
    }

    @Test
    @DisplayName("GET /api/v1/timelogs/{id} - Deve retornar registro de tempo por ID")
    void shouldFindTimeLogById() throws Exception {
        TimeLogResponse response = new TimeLogResponse(
                50L,
                10L,
                "Spring Boot Study",
                90,
                CompletionStatus.COMPLETED,
                "Notas",
                LocalDateTime.now()
        );

        when(timeLogService.findById(50L)).thenReturn(response);

        mockMvc.perform(get("/api/v1/timelogs/50"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(50))
                .andExpect(jsonPath("$.taskTitle").value("Spring Boot Study"));
    }

    @Test
    @DisplayName("GET /api/v1/timelogs/task/{taskId} - Deve retornar registros de tempo da tarefa")
    void shouldFindTimeLogsByTaskId() throws Exception {
        List<TimeLogResponse> list = List.of(
                new TimeLogResponse(1L, 10L, "Task 10", 45, CompletionStatus.PARTIAL, "Part 1", LocalDateTime.now()),
                new TimeLogResponse(2L, 10L, "Task 10", 60, CompletionStatus.COMPLETED, "Part 2", LocalDateTime.now())
        );

        when(timeLogService.findByTaskId(10L)).thenReturn(list);

        mockMvc.perform(get("/api/v1/timelogs/task/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].loggedDurationMinutes").value(45))
                .andExpect(jsonPath("$[1].loggedDurationMinutes").value(60));
    }

    @Test
    @DisplayName("GET /api/v1/timelogs/user/{userId} - Deve retornar registros de tempo do usuário")
    void shouldFindTimeLogsByUserId() throws Exception {
        List<TimeLogResponse> list = List.of(
                new TimeLogResponse(1L, 10L, "Task A", 60, CompletionStatus.COMPLETED, "Ok", LocalDateTime.now())
        );

        when(timeLogService.findByUserId(1L)).thenReturn(list);

        mockMvc.perform(get("/api/v1/timelogs/user/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @DisplayName("DELETE /api/v1/timelogs/{id} - Deve excluir registro de tempo e retornar 204")
    void shouldDeleteTimeLog() throws Exception {
        doNothing().when(timeLogService).delete(50L);

        mockMvc.perform(delete("/api/v1/timelogs/50"))
                .andExpect(status().isNoContent());
    }
}
