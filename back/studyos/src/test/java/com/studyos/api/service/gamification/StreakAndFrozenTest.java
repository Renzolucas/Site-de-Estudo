package com.studyos.api.service.gamification;

import com.studyos.api.dto.user.response.UserResponse;
import com.studyos.api.model.Task;
import com.studyos.api.model.User;
import com.studyos.api.model.enums.Season;
import com.studyos.api.model.enums.TaskCategory;
import com.studyos.api.model.enums.TaskStatus;
import com.studyos.api.repository.task.TaskRepository;
import com.studyos.api.repository.user.UserRepository;
import com.studyos.api.dto.timelog.request.TimeLogCreateRequest;
import com.studyos.api.model.enums.CompletionStatus;
import com.studyos.api.service.auth.AuthService;
import com.studyos.api.service.auth.JwtTokenService;
import com.studyos.api.service.task.TaskService;
import com.studyos.api.service.timelog.TimeLogService;
import com.studyos.api.service.user.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
class StreakAndFrozenTest {

    @Autowired
    private GamificationService gamificationService;

    @Autowired
    private TaskService taskService;

    @Autowired
    private UserService userService;

    @Autowired
    private TimeLogService timeLogService;

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtTokenService jwtTokenService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TaskRepository taskRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        taskRepository.deleteAll();
        userRepository.deleteAll();

