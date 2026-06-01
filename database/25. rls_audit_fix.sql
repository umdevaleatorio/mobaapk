-- =============================================================
-- Migration: RLS Audit Fix
-- Descrição: Adiciona RLS nas tabelas que estavam sem proteção
--            (competitors, order_messages) e adiciona verificação
--            de role admin nas RPCs de manutenção.
-- =============================================================

-- =============================================================
-- 1. RLS para tabela competitors
-- Leitura pública (dados de mapa), escrita apenas admin
-- =============================================================
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura pública de concorrentes" ON public.competitors;
CREATE POLICY "Leitura pública de concorrentes"
  ON public.competitors FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin controla concorrentes" ON public.competitors;
CREATE POLICY "Admin controla concorrentes"
  ON public.competitors FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================
-- 2. RLS para tabela order_messages
-- Cliente vê apenas mensagens dos próprios pedidos
-- Admin vê todas
-- =============================================================
ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Client view own order messages" ON public.order_messages;
CREATE POLICY "Client view own order messages"
  ON public.order_messages FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Client insert own order messages" ON public.order_messages;
CREATE POLICY "Client insert own order messages"
  ON public.order_messages FOR INSERT
  WITH CHECK (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admin manage order messages" ON public.order_messages;
CREATE POLICY "Admin manage order messages"
  ON public.order_messages FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =============================================================
-- 3. Verificação de admin nas RPCs de cleanup
-- Apenas administradores podem limpar logs/chaves
-- =============================================================

CREATE OR REPLACE FUNCTION public.cleanup_request_logs(
  p_older_than_hours INT DEFAULT 24
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted INT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'ACESSO_NEGADO' USING HINT = 'Apenas administradores podem limpar logs.';
  END IF;

  DELETE FROM public.request_logs
  WHERE created_at < timezone('utc'::text, now()) - (p_older_than_hours || ' hours')::INTERVAL;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_idempotency_keys(
  p_older_than_hours INT DEFAULT 24
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
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
-- Verificação rápida (SQL Editor do Supabase):
--
-- 1. Testar RLS em competitors:
--    INSERT INTO competitors (name, lat, lng) VALUES ('Teste', 0, 0);
--    -- Cliente deve receber erro de permissão
--
-- 2. Testar RLS em order_messages:
--    SELECT * FROM order_messages;
--    -- Cliente vê apenas mensagens dos próprios pedidos
--
-- 3. Testar cleanup:
--    SELECT cleanup_request_logs(24);
--    -- Cliente recebe ACESSO_NEGADO, admin executa com sucesso
-- =============================================================
