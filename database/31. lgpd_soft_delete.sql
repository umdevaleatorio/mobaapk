-- =============================================================
-- Migration: Soft Delete + LGPD (Data Export)
-- Descrição: Adiciona colunas de soft delete em public.users,
--   RPCs para exclusão, reativação e exportação de dados.
-- =============================================================

-- =============================================================
-- 1. Adicionar colunas de soft delete
-- =============================================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS scheduled_delete_at TIMESTAMPTZ;

-- =============================================================
-- 2. request_account_deletion — Solicitar exclusão
-- =============================================================
CREATE OR REPLACE FUNCTION public.request_account_deletion()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NAO_AUTENTICADO');
  END IF;

  UPDATE public.users
  SET deleted_at = timezone('utc'::text, now()),
      scheduled_delete_at = timezone('utc'::text, now()) + INTERVAL '30 days'
  WHERE id = v_user_id;

  INSERT INTO public.audit_logs (user_id, action, resource, resource_id, details)
  VALUES (v_user_id, 'request_account_deletion', 'users', v_user_id::TEXT,
    jsonb_build_object('scheduled_delete_at', timezone('utc'::text, now()) + INTERVAL '30 days')
  );

  RETURN jsonb_build_object(
    'success', true,
    'deleted_at', timezone('utc'::text, now()),
    'scheduled_delete_at', timezone('utc'::text, now()) + INTERVAL '30 days'
  );
END;
$$;

-- =============================================================
-- 3. cancel_account_deletion — Reativar conta
-- =============================================================
CREATE OR REPLACE FUNCTION public.cancel_account_deletion()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user RECORD;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NAO_AUTENTICADO');
  END IF;

  SELECT id, deleted_at, scheduled_delete_at INTO v_user
  FROM public.users
  WHERE id = v_user_id;

  IF v_user.deleted_at IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'CONTA_NAO_MARCADA');
  END IF;

  IF v_user.scheduled_delete_at < timezone('utc'::text, now()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'PRAZO_EXPIRADO');
  END IF;

  UPDATE public.users
  SET deleted_at = NULL,
      scheduled_delete_at = NULL
  WHERE id = v_user_id;

  INSERT INTO public.audit_logs (user_id, action, resource, resource_id, details)
  VALUES (v_user_id, 'cancel_account_deletion', 'users', v_user_id::TEXT,
    jsonb_build_object('reactivated_at', timezone('utc'::text, now()))
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

-- =============================================================
-- 4. export_user_data — Exportar dados do usuário (LGPD)
-- =============================================================
CREATE OR REPLACE FUNCTION public.export_user_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_profile JSONB;
  v_orders JSONB;
  v_payments JSONB;
  v_audit_logs JSONB;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NAO_AUTENTICADO');
  END IF;

  -- Profile
  SELECT row_to_json(u)::JSONB INTO v_profile
  FROM (
    SELECT id, name, email, phone, address, city, cep, username,
           rua, bairro, numero, lat, lng, role, created_at
    FROM public.users
    WHERE id = v_user_id
  ) u;

  -- Orders + items + messages
  SELECT jsonb_agg(
    jsonb_build_object(
      'order', row_to_json(o),
      'items', (
        SELECT jsonb_agg(row_to_json(oi))
        FROM public.order_items oi
        WHERE oi.order_id = o.id
      ),
      'messages', (
        SELECT jsonb_agg(row_to_json(om))
        FROM public.order_messages om
        WHERE om.order_id = o.id
      )
    )
  ) INTO v_orders
  FROM public.orders o
  WHERE o.user_id = v_user_id;

  -- Payment transactions
  SELECT jsonb_agg(row_to_json(pt)) INTO v_payments
  FROM public.payment_transactions pt
  WHERE pt.order_id IN (SELECT id FROM public.orders WHERE user_id = v_user_id);

  -- Audit logs
  SELECT jsonb_agg(row_to_json(al)) INTO v_audit_logs
  FROM (
    SELECT id, action, resource, resource_id, details, created_at
    FROM public.audit_logs
    WHERE user_id = v_user_id
    ORDER BY created_at DESC
  ) al;

  INSERT INTO public.audit_logs (user_id, action, resource, resource_id, details)
  VALUES (v_user_id, 'export_user_data', 'users', v_user_id::TEXT,
    jsonb_build_object('exported_at', timezone('utc'::text, now()))
  );

  RETURN jsonb_build_object(
    'success', true,
    'exported_at', timezone('utc'::text, now()),
    'profile', v_profile,
    'orders', COALESCE(v_orders, '[]'::JSONB),
    'payments', COALESCE(v_payments, '[]'::JSONB),
    'audit_logs', COALESCE(v_audit_logs, '[]'::JSONB)
  );
END;
$$;

-- =============================================================
-- 5. hard_delete_expired_accounts — Admin: remoção permanente
-- =============================================================
CREATE OR REPLACE FUNCTION public.hard_delete_expired_accounts()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_count INT := 0;
  v_user RECORD;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'ACESSO_NEGADO';
  END IF;

  FOR v_user IN
    SELECT id FROM public.users
    WHERE scheduled_delete_at IS NOT NULL
      AND scheduled_delete_at < timezone('utc'::text, now())
  LOOP
    -- Audit antes de deletar
    INSERT INTO public.audit_logs (user_id, action, resource, resource_id, details)
    VALUES (auth.uid(), 'hard_delete_account', 'users', v_user.id::TEXT,
      jsonb_build_object('deleted_at', timezone('utc'::text, now()))
    );

    -- Deletar de auth.users (cascade para public.users e dependentes)
    DELETE FROM auth.users WHERE id = v_user.id;
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- Owner = postgres para permitir DELETE FROM auth.users via SECURITY DEFINER
ALTER FUNCTION public.hard_delete_expired_accounts() OWNER TO postgres;
