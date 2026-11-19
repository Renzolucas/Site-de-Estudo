-- =============================================================================
-- StudyOS - Migração Painel do Professor/Mentor e Avisos (2026-11-mentor.sql)
-- =============================================================================
-- Instruções de Execução:
-- 1. Conecte-se ao seu banco de dados MySQL via terminal, DBeaver ou MySQL Workbench:
--    mysql -u root -p studyos < back/studyos/sql/2026-11-mentor.sql
-- 2. Ou execute os comandos diretamente na sua ferramenta de preferência após selecionar o banco:
--    USE studyos;
-- 3. Nota: Se o Hibernate (ddl-auto=update) estiver em uso, a coluna 'target_student_id'
--    e novos valores de enum são adaptados automaticamente.
-- =============================================================================

USE studyos;

-- 1. Adiciona coluna de aluno destinatário específico na tabela de avisos (announcements)
ALTER TABLE announcements
    ADD COLUMN IF NOT EXISTS target_student_id BIGINT NULL,
    ADD CONSTRAINT fk_announcements_target_student
        FOREIGN KEY (target_student_id) REFERENCES users (id);

-- 2. Índice para consultas rápidas de comunicados por autor (mentor) e data
CREATE INDEX IF NOT EXISTS idx_announcements_author ON announcements (author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_target ON announcements (target_student_id);
