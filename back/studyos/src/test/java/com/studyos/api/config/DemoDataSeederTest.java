package com.studyos.api.config;

import com.studyos.api.model.User;
import com.studyos.api.model.enums.UserRole;
import com.studyos.api.repository.task.TaskRepository;
import com.studyos.api.repository.timelog.TimeLogRepository;
import com.studyos.api.repository.user.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
@TestPropertySource(properties = "studyos.demo-seed=true")
class DemoDataSeederTest {

    @Autowired
    private DemoDataSeeder demoDataSeeder;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private TimeLogRepository timeLogRepository;

    @Test
    @DisplayName("Cenário: Seeder cria contas de demonstração e dados, e rodar duas vezes não duplica nada")
    void testSeederCreatesAccountsAndIsIdempotent() {
        // Executa primeira rodada
        demoDataSeeder.run();

        Optional<User> adminOpt = userRepository.findByEmail("admin@studyos.demo");
        assertTrue(adminOpt.isPresent(), "admin@studyos.demo deve existir");
        assertEquals(UserRole.ADMIN, adminOpt.get().getRole());

        Optional<User> professorOpt = userRepository.findByEmail("professor@studyos.demo");
        assertTrue(professorOpt.isPresent(), "professor@studyos.demo deve existir");
        assertEquals(UserRole.MENTOR, professorOpt.get().getRole());

        Optional<User> aluno1Opt = userRepository.findByEmail("aluno@studyos.demo");
        assertTrue(aluno1Opt.isPresent(), "aluno@studyos.demo deve existir");
        assertEquals(UserRole.STUDENT, aluno1Opt.get().getRole());
        assertNotNull(aluno1Opt.get().getMentor(), "aluno@studyos.demo deve estar vinculado ao mentor");

        Optional<User> aluna2Opt = userRepository.findByEmail("aluna2@studyos.demo");
        assertTrue(aluna2Opt.isPresent(), "aluna2@studyos.demo deve existir");
        assertEquals(UserRole.STUDENT, aluna2Opt.get().getRole());

        Optional<User> aluno3Opt = userRepository.findByEmail("aluno3@studyos.demo");
        assertTrue(aluno3Opt.isPresent(), "aluno3@studyos.demo deve existir");
        assertEquals(UserRole.STUDENT, aluno3Opt.get().getRole());

        long usersCountFirstRun = userRepository.count();
        long tasksCountFirstRun = taskRepository.count();
        long timeLogsCountFirstRun = timeLogRepository.count();

        assertTrue(tasksCountFirstRun > 0, "Tarefas devem ter sido semeadas");
        assertTrue(timeLogsCountFirstRun > 0, "Sessões de tempo devem ter sido semeadas");

        // Executa segunda rodada para provar idempotência
        demoDataSeeder.run();

        assertEquals(usersCountFirstRun, userRepository.count(), "Contas de usuário não devem ser duplicadas na 2ª execução");
        assertEquals(tasksCountFirstRun, taskRepository.count(), "Tarefas não devem ser duplicadas na 2ª execução");
        assertEquals(timeLogsCountFirstRun, timeLogRepository.count(), "Sessões de tempo não devem ser duplicadas na 2ª execução");
    }
}
