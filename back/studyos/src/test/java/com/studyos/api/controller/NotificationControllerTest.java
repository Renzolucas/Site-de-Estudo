package com.studyos.api.controller;

import com.studyos.api.dto.auth.request.ChangePasswordRequest;
import com.studyos.api.dto.user.request.UserRegisterRequest;
import com.studyos.api.model.Notification;
import com.studyos.api.model.Task;
import com.studyos.api.model.User;
import com.studyos.api.model.enums.NotificationType;
import com.studyos.api.model.enums.TaskCategory;
import com.studyos.api.model.enums.TaskStatus;
import com.studyos.api.repository.notification.NotificationRepository;
import com.studyos.api.repository.task.TaskRepository;
import com.studyos.api.repository.user.UserRepository;
import com.studyos.api.service.auth.AuthService;
import com.studyos.api.service.auth.JwtTokenService;
import com.studyos.api.service.gamification.GamificationService;
import com.studyos.api.service.notification.NotificationService;
import com.studyos.api.service.user.UserService;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@Transactional
class NotificationControllerTest {

    private MockMvc mockMvc;

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private JwtTokenService jwtTokenService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private UserService userService;

    @Autowired
    private GamificationService gamificationService;

    @Autowired
    private AuthService authService;

    private User userA;
    private User userB;
    private String tokenA;
    private String tokenB;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();

        notificationRepository.deleteAll();
        taskRepository.deleteAll();
        userRepository.findByEmail("notif.a@studyos.com").ifPresent(userRepository::delete);
        userRepository.findByEmail("notif.b@studyos.com").ifPresent(userRepository::delete);

        userA = User.builder()
                .name("Usuario Notificacao A")
                .email("notif.a@studyos.com")
                .password("senhaSegura123")
                .level(1)
                .currentXp(0L)
                .streakDays(0)
                .frozenCount(0)
                .build();
        userA = userRepository.save(userA);
        tokenA = jwtTokenService.generateToken(userA);

