-- =============================================================
-- Migration: Audit Log e Health Check
-- Descrição: Adiciona observabilidade ao sistema:
--   1. Tabela audit_logs para logging estruturado
--   2. RPC log_audit para registrar eventos
--   3. RPC health_check para verificar conectividade
-- =============================================================

-- =============================================================
-- Tabela: audit_logs
-- Registro estruturado de ações importantes no sistema
-- =============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  level TEXT DEFAULT 'info' CHECK (level IN ('info', 'warn', 'error')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs (created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin view all audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- =============================================================
-- RPC: log_audit
-- Registra um evento no audit_logs
-- Pode ser chamado por qualquer usuário autenticado
-- =============================================================
CREATE OR REPLACE FUNCTION public.log_audit(
  p_user_id UUID DEFAULT NULL,
  p_action TEXT DEFAULT '',
  p_metadata JSONB DEFAULT '{}'::JSONB,
  p_level TEXT DEFAULT 'info'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.audit_logs (user_id, action, metadata, level)
  VALUES (p_user_id, p_action, p_metadata, p_level)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- =============================================================
-- RPC: health_check
-- Verifica se o banco está respondendo
-- Retorna status básico do sistema
-- =============================================================
CREATE OR REPLACE FUNCTION public.health_check()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_db_ok BOOLEAN;
  v_order_count INT;
BEGIN
  SELECT true INTO v_db_ok FROM information_schema.tables WHERE table_schema = 'public' LIMIT 1;

  SELECT COUNT(*) INTO v_order_count FROM public.orders;

  RETURN jsonb_build_object(
    'status', 'ok',
    'timestamp', timezone('utc'::text, now()),
    'db', CASE WHEN v_db_ok THEN 'connected' ELSE 'error' END,
    'total_orders', v_order_count
  );
END;
$$;

-- =============================================================
-- Verificação rápida:
--
-- 1. Testar health check:
--    SELECT health_check();
--    -- Esperado: { "status": "ok", "db": "connected", ... }
--
-- 2. Testar audit log:
--    SELECT log_audit(
--      NULL,
--      'test.health_check',
--      '{"source": "migration"}'::JSONB,
--      'info'
--    );
--
-- 3. Verificar logs:
--    SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5;
-- =============================================================
