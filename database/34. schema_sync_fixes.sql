-- =============================================================
-- Migration: Correções de Sincronia do Schema
-- Versão: 34
-- Depende de: 22–33 executadas em ordem
--
-- Correções (aplicáveis após 29 e 31 terem rodado):
--   1. cleanup_idempotency_keys — admin check + SET search_path
-- =============================================================

-- =============================================================
-- 1. cleanup_idempotency_keys — adicionar SET search_path
-- =============================================================
-- A migration 25 criou esta função com SECURITY DEFINER sem
-- SET search_path, o que é um risco de segurança (pode ler
-- objetos de outros schemas). Adicionamos também o admin check.
-- =============================================================

CREATE OR REPLACE FUNCTION public.cleanup_idempotency_keys(
  p_older_than_hours INT DEFAULT 24
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_deleted INT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'ACESSO_NEGADO' USING HINT = 'Apenas administradores podem limpar chaves de idempotência.';
  END IF;

  DELETE FROM public.idempotency_keys
  WHERE created_at < timezone('utc'::text, now()) - (p_older_than_hours || ' hours')::INTERVAL;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- =============================================================
-- Verificação rápida:
--
-- 1. Testar cleanup seguro:
--    SELECT cleanup_idempotency_keys(24);
--    -- Cliente recebe ACESSO_NEGADO, admin executa com sucesso
-- =============================================================
