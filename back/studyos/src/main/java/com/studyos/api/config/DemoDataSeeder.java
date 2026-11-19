package com.studyos.api.config;

import com.studyos.api.model.Season;
import com.studyos.api.model.Task;
import com.studyos.api.model.TimeLog;
import com.studyos.api.model.User;
import com.studyos.api.model.enums.CompletionStatus;
import com.studyos.api.model.enums.SeasonCode;
import com.studyos.api.model.enums.TaskCategory;
import com.studyos.api.model.enums.TaskStatus;
import com.studyos.api.model.enums.UserRole;
import com.studyos.api.repository.season.SeasonRepository;
import com.studyos.api.repository.task.TaskRepository;
import com.studyos.api.repository.timelog.TimeLogRepository;
import com.studyos.api.repository.user.UserRepository;
import com.studyos.api.service.season.SeasonService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Seeder de contas de demonstração para fins acadêmicos e apresentação.
 * Roda somente quando a propriedade studyos.demo-seed estiver explicitamente como true.
 * Deve ser false em produção.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DemoDataSeeder implements CommandLineRunner {

    private static final ZoneId SAO_PAULO_ZONE = ZoneId.of("America/Sao_Paulo");

    private final UserRepository userRepository;
    private final SeasonRepository seasonRepository;
    private final SeasonService seasonService;
    private final TaskRepository taskRepository;
    private final TimeLogRepository timeLogRepository;

    @Value("${studyos.demo-seed:false}")
    private boolean demoSeedEnabled;

    @Override
    @Transactional
    public void run(String... args) {
        if (!demoSeedEnabled) {
            log.info("[DEMO SEEDER] Seed de contas de demonstração desativado (studyos.demo-seed=false).");
            return;
        }

        log.info("[DEMO SEEDER] Inicializando seed de contas de demonstração e dados acadêmicos...");

        // 1. Administrador Demo (ADMIN)
        User admin = userRepository.findByEmail("admin@studyos.demo").orElseGet(() -> {
            User u = User.builder()
                    .name("Administrador Demo")
                    .email("admin@studyos.demo")
                    .password("Demo@123")
                    .role(UserRole.ADMIN)
                    .active(true)
                    .level(1)
                    .currentXp(0L)
                    .streakDays(0)
                    .frozenCount(0)
                    .build();
            User saved = userRepository.save(u);
            log.info("[DEMO SEEDER] Conta criada: {} (Papel: {}, Senha: {})", saved.getEmail(), saved.getRole(), "Demo@123");
            return saved;
        });

        // 2. Professor Demo (MENTOR)
        User professor = userRepository.findByEmail("professor@studyos.demo").orElseGet(() -> {
            User u = User.builder()
                    .name("Professor Demo")
                    .email("professor@studyos.demo")
                    .password("Demo@123")
                    .role(UserRole.MENTOR)
                    .active(true)
                    .level(1)
                    .currentXp(0L)
                    .streakDays(0)
                    .frozenCount(0)
                    .build();
            User saved = userRepository.save(u);
            log.info("[DEMO SEEDER] Conta criada: {} (Papel: {}, Senha: {})", saved.getEmail(), saved.getRole(), "Demo@123");
            return saved;
        });

        // 3. Aluno Demo (STUDENT 1, status Em Dia: UP_TO_DATE)
        User aluno = userRepository.findByEmail("aluno@studyos.demo").orElseGet(() -> {
            User u = User.builder()
                    .name("Aluno Demo")
                    .email("aluno@studyos.demo")
                    .password("Demo@123")
                    .role(UserRole.STUDENT)
                    .active(true)
                    .mentor(professor)
                    .level(3)
                    .currentXp(420L)
                    .streakDays(5)
                    .frozenCount(1)
                    .build();
            User saved = userRepository.save(u);
            log.info("[DEMO SEEDER] Conta criada: {} (Papel: {}, Mentor: {}, Senha: {})",
                    saved.getEmail(), saved.getRole(), professor.getEmail(), "Demo@123");
            return saved;
        });

        aluno.setMentor(professor);
        aluno = userRepository.save(aluno);
        log.info("[DEMO SEEDER] Vínculo de mentor garantido para aluno@studyos.demo -> {}", professor.getEmail());

        // 4. Aluna Demo 2 (STUDENT 2, status Atenção: ATTENTION)
        User aluna2 = userRepository.findByEmail("aluna2@studyos.demo").orElseGet(() -> {
            User u = User.builder()
                    .name("Aluna Demo 2")
                    .email("aluna2@studyos.demo")
                    .password("Demo@123")
                    .role(UserRole.STUDENT)
                    .active(true)
                    .mentor(professor)
                    .level(2)
                    .currentXp(120L)
                    .streakDays(2)
                    .frozenCount(0)
                    .build();
            User saved = userRepository.save(u);
            log.info("[DEMO SEEDER] Conta criada: {} (Papel: {}, Mentor: {}, Senha: {})",
                    saved.getEmail(), saved.getRole(), professor.getEmail(), "Demo@123");
            return saved;
        });

        aluna2.setMentor(professor);
        aluna2 = userRepository.save(aluna2);

        // 5. Aluno Demo 3 (STUDENT 3, status Sem Atividade: INACTIVE)
        User aluno3 = userRepository.findByEmail("aluno3@studyos.demo").orElseGet(() -> {
            User u = User.builder()
                    .name("Aluno Demo 3")
                    .email("aluno3@studyos.demo")
                    .password("Demo@123")
                    .role(UserRole.STUDENT)
                    .active(true)
                    .mentor(professor)
                    .level(1)
                    .currentXp(0L)
                    .streakDays(0)
                    .frozenCount(0)
                    .build();
            User saved = userRepository.save(u);
            log.info("[DEMO SEEDER] Conta criada: {} (Papel: {}, Mentor: {}, Senha: {})",
                    saved.getEmail(), saved.getRole(), professor.getEmail(), "Demo@123");
            return saved;
        });

        aluno3.setMentor(professor);
        aluno3 = userRepository.save(aluno3);

        // Popula tarefas e registros de tempo de forma idempotente
        seedAlunoData(aluno);
        seedAluna2Data(aluna2);

        log.info("[DEMO SEEDER] Seed de contas de demonstração e dados do mentor finalizado com sucesso.");
    }

    private void seedAlunoData(User aluno) {
        if (taskRepository.findByUserId(aluno.getId()).size() >= 5) {
            return;
        }

        seasonService.findByUserId(aluno.getId());
        List<Season> seasons = seasonRepository.findByUserId(aluno.getId());
        Map<SeasonCode, Season> seasonMap = seasons.stream().collect(Collectors.toMap(Season::getCode, s -> s));

        LocalDate today = LocalDate.now(SAO_PAULO_ZONE);

        Task t1 = taskRepository.save(Task.builder()
                .title("Fundamentos de Spring Boot e JPA")
                .description("Estudo de ciclo de vida de entidades e relacionamentos.")
                .category(TaskCategory.JAVA_BACKEND)
                .seasonEntity(seasonMap.get(SeasonCode.SUMMER))
                .plannedDurationMinutes(60)
                .dailyMinMinutes(60)
                .actualDurationMinutes(120)
                .status(TaskStatus.COMPLETED)
                .startDate(today.minusDays(6))
                .endDate(today.minusDays(1))
                .xpReward(100)
                .user(aluno)
                .build());

        Task t2 = taskRepository.save(Task.builder()
                .title("Arquitetura REST e DTOs")
                .description("Construção de contratos limpos para APIs.")
                .category(TaskCategory.JAVA_BACKEND)
                .seasonEntity(seasonMap.get(SeasonCode.SUMMER))
                .plannedDurationMinutes(60)
                .dailyMinMinutes(60)
                .actualDurationMinutes(60)
                .status(TaskStatus.COMPLETED)
                .startDate(today.minusDays(4))
                .endDate(today)
                .xpReward(100)
                .user(aluno)
                .build());

        Task t3 = taskRepository.save(Task.builder()
                .title("Componentização com React e Tailwind")
                .description("Design responsivo e acessível.")
                .category(TaskCategory.FRONTEND)
                .seasonEntity(seasonMap.get(SeasonCode.AUTUMN))
                .plannedDurationMinutes(90)
                .dailyMinMinutes(90)
                .actualDurationMinutes(90)
                .status(TaskStatus.COMPLETED)
                .startDate(today.minusDays(2))
                .endDate(today.plusDays(3))
                .xpReward(150)
                .user(aluno)
                .build());

        Task t4 = taskRepository.save(Task.builder()
                .title("Modelagem Relacional MySQL")
                .description("Criação de índices e chaves estrangeiras.")
                .category(TaskCategory.DATABASE)
                .seasonEntity(seasonMap.get(SeasonCode.AUTUMN))
                .plannedDurationMinutes(45)
                .dailyMinMinutes(45)
                .actualDurationMinutes(30)
                .status(TaskStatus.IN_PROGRESS)
                .startDate(today.minusDays(1))
                .endDate(today.plusDays(5))
                .xpReward(80)
                .user(aluno)
                .build());

        Task t5 = taskRepository.save(Task.builder()
                .title("Docker e Conteinerização")
                .description("Configuração de contêineres para dev e prod.")
                .category(TaskCategory.DEVOPS)
                .seasonEntity(seasonMap.get(SeasonCode.WINTER))
                .plannedDurationMinutes(60)
                .dailyMinMinutes(60)
                .actualDurationMinutes(0)
                .status(TaskStatus.PENDING)
                .startDate(today.plusDays(1))
                .endDate(today.plusDays(10))
                .xpReward(120)
                .user(aluno)
                .build());

        Task t6 = taskRepository.save(Task.builder()
                .title("Inglês Técnico para Desenvolvedores")
                .description("Leitura de documentação oficial e vocabulário técnico.")
                .category(TaskCategory.ENGLISH)
                .seasonEntity(seasonMap.get(SeasonCode.SPRING))
                .plannedDurationMinutes(30)
                .dailyMinMinutes(30)
                .actualDurationMinutes(30)
                .status(TaskStatus.IN_PROGRESS)
                .startDate(today)
                .endDate(today.plusDays(7))
                .xpReward(50)
                .user(aluno)
                .build());

        // Sessões de tempo distribuídas nos últimos 7 dias (último registro hoje -> UP_TO_DATE)
        timeLogRepository.save(TimeLog.builder()
                .task(t1)
                .loggedDurationMinutes(60)
                .completionStatus(CompletionStatus.COMPLETED)
                .notes("Sessão inicial de entidades")
                .createdAt(today.minusDays(5).atTime(14, 30))
                .build());

        timeLogRepository.save(TimeLog.builder()
                .task(t1)
                .loggedDurationMinutes(60)
                .completionStatus(CompletionStatus.COMPLETED)
                .notes("Sessão de relacionamentos")
                .createdAt(today.minusDays(3).atTime(16, 0))
                .build());

        timeLogRepository.save(TimeLog.builder()
                .task(t2)
                .loggedDurationMinutes(60)
                .completionStatus(CompletionStatus.COMPLETED)
                .notes("Endpoints de mentor")
                .createdAt(today.minusDays(2).atTime(10, 15))
                .build());

        timeLogRepository.save(TimeLog.builder()
                .task(t3)
                .loggedDurationMinutes(90)
                .completionStatus(CompletionStatus.COMPLETED)
                .notes("UI de cartões e tabelas")
                .createdAt(today.minusDays(1).atTime(15, 45))
                .build());

        timeLogRepository.save(TimeLog.builder()
                .task(t4)
                .loggedDurationMinutes(30)
                .completionStatus(CompletionStatus.COMPLETED)
                .notes("Queries agregadas")
                .createdAt(today.atTime(9, 30))
                .build());

        log.info("[DEMO SEEDER] Criadas 6 tarefas e 5 sessões de tempo para {}", aluno.getEmail());
    }

    private void seedAluna2Data(User aluna2) {
        if (!taskRepository.findByUserId(aluna2.getId()).isEmpty()) {
            return;
        }

        seasonService.findByUserId(aluna2.getId());
        List<Season> seasons = seasonRepository.findByUserId(aluna2.getId());
        Map<SeasonCode, Season> seasonMap = seasons.stream().collect(Collectors.toMap(Season::getCode, s -> s));

        LocalDate today = LocalDate.now(SAO_PAULO_ZONE);

        Task t1 = taskRepository.save(Task.builder()
                .title("Algoritmos em Java")
                .description("Exercícios práticos de ordenação e recursão.")
                .category(TaskCategory.JAVA_BACKEND)
                .seasonEntity(seasonMap.get(SeasonCode.SUMMER))
                .plannedDurationMinutes(45)
                .dailyMinMinutes(45)
                .actualDurationMinutes(45)
                .status(TaskStatus.COMPLETED)
                .startDate(today.minusDays(10))
                .endDate(today.minusDays(5))
                .xpReward(70)
                .user(aluna2)
                .build());

        Task t2 = taskRepository.save(Task.builder()
                .title("Estruturas de Dados")
                .description("Filas, Pilhas e Listas Encadeadas.")
                .category(TaskCategory.JAVA_BACKEND)
                .seasonEntity(seasonMap.get(SeasonCode.SUMMER))
                .plannedDurationMinutes(60)
                .dailyMinMinutes(60)
                .actualDurationMinutes(0)
                .status(TaskStatus.PENDING)
                .startDate(today.minusDays(5))
                .endDate(today.plusDays(5))
                .xpReward(90)
                .user(aluna2)
                .build());

        // Última atividade há exatamente 5 dias -> ATTENTION (4 a 7 dias)
        timeLogRepository.save(TimeLog.builder()
                .task(t1)
                .loggedDurationMinutes(45)
                .completionStatus(CompletionStatus.COMPLETED)
                .notes("Revisão de ordenação")
                .createdAt(today.minusDays(5).atTime(11, 0))
                .build());

        log.info("[DEMO SEEDER] Criadas 2 tarefas e 1 sessão de tempo (5 dias atrás) para {}", aluna2.getEmail());
    }
}
