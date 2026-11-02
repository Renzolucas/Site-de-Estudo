package com.studyos.api.controller;

import com.studyos.api.controller.task.TaskController;
import com.studyos.api.dto.task.request.TaskCreateRequest;
import com.studyos.api.dto.task.request.TaskUpdateRequest;
import com.studyos.api.dto.task.response.TaskResponse;
import com.studyos.api.exception.handler.GlobalExceptionHandler;
import com.studyos.api.model.enums.SeasonCode;
import com.studyos.api.model.enums.TaskCategory;
import com.studyos.api.model.enums.TaskStatus;
import com.studyos.api.service.task.TaskService;
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

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class TaskControllerTest {

    private MockMvc mockMvc;

    @Mock
    private TaskService taskService;

    @InjectMocks
    private TaskController taskController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(taskController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    @DisplayName("POST /api/v1/tasks - Deve criar uma tarefa com sucesso e retornar 201 com header Location")
    void shouldCreateTaskSuccessfully() throws Exception {
        TaskResponse response = new TaskResponse(
                10L,
                1L,
                "Estudar Spring Security",
                "Foco em JWT e OAuth2",
                TaskCategory.JAVA_BACKEND,
                SeasonCode.SUMMER,
                120,
                null,
                TaskStatus.PENDING,
                LocalDate.of(2026, 9, 15),
                LocalDate.of(2026, 9, 20),
                100
        );

        when(taskService.create(any(TaskCreateRequest.class))).thenReturn(response);

        String jsonPayload = """
                {
                    "userId": 1,
                    "title": "Estudar Spring Security",
                    "description": "Foco em JWT e OAuth2",
                    "category": "JAVA_BACKEND",
                    "season": "SUMMER",
                    "plannedDurationMinutes": 120,
                    "startDate": "2026-09-15",
                    "endDate": "2026-09-20",
                    "xpReward": 100
                }
                """;

        mockMvc.perform(post("/api/v1/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.userId").value(1))
                .andExpect(jsonPath("$.title").value("Estudar Spring Security"))
                .andExpect(jsonPath("$.category").value("JAVA_BACKEND"))
                .andExpect(jsonPath("$.season").value("SUMMER"))
                .andExpect(jsonPath("$.plannedDurationMinutes").value(120))
                .andExpect(jsonPath("$.startDate").value("2026-09-15"))
                .andExpect(jsonPath("$.endDate").value("2026-09-20"))
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.xpReward").value(100));
    }

    @Test
    @DisplayName("POST /api/v1/tasks - Deve retornar 400 quando endDate for anterior a startDate")
    void shouldFailWhenEndDateIsBeforeStartDate() throws Exception {
        String jsonPayload = """
                {
                    "userId": 1,
                    "title": "Estudar Spring Security",
                    "description": "Foco em JWT e OAuth2",
                    "category": "JAVA_BACKEND",
                    "season": "SUMMER",
                    "plannedDurationMinutes": 120,
                    "startDate": "2026-09-20",
                    "endDate": "2026-09-15",
                    "xpReward": 100
                }
                """;

        mockMvc.perform(post("/api/v1/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/v1/tasks - Deve retornar 400 quando startDate ou endDate for nulo")
    void shouldFailWhenDatesAreNull() throws Exception {
        String jsonPayload = """
                {
                    "userId": 1,
                    "title": "Estudar Spring Security",
                    "description": "Foco em JWT e OAuth2",
                    "category": "JAVA_BACKEND",
                    "season": "SUMMER",
                    "plannedDurationMinutes": 120,
                    "xpReward": 100
                }
                """;

        mockMvc.perform(post("/api/v1/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET /api/v1/tasks/{id} - Deve retornar tarefa por ID")
    void shouldFindTaskById() throws Exception {
        TaskResponse response = new TaskResponse(
                10L,
                1L,
                "Estudar Spring Security",
                "Foco em JWT",
                TaskCategory.JAVA_BACKEND,
                SeasonCode.SUMMER,
                120,
                null,
                TaskStatus.PENDING,
                LocalDate.of(2026, 9, 15),
                LocalDate.of(2026, 9, 20),
                100
        );

        when(taskService.findById(10L)).thenReturn(response);

        mockMvc.perform(get("/api/v1/tasks/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.title").value("Estudar Spring Security"))
                .andExpect(jsonPath("$.startDate").value("2026-09-15"))
                .andExpect(jsonPath("$.endDate").value("2026-09-20"));
    }

    @Test
    @DisplayName("GET /api/v1/tasks/user/{userId} - Deve listar tarefas do usuário")
    void shouldFindTasksByUser() throws Exception {
        List<TaskResponse> list = List.of(
                new TaskResponse(1L, 1L, "Task 1", "Desc 1", TaskCategory.JAVA_BACKEND, SeasonCode.SUMMER, 60, null, TaskStatus.PENDING, LocalDate.now(), LocalDate.now(), 80),
                new TaskResponse(2L, 1L, "Task 2", "Desc 2", TaskCategory.FRONTEND, SeasonCode.AUTUMN, 90, null, TaskStatus.COMPLETED, LocalDate.now(), LocalDate.now(), 90)
        );

        when(taskService.findByUserId(1L)).thenReturn(list);

        mockMvc.perform(get("/api/v1/tasks/user/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[1].id").value(2));
    }

    @Test
    @DisplayName("GET /api/v1/tasks/user/{userId}?season=SUMMER - Deve filtrar tarefas por estação")
    void shouldFindTasksByUserAndSeason() throws Exception {
        List<TaskResponse> list = List.of(
                new TaskResponse(1L, 1L, "Task Summer", "Desc", TaskCategory.JAVA_BACKEND, SeasonCode.SUMMER, 60, null, TaskStatus.PENDING, LocalDate.now(), LocalDate.now(), 80)
        );

        when(taskService.findByUserIdAndSeason(1L, SeasonCode.SUMMER)).thenReturn(list);

        mockMvc.perform(get("/api/v1/tasks/user/1?season=SUMMER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].season").value("SUMMER"));
    }

    @Test
    @DisplayName("PUT /api/v1/tasks/{id} - Deve atualizar tarefa com sucesso")
    void shouldUpdateTask() throws Exception {
        TaskResponse response = new TaskResponse(
                10L,
                1L,
                "Título Atualizado",
                "Nova Descrição",
                TaskCategory.DATABASE,
                SeasonCode.AUTUMN,
                90,
                null,
                TaskStatus.IN_PROGRESS,
                LocalDate.of(2026, 10, 1),
                LocalDate.of(2026, 10, 10),
                110
        );

        when(taskService.update(eq(10L), any(TaskUpdateRequest.class))).thenReturn(response);

        String jsonPayload = """
                {
                    "title": "Título Atualizado",
                    "description": "Nova Descrição",
                    "category": "DATABASE",
                    "season": "AUTUMN",
                    "plannedDurationMinutes": 90,
                    "startDate": "2026-10-01",
                    "endDate": "2026-10-10",
                    "xpReward": 110
                }
                """;

        mockMvc.perform(put("/api/v1/tasks/10")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.title").value("Título Atualizado"))
                .andExpect(jsonPath("$.category").value("DATABASE"))
                .andExpect(jsonPath("$.startDate").value("2026-10-01"))
                .andExpect(jsonPath("$.endDate").value("2026-10-10"));
    }

    @Test
    @DisplayName("PATCH /api/v1/tasks/{id}/status - Deve atualizar apenas o status da tarefa")
    void shouldUpdateTaskStatus() throws Exception {
        TaskResponse response = new TaskResponse(
                10L,
                1L,
                "Estudo",
                "Desc",
                TaskCategory.JAVA_BACKEND,
                SeasonCode.SUMMER,
                60,
                60,
                TaskStatus.COMPLETED,
                LocalDate.now(),
                LocalDate.now(),
                80
        );

        when(taskService.updateStatus(10L, TaskStatus.COMPLETED)).thenReturn(response);

        String jsonPayload = """
                {
                    "status": "COMPLETED"
                }
                """;

        mockMvc.perform(patch("/api/v1/tasks/10/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.status").value("COMPLETED"));
    }

    @Test
    @DisplayName("DELETE /api/v1/tasks/{id} - Deve excluir tarefa e retornar 204 No Content")
    void shouldDeleteTask() throws Exception {
        doNothing().when(taskService).delete(10L);

        mockMvc.perform(delete("/api/v1/tasks/10"))
                .andExpect(status().isNoContent());
    }
}
