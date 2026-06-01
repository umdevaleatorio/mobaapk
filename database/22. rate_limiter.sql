-- =============================================================
-- Migration: Rate Limiter
-- Descrição: Tabela de logs de requisição + RPC de rate limiting
--            para proteger endpoints sensíveis contra abuso.
--
-- Uso:
--   SELECT check_rate_limit(
--     '<user_id>'::UUID,
--     'finalizar_pedido',
--     5,   -- max 5 requisições
--     60   -- por 60 segundos
--   );
-- =============================================================

-- =============================================================
-- Tabela: request_logs
-- Registra cada requisição feita por usuário + endpoint
-- =============================================================
CREATE TABLE IF NOT EXISTS public.request_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índice para busca rápida por usuário + endpoint + janela de tempo
CREATE INDEX IF NOT EXISTS idx_request_logs_lookup
  ON public.request_logs (user_id, endpoint, created_at DESC);

-- Habilitar RLS (segurança: ninguém lista logs de outros)
ALTER TABLE public.request_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own request logs"
  ON public.request_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages request logs"
  ON public.request_logs FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================================
-- RPC: check_rate_limit
-- Verifica se o usuário excedeu o limite de requisições para
-- um endpoint em uma janela de tempo. Se permitido, registra
-- a requisição automaticamente.
--
-- Parâmetros:
--   p_user_id       UUID      → ID do usuário
--   p_endpoint      TEXT      → Nome do endpoint (ex: 'finalizar_pedido')
--   p_max_requests  INT (10)  → Máximo de requisições permitidas
--   p_window_seconds INT (60) → Janela de tempo em segundos
--
-- Retorno:
--   { allowed: bool, remaining: int, limit: int, window_seconds: int }
-- =============================================================
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT,
  p_max_requests INT DEFAULT 10,
  p_window_seconds INT DEFAULT 60
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INT;
  v_cutoff TIMESTAMPTZ;
BEGIN
  v_cutoff := timezone('utc'::text, now()) - (p_window_seconds || ' seconds')::INTERVAL;

  -- Contar requisições do usuário para este endpoint na janela
  SELECT COUNT(*) INTO v_count
  FROM public.request_logs
  WHERE user_id = p_user_id
    AND endpoint = p_endpoint
    AND created_at > v_cutoff;

  -- Limite excedido: rejeitar
  IF v_count >= p_max_requests THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'limit', p_max_requests,
      'window_seconds', p_window_seconds
    );
  END IF;

  -- Registrar esta requisição
  INSERT INTO public.request_logs (user_id, endpoint)
  VALUES (p_user_id, p_endpoint);

  -- Permitir
  RETURN jsonb_build_object(
    'allowed', true,
    'remaining', p_max_requests - v_count - 1,
    'limit', p_max_requests,
    'window_seconds', p_window_seconds
  );
END;
$$;

-- =============================================================
-- RPC: cleanup_request_logs
-- Remove logs mais antigos que 24 horas para evitar acúmulo.
-- Pode ser chamada por um cron externo ou manualmente.
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
  DELETE FROM public.request_logs
  WHERE created_at < timezone('utc'::text, now()) - (p_older_than_hours || ' hours')::INTERVAL;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- =============================================================
-- Verificação rápida (SQL Editor do Supabase):
--
-- 1. Testar rate limit (deve permitir):
--    SELECT check_rate_limit(
--      '<user_uuid>'::UUID,
--      'finalizar_pedido',
--      5, 60
--    );
--    -- Esperado: { "allowed": true, "remaining": 4, ... }
--
-- 2. Verificar logs:
--    SELECT * FROM request_logs WHERE user_id = '<user_uuid>';
--
-- 3. Limpar logs antigos:
--    SELECT cleanup_request_logs(24);
-- =============================================================
