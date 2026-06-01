-- =============================================================
-- Migration: Patch audit_log — Colunas faltantes
-- Versão:    26.1
-- Depende de: 26. audit_log.sql
-- Deve rodar ANTES de: 30. concurrent_editing.sql
--                      31. lgpd_soft_delete.sql
--                      32. notification_queue.sql
--
-- Problema detectado na análise de segurança (31/05/2026):
--   A tabela audit_logs criada em 26. possui colunas:
--     id, user_id, action, metadata, level, created_at
--
--   As migrations 30., 31. e 32. fazem INSERT com colunas:
--     (user_id, action, resource, resource_id, details)
--
--   As colunas resource, resource_id e details NÃO existiam,
--   o que causaria erro de coluna inexistente em runtime.
--
-- Solução: adicionar as colunas em falta sem alterar nenhuma
--   lógica existente, utilizando IF NOT EXISTS para idempotência.
-- =============================================================

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS resource     TEXT,
  ADD COLUMN IF NOT EXISTS resource_id  TEXT,
  ADD COLUMN IF NOT EXISTS details      JSONB;

-- =============================================================
-- Verificação rápida:
--
--   SELECT column_name, data_type
--   FROM information_schema.columns
--   WHERE table_schema = 'public'
--     AND table_name   = 'audit_logs'
--   ORDER BY ordinal_position;
--
--   Esperado: id, user_id, action, metadata, level, created_at,
--             resource, resource_id, details
-- =============================================================
