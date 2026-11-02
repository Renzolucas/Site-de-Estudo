-- ==============================================================================
-- StudyOS - Script de Migração: Adicionar daily_min_minutes
-- ==============================================================================
-- 1. Adiciona a coluna daily_min_minutes permitindo NULL temporariamente
ALTER TABLE tasks ADD COLUMN daily_min_minutes INT NULL;

-- 2. Migra os valores existentes de planned_duration_minutes para daily_min_minutes
-- Mantém planned_duration_minutes intacto para preservar compatibilidade legado.
UPDATE tasks
SET daily_min_minutes = COALESCE(planned_duration_minutes, 30);

-- 3. Torna a coluna daily_min_minutes obrigatória (NOT NULL)
ALTER TABLE tasks MODIFY COLUMN daily_min_minutes INT NOT NULL;