        userB = User.builder()
                .name("Usuario Notificacao B")
                .email("notif.b@studyos.com")
                .password("senhaSegura123")
                .level(1)
                .currentXp(0L)
                .streakDays(0)
                .frozenCount(0)
                .build();
        userB = userRepository.save(userB);
        tokenB = jwtTokenService.generateToken(userB);
    }

    @Test
    @DisplayName("Cenário 1: Listar notificações retorna apenas as do usuário do token")
    void testGetNotificationsOnlyForAuthenticatedUser() throws Exception {
        Notification notifA1 = Notification.builder()
                .user(userA)
                .type(NotificationType.WELCOME)
                .title("Bem-vindo A")
                .message("Msg A1")
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notifA1);

        Notification notifB1 = Notification.builder()
                .user(userB)
                .type(NotificationType.WELCOME)
                .title("Bem-vindo B")
                .message("Msg B1")
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.save(notifB1);

        mockMvc.perform(get("/api/v1/notifications")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title").value("Bem-vindo A"));
    }

    @Test
    @DisplayName("Cenário 2: Contagem de não lidas e marcar como lida")
    void testUnreadCountAndMarkAsRead() throws Exception {
        Notification notif = Notification.builder()
                .user(userA)
                .type(NotificationType.LEVEL_UP)
                .title("Nível 2")
                .message("Subiu!")
                .createdAt(LocalDateTime.now())
                .build();
        notif = notificationRepository.save(notif);

        // Contador de não lidas deve ser 1
        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(1));

        // Marcar como lida
        mockMvc.perform(patch("/api/v1/notifications/" + notif.getId() + "/read")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.read").value(true))
                .andExpect(jsonPath("$.readAt").exists());

        // Contador de não lidas deve ser 0
        mockMvc.perform(get("/api/v1/notifications/unread-count")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(0));
    }

    @Test
    @DisplayName("Cenário 3: Marcar todas como lidas")
    void testMarkAllAsRead() throws Exception {
        Notification n1 = Notification.builder()
                .user(userA)
                .type(NotificationType.WELCOME)
                .title("N1")
                .message("M1")
                .createdAt(LocalDateTime.now())
                .build();
        Notification n2 = Notification.builder()
                .user(userA)
                .type(NotificationType.LEVEL_UP)
                .title("N2")
                .message("M2")
                .createdAt(LocalDateTime.now())
                .build();
        notificationRepository.saveAll(List.of(n1, n2));

        mockMvc.perform(patch("/api/v1/notifications/read-all")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount").value(0));

        assertEquals(0, notificationRepository.countByUserIdAndReadAtIsNull(userA.getId()));
    }

    @Test
    @DisplayName("Cenário 4: Excluir notificação")
    void testDeleteNotification() throws Exception {
        Notification notif = Notification.builder()
                .user(userA)
                .type(NotificationType.WELCOME)
                .title("Para deletar")
                .message("...")
                .createdAt(LocalDateTime.now())
                .build();
        notif = notificationRepository.save(notif);

        mockMvc.perform(delete("/api/v1/notifications/" + notif.getId())
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNoContent());

        assertFalse(notificationRepository.findById(notif.getId()).isPresent());
    }

    @Test
    @DisplayName("Cenário 5: Isolamento - interagir com notificação de outro usuário retorna 404")
    void testIsolationReturns404ForOtherUserNotification() throws Exception {
        Notification notifB = Notification.builder()
                .user(userB)
                .type(NotificationType.WELCOME)
                .title("Do usuário B")
                .message("...")
                .createdAt(LocalDateTime.now())
                .build();
        notifB = notificationRepository.save(notifB);

        // Usuário A tenta marcar como lida notificação do Usuário B -> 404
        mockMvc.perform(patch("/api/v1/notifications/" + notifB.getId() + "/read")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNotFound());

        // Usuário A tenta excluir notificação do Usuário B -> 404
        mockMvc.perform(delete("/api/v1/notifications/" + notifB.getId())
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Cenário 6: Sem token retorna 401 em todos os endpoints de notificação")
    void testMissingTokenReturns401OnAllEndpoints() throws Exception {
        mockMvc.perform(get("/api/v1/notifications"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/notifications/unread-count"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(patch("/api/v1/notifications/1/read"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(patch("/api/v1/notifications/read-all"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(delete("/api/v1/notifications/1"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Cenário 7: Notificação WELCOME é gerada automaticamente no cadastro")
    void testWelcomeNotificationGeneratedOnRegistration() {
        String uniqueEmail = "novo.aluno." + System.currentTimeMillis() + "@studyos.com";
        var response = userService.register(new UserRegisterRequest("Novo Aluno", uniqueEmail, "senha123456"));

        List<Notification> notifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(response.id(), null);
        assertFalse(notifs.isEmpty());
        assertEquals(NotificationType.WELCOME, notifs.getFirst().getType());
        assertEquals("Bem-vindo ao StudyOS!", notifs.getFirst().getTitle());
    }

    @Test
    @DisplayName("Cenário 8: Notificação LEVEL_UP é gerada automaticamente ao subir de nível")
    void testLevelUpNotificationGenerated() {
        // Concede 500 XP ao userA (passa do nível 1 para 2)
        gamificationService.grantXp(userA, 500);

        List<Notification> notifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(userA.getId(), null);
        boolean hasLevelUp = notifs.stream().anyMatch(n -> n.getType() == NotificationType.LEVEL_UP);
        assertTrue(hasLevelUp, "Deveria ter gerado notificação de LEVEL_UP");
    }

    @Test
    @DisplayName("Cenário 9: Notificação PASSWORD_CHANGED gerada ao alterar senha")
    void testPasswordChangedNotificationGenerated() {
        authService.changePassword("Bearer " + tokenA, new ChangePasswordRequest("senhaSegura123", "novaSenhaSegura456"));

        List<Notification> notifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(userA.getId(), null);
        boolean hasPassChanged = notifs.stream().anyMatch(n -> n.getType() == NotificationType.PASSWORD_CHANGED);
        assertTrue(hasPassChanged, "Deveria ter gerado notificação de PASSWORD_CHANGED");
    }

    @Test
    @DisplayName("Cenário 10: Lembretes - tarefa atrasada gera TASK_OVERDUE sem duplicar e tarefa concluída não gera")
    void testTaskRemindersOverdueAndIdempotency() throws Exception {
        LocalDate today = LocalDate.now(NotificationService.APP_TIMEZONE);

        // Tarefa atrasada não concluída
        Task overdueTask = Task.builder()
                .user(userA)
                .title("Estudo Java Atrasado")
                .description("Desc")
                .category(TaskCategory.JAVA_BACKEND)
                .plannedDurationMinutes(60)
                .dailyMinMinutes(30)
                .status(TaskStatus.PENDING)
                .startDate(today.minusDays(5))
                .endDate(today.minusDays(1))
                .build();
        taskRepository.save(overdueTask);

        // Tarefa atrasada mas CONCLUÍDA
        Task completedOverdueTask = Task.builder()
                .user(userA)
                .title("Estudo Banco Concluído")
                .description("Desc")
                .category(TaskCategory.DATABASE)
                .plannedDurationMinutes(60)
                .dailyMinMinutes(30)
                .status(TaskStatus.COMPLETED)
                .startDate(today.minusDays(5))
                .endDate(today.minusDays(1))
                .build();
        taskRepository.save(completedOverdueTask);

        // Consulta notificações 2 vezes (deve sincronizar)
        mockMvc.perform(get("/api/v1/notifications")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/notifications")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk());

        List<Notification> notifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(userA.getId(), null);

        // Verifica que apenas 1 notificação de TASK_OVERDUE foi gerada (não duplicou)
        long overdueCount = notifs.stream().filter(n -> n.getType() == NotificationType.TASK_OVERDUE).count();
        assertEquals(1, overdueCount, "Deve haver exatamente 1 lembrete de tarefa atrasada (idempotência)");

        // Verifica que nenhuma notificação foi gerada para a tarefa concluída
        boolean hasCompletedTaskNotif = notifs.stream()
                .anyMatch(n -> n.getMessage().contains("Estudo Banco Concluído"));
        assertFalse(hasCompletedTaskNotif, "Tarefa concluída não deve gerar lembrete");
    }

    @Test
    @DisplayName("Cenário 11: Falha na criação da notificação não impede a ação principal")
    void testNotificationCreationFailureDoesNotBlockMainAction() {
        // Tentativa com usuário nulo não deve lançar exceção
        assertDoesNotThrow(() -> {
            notificationService.createNotificationSilently(null, NotificationType.WELCOME, "Teste", "Msg", null);
        });
    }
}
