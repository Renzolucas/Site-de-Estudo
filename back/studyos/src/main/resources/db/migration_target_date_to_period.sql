-- ==============================================================================
-- StudyOS - Script de Migração: targetDate -> startDate & endDate (Período)
-- ==============================================================================
-- Instruções de aplicação:
-- 1. Conecte-se ao banco de dados MySQL 'studyos' via MySQL CLI ou Workbench:
--    mysql -u <usuario> -p studyos < migration_target_date_to_period.sql
-- 2. Execute as instruções abaixo na ordem indicada.
-- ==============================================================================

-- 1. Adiciona as novas colunas temporariamente permitindo NULL para preenchimento
ALTER TABLE tasks ADD COLUMN start_date DATE NULL;
ALTER TABLE tasks ADD COLUMN end_date DATE NULL;

-- 2. Migra as datas existentes de target_date para start_date e end_date
UPDATE tasks
SET start_date = target_date,
    end_date = target_date
WHERE target_date IS NOT NULL;

-- 3. Caso existam registros com target_date nulo, define CURRENT_DATE como fallback
UPDATE tasks
SET start_date = CURRENT_DATE,
    end_date = CURRENT_DATE
WHERE start_date IS NULL;

-- 4. Torna as colunas obrigatórias (NOT NULL)
ALTER TABLE tasks MODIFY COLUMN start_date DATE NOT NULL;
ALTER TABLE tasks MODIFY COLUMN end_date DATE NOT NULL;

-- 5. Remove a coluna legada target_date
ALTER TABLE tasks DROP COLUMN target_date;
