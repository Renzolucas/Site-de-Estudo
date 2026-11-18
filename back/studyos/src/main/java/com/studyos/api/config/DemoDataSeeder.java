package com.studyos.api.config;

import com.studyos.api.model.User;
import com.studyos.api.model.enums.UserRole;
import com.studyos.api.repository.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeder de contas de demonstração para fins acadêmicos e apresentação.
 * Roda somente quando a propriedade studyos.demo-seed estiver explicitamente como true.
 * Deve ser false em produção.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DemoDataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;

    @Value("${studyos.demo-seed:false}")
    private boolean demoSeedEnabled;

    @Override
    @Transactional
    public void run(String... args) {
        if (!demoSeedEnabled) {
            log.info("[DEMO SEEDER] Seed de contas de demonstração desativado (studyos.demo-seed=false).");
            return;
        }

        log.info("[DEMO SEEDER] Inicializando seed de contas de demonstração...");

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

        // 3. Aluno Demo (STUDENT, vinculado ao Professor Demo)
        userRepository.findByEmail("aluno@studyos.demo").ifPresentOrElse(
                existingAluno -> {
                    if (existingAluno.getMentor() == null) {
                        existingAluno.setMentor(professor);
                        userRepository.save(existingAluno);
                        log.info("[DEMO SEEDER] Vínculo de mentor atualizado para aluno@studyos.demo -> {}", professor.getEmail());
                    }
                },
                () -> {
                    User u = User.builder()
                            .name("Aluno Demo")
                            .email("aluno@studyos.demo")
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
                }
        );

        log.info("[DEMO SEEDER] Seed de contas de demonstração finalizado com sucesso.");
    }
}
