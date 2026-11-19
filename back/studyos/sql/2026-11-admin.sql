-- =============================================================================
-- StudyOS - Migração Painel Administrativo, Avisos e Auditoria (2026-11-admin.sql)
-- =============================================================================
-- Instruções de Execução:
-- 1. Conecte-se ao seu banco de dados MySQL via terminal, DBeaver ou MySQL Workbench:
--    mysql -u root -p studyos < back/studyos/sql/2026-11-admin.sql
-- 2. Ou execute os comandos diretamente na sua ferramenta de preferência após selecionar o banco:
--    USE studyos;
-- 3. Nota: Se o Hibernate (ddl-auto=update) já estiver em uso, as tabelas 'announcements'
--    e 'admin_action_logs' são criadas automaticamente na inicialização da aplicação.
-- =============================================================================

USE studyos;

-- 1. Criação da tabela de avisos/comunicados (announcements)
CREATE TABLE IF NOT EXISTS announcements (
    id BIGINT NOT NULL AUTO_INCREMENT,
    author_id BIGINT NOT NULL,
    title VARCHAR(80) NOT NULL,
    message VARCHAR(300) NOT NULL,
    audience VARCHAR(30) NOT NULL,
    created_at DATETIME NOT NULL,
    recipients_count INT NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT fk_announcements_author FOREIGN KEY (author_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Criação da tabela de log de ações administrativas (admin_action_logs)
CREATE TABLE IF NOT EXISTS admin_action_logs (
    id BIGINT NOT NULL AUTO_INCREMENT,
    actor_id BIGINT NOT NULL,
    target_user_id BIGINT NULL,
    action VARCHAR(50) NOT NULL,
    details TEXT NOT NULL,
    created_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_admin_logs_actor FOREIGN KEY (actor_id) REFERENCES users (id),
    CONSTRAINT fk_admin_logs_target FOREIGN KEY (target_user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Índices de performance para busca e ordenação
CREATE INDEX idx_announcements_created ON announcements (created_at DESC);
CREATE INDEX idx_admin_logs_created ON admin_action_logs (created_at DESC);