        User user = User.builder()
                .name("Aluno Teste")
                .email("aluno.teste@studyos.com")
                .password("senha123")
                .level(1)
                .currentXp(0L)
                .streakDays(0)
                .frozenCount(0)
                .build();
        testUser = userRepository.save(user);
    }

    @Test
    @DisplayName("CASO 1: Lição concede 0 XP -> streak não aumenta")
    void case1_lessonWithZeroXpShouldNotIncreaseStreak() {
        testUser.setStreakDays(5);
        userRepository.save(testUser);

        Task task = Task.builder()
                .title("Revisão de conceitos")
                .category(TaskCategory.JAVA_BACKEND)
                .season(Season.SUMMER)
                .plannedDurationMinutes(30)
                .status(TaskStatus.PENDING)
                .xpReward(0)
                .user(testUser)
                .build();
        task = taskRepository.save(task);

        User updatedUser = gamificationService.processLessonCompletion(task);

        assertEquals(5, updatedUser.getStreakDays(), "Streak não deve mudar quando lição concede 0 XP");
        assertEquals(0L, updatedUser.getCurrentXp(), "XP não deve ser concedido");
        assertTrue(task.getStreakProcessed(), "Tarefa deve ser marcada como processada");
    }

    @Test
    @DisplayName("CASO 2: Lição concede XP > 0 -> streak aumenta exatamente +1")
    void case2_lessonWithPositiveXpShouldIncreaseStreakByOne() {
        testUser.setStreakDays(5);
        userRepository.save(testUser);

        Task task = Task.builder()
                .title("Implementação de API REST")
                .category(TaskCategory.JAVA_BACKEND)
                .season(Season.SUMMER)
                .plannedDurationMinutes(60)
                .status(TaskStatus.PENDING)
                .xpReward(80)
                .user(testUser)
                .build();
        task = taskRepository.save(task);

        User updatedUser = gamificationService.processLessonCompletion(task);

        assertEquals(6, updatedUser.getStreakDays(), "Streak deve aumentar exatamente +1");
        assertEquals(80L, updatedUser.getCurrentXp(), "XP deve ser computado");
        assertEquals(0, updatedUser.getFrozenCount(), "Ainda não atingiu marco de 30 dias para Frozen");
    }

    @Test
    @DisplayName("CASO 3: A mesma conclusão é processada duas vezes -> streak aumenta somente uma vez (idempotência)")
    void case3_duplicateCompletionShouldBeIdempotent() {
        testUser.setStreakDays(10);
        userRepository.save(testUser);

        Task task = Task.builder()
                .title("Modelagem de Banco")
                .category(TaskCategory.DATABASE)
                .season(Season.SUMMER)
                .plannedDurationMinutes(45)
                .status(TaskStatus.PENDING)
                .xpReward(60)
                .user(testUser)
                .build();
        task = taskRepository.save(task);

        // Primeira conclusão (válida)
        User firstRun = gamificationService.processLessonCompletion(task);
        assertEquals(11, firstRun.getStreakDays());
        assertEquals(60L, firstRun.getCurrentXp());

        // Segunda tentativa com a mesma conclusão (retry de rede, double click, etc.)
        User secondRun = gamificationService.processLessonCompletion(task);
        assertEquals(11, secondRun.getStreakDays(), "Streak NÃO deve aumentar na segunda execução da mesma lição");
        assertEquals(60L, secondRun.getCurrentXp(), "XP NÃO deve duplicar");
    }

    @Test
    @DisplayName("CASO 4: Streak 29 + lição com XP > 0 -> streak = 30 -> Frozen +1")
    void case4_streak29Reaching30ShouldGrantOneFrozen() {
        testUser.setStreakDays(29);
        testUser.setFrozenCount(0);
        userRepository.save(testUser);

        Task task = Task.builder()
                .title("Design de Arquitetura")
                .category(TaskCategory.JAVA_BACKEND)
                .season(Season.SUMMER)
                .plannedDurationMinutes(60)
                .status(TaskStatus.PENDING)
                .xpReward(100)
                .user(testUser)
                .build();
        task = taskRepository.save(task);

        User updatedUser = gamificationService.processLessonCompletion(task);

        assertEquals(30, updatedUser.getStreakDays(), "Streak deve atingir 30");
        assertEquals(1, updatedUser.getFrozenCount(), "Deve conceder exatamente +1 Frozen ao atingir 30 dias");
    }

    @Test
    @DisplayName("CASO 5: Streak 30 + nova lição -> streak = 31 -> nenhum Frozen adicional")
    void case5_streak30Reaching31ShouldNotGrantAdditionalFrozen() {
        testUser.setStreakDays(30);
        testUser.setFrozenCount(1);
        userRepository.save(testUser);

        Task nextTask = Task.builder()
                .title("Exercícios de Java")
                .category(TaskCategory.JAVA_BACKEND)
                .season(Season.SUMMER)
                .plannedDurationMinutes(45)
                .status(TaskStatus.PENDING)
                .xpReward(50)
                .user(testUser)
                .build();
        nextTask = taskRepository.save(nextTask);

        User updatedUser = gamificationService.processLessonCompletion(nextTask);

        assertEquals(31, updatedUser.getStreakDays(), "Streak deve ser 31");
        assertEquals(1, updatedUser.getFrozenCount(), "Frozen deve permanecer 1, sem concessão indevida");
    }

    @Test
    @DisplayName("CASO 6: Streak 59 + lição com XP > 0 -> streak = 60 -> Frozen +1")
    void case6_streak59Reaching60ShouldGrantSecondFrozen() {
        testUser.setStreakDays(59);
        testUser.setFrozenCount(1);
        userRepository.save(testUser);

        Task task = Task.builder()
                .title("Algoritmos avançados")
                .category(TaskCategory.JAVA_BACKEND)
                .season(Season.SUMMER)
                .plannedDurationMinutes(60)
                .status(TaskStatus.PENDING)
                .xpReward(90)
                .user(testUser)
                .build();
        task = taskRepository.save(task);

        User updatedUser = gamificationService.processLessonCompletion(task);

        assertEquals(60, updatedUser.getStreakDays(), "Streak deve atingir 60");
        assertEquals(2, updatedUser.getFrozenCount(), "Deve conceder +1 Frozen atingindo o segundo ciclo de 30 dias (total 2)");
    }

    @Test
    @DisplayName("CASO 7: Recarregar a página (busca por ID no banco) -> streak permanece correto e persistido")
    void case7_streakPersistsAcrossDbQueries() {
        testUser.setStreakDays(15);
        testUser.setFrozenCount(0);
        userRepository.save(testUser);

        Task task = Task.builder()
                .title("Containers Docker")
                .category(TaskCategory.DEVOPS)
                .season(Season.SUMMER)
                .plannedDurationMinutes(40)
                .status(TaskStatus.PENDING)
                .xpReward(50)
                .user(testUser)
                .build();
        task = taskRepository.save(task);

        gamificationService.processLessonCompletion(task);

        // Simula recarregamento da página buscando diretamente do banco
        UserResponse response = userService.findById(testUser.getId());
        assertEquals(16, response.streakDays(), "Streak deve ser 16 persistido no banco após recarga");
        assertEquals(50L, response.currentXp());
    }

    @Test
    @DisplayName("CASO 8: Usuário possui XP registrado, mas streak está em 0 -> reconciliação legítima por tarefas válidas")
    void case8_userWithXpAndZeroStreakReconciledFromValidTasks() {
        // Usuário legado que possui 912 XP acumulado no banco, mas streak estava zerado por bug anterior
        testUser.setCurrentXp(912L);
        testUser.setStreakDays(0);
        testUser.setFrozenCount(0);
        userRepository.save(testUser);

        // Cria 4 tarefas concluídas com XP > 0 e 1 tarefa concluída com 0 XP
        for (int i = 1; i <= 4; i++) {
            Task t = Task.builder()
                    .title("Tarefa Histórica " + i)
                    .category(TaskCategory.JAVA_BACKEND)
                    .season(Season.SUMMER)
                    .plannedDurationMinutes(60)
                    .status(TaskStatus.COMPLETED)
                    .xpReward(100)
                    .user(testUser)
                    .build();
            taskRepository.save(t);
        }
        Task zeroXpTask = Task.builder()
                .title("Tarefa 0 XP")
                .category(TaskCategory.ENGLISH)
                .season(Season.SUMMER)
                .plannedDurationMinutes(15)
                .status(TaskStatus.COMPLETED)
                .xpReward(0)
                .user(testUser)
                .build();
        taskRepository.save(zeroXpTask);

        // Ao buscar perfil (como faz o frontend ao carregar), deve reconciliar as 4 lições válidas reais
        UserResponse response = userService.findById(testUser.getId());

        assertEquals(4, response.streakDays(), "Streak deve reconciliar para 4 lições válidas com XP > 0, ignorando a tarefa de 0 XP");
        assertEquals(912L, response.currentXp(), "XP existente de 912 deve ser integralmente preservado");
    }

    @Test
    @DisplayName("Integração: TaskService.updateStatus para COMPLETED incrementa streak e XP uma única vez")
    void testTaskServiceUpdateStatusIntegration() {
        Task task = Task.builder()
                .title("Tarefa API")
                .category(TaskCategory.JAVA_BACKEND)
                .season(Season.SUMMER)
                .plannedDurationMinutes(60)
                .status(TaskStatus.PENDING)
                .xpReward(80)
                .user(testUser)
                .build();
        task = taskRepository.save(task);

        // Atualiza status para COMPLETED via TaskService
        taskService.updateStatus(task.getId(), TaskStatus.COMPLETED);

        UserResponse userRes = userService.findById(testUser.getId());
        assertEquals(1, userRes.streakDays());
        assertEquals(80L, userRes.currentXp());

        // Chamada repetida de updateStatus para COMPLETED (ex: retry)
        taskService.updateStatus(task.getId(), TaskStatus.COMPLETED);

        UserResponse userRes2 = userService.findById(testUser.getId());
        assertEquals(1, userRes2.streakDays(), "Não deve duplicar streak no retry");
        assertEquals(80L, userRes2.currentXp(), "Não deve duplicar XP no retry");
    }

    @Test
    @DisplayName("CASO 10: Usuário legado com 30 dias de streak e 0 Frozen -> Frozen é sincronizado para 1")
    void case10_existingUserWith30StreakSynchronizesFrozen() {
        testUser.setStreakDays(30);
        testUser.setFrozenCount(0);
        userRepository.save(testUser);

        UserResponse response = userService.findById(testUser.getId());

        assertEquals(30, response.streakDays());
        assertEquals(1, response.frozenCount(), "Usuário com 30 dias de streak deve ter 1 Frozen sincronizado");
    }

    @Test
    @DisplayName("CASO 11: Conclusão via TimeLogService atualiza streak e frozen de forma idempotente")
    void case11_timeLogCompletionUpdatesStreakAndFrozen() {
        testUser.setStreakDays(29);
        testUser.setFrozenCount(0);
        userRepository.save(testUser);

        Task task = Task.builder()
                .title("Sessão Pomodoro de Java")
                .category(TaskCategory.JAVA_BACKEND)
                .season(Season.SUMMER)
                .plannedDurationMinutes(60)
                .status(TaskStatus.PENDING)
                .xpReward(80)
                .user(testUser)
                .build();
        task = taskRepository.save(task);

        // TimeLog completando a tarefa
        timeLogService.logTime(new TimeLogCreateRequest(
                task.getId(),
                60,
                CompletionStatus.COMPLETED,
                "Sessão finalizada com sucesso"
        ));

        UserResponse resAfterFirstLog = userService.findById(testUser.getId());
        assertEquals(30, resAfterFirstLog.streakDays(), "Streak deve atingir 30");
        assertEquals(1, resAfterFirstLog.frozenCount(), "Deve ter concedido 1 Frozen ao atingir 30");

        // Segundo log na mesma tarefa já completada não deve duplicar o streak
        timeLogService.logTime(new TimeLogCreateRequest(
                task.getId(),
                30,
                CompletionStatus.COMPLETED,
                "Revisão complementar"
        ));

        UserResponse resAfterSecondLog = userService.findById(testUser.getId());
        assertEquals(30, resAfterSecondLog.streakDays(), "Streak não deve duplicar");
        assertEquals(1, resAfterSecondLog.frozenCount(), "Frozen não deve duplicar");
    }

    @Test
    @DisplayName("CASO 12: AuthService (/auth/me) retorna usuário com streak e frozen sincronizados")
    void case12_authServiceMeReturnsSynchronizedStreakAndFrozen() {
        testUser.setStreakDays(60);
        testUser.setFrozenCount(0);
        userRepository.save(testUser);

        String token = jwtTokenService.generateToken(testUser);
        UserResponse meResponse = authService.getAuthenticatedUser("Bearer " + token);

        assertEquals(60, meResponse.streakDays());
        assertEquals(2, meResponse.frozenCount(), "Deve sincronizar 2 Frozen para 60 dias de streak no endpoint /auth/me");
    }
}
