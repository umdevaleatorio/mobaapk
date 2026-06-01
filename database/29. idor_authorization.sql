-- =============================================================
-- Migration: Proteção IDOR em RPCs SECURITY DEFINER
-- Descrição: Adiciona verificação de autenticação e ownership
--   nos RPCs que aceitam user_id/order_id do cliente sem
--   validar se o usuário autenticado é o dono do recurso:
--   1. finalizar_pedido — verifica auth.uid() = p_user_id
--   2. confirm_pix_payment — verifica ownership + SET search_path
--   3. check_pix_status — verifica ownership + SET search_path
--   4. check_rate_limit — usa auth.uid() internamente
-- =============================================================

-- =============================================================
-- 1. finalizar_pedido — Adicionar guarda auth.uid()
-- =============================================================
DROP FUNCTION IF EXISTS public.finalizar_pedido;

CREATE OR REPLACE FUNCTION public.finalizar_pedido(
  p_user_id UUID,
  p_items JSONB,
  p_payment_method payment_method,
  p_delivery_type TEXT DEFAULT 'retirada',
  p_delivery_address TEXT DEFAULT '',
  p_needs_change TEXT DEFAULT '',
  p_idempotency_key UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_product RECORD;
  v_total DECIMAL(10,2) := 0;
  v_insufficient JSONB := '[]'::JSONB;
  v_cached JSONB;
  v_result JSONB;
  v_order_status TEXT;
BEGIN
  -- ==========================================================
  -- ETAPA 0: Verificar autenticação e ownership
  -- ==========================================================
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'NAO_AUTENTICADO';
  END IF;

  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'ACESSO_NEGADO';
  END IF;

  -- ==========================================================
  -- ETAPA 1: Verificar idempotência
  -- ==========================================================
  IF p_idempotency_key IS NOT NULL THEN
    SELECT response INTO v_cached
    FROM public.idempotency_keys
    WHERE id = p_idempotency_key;

    IF FOUND THEN
      RETURN v_cached;
    END IF;
  END IF;

  -- ==========================================================
  -- ETAPA 2: Validar estoque (com trava FOR UPDATE)
  -- ==========================================================
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT id, name, stock, active INTO v_product
    FROM public.products
    WHERE id = (v_item->>'product_id')::UUID
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'PRODUTO_NAO_ENCONTRADO:%', 
        jsonb_build_object(
          'product_id', v_item->>'product_id'
        )::TEXT;
    END IF;

    IF NOT v_product.active THEN
      v_insufficient := v_insufficient || jsonb_build_object(
        'product_id', v_product.id,
        'name', v_product.name,
        'requested', (v_item->>'quantity')::INTEGER,
        'available', 0
      );
      CONTINUE;
    END IF;

    IF v_product.stock < (v_item->>'quantity')::INTEGER THEN
      v_insufficient := v_insufficient || jsonb_build_object(
        'product_id', v_product.id,
        'name', v_product.name,
        'requested', (v_item->>'quantity')::INTEGER,
        'available', v_product.stock
      );
    END IF;
  END LOOP;

  IF jsonb_array_length(v_insufficient) > 0 THEN
    RAISE EXCEPTION 'ESTOQUE_INSUFICIENTE:%', v_insufficient::TEXT;
  END IF;

  -- ==========================================================
  -- ETAPA 3: Calcular total
  -- ==========================================================
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_total := v_total + (
      (v_item->>'unit_price')::DECIMAL * (v_item->>'quantity')::INTEGER
    );
  END LOOP;

  -- ==========================================================
  -- ETAPA 4: Definir status inicial do pedido
  -- ==========================================================
  IF p_payment_method = 'pix' THEN
    v_order_status := 'processing';
  ELSE
    v_order_status := 'confirmed';
  END IF;

  -- ==========================================================
  -- ETAPA 5: Criar o pedido
  -- ==========================================================
  INSERT INTO public.orders (
    user_id, status, total, delivery_type, 
    payment_method, delivery_address, needs_change
  )
  VALUES (
    p_user_id, v_order_status, v_total, p_delivery_type, 
    p_payment_method, p_delivery_address, p_needs_change
  )
  RETURNING id INTO v_order_id;

  -- ==========================================================
  -- ETAPA 6: Criar itens e decrementar estoque
  -- ==========================================================
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (order_id, product_id, quantity, unit_price)
    VALUES (
      v_order_id,
      (v_item->>'product_id')::UUID,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'unit_price')::DECIMAL
    );

    UPDATE public.products
    SET stock = stock - (v_item->>'quantity')::INTEGER
    WHERE id = (v_item->>'product_id')::UUID;
  END LOOP;

  -- ==========================================================
  -- ETAPA 7: Se PIX, criar transaction pendente
  -- ==========================================================
  IF p_payment_method = 'pix' THEN
    INSERT INTO public.payment_transactions (order_id, payment_method, amount, status)
    VALUES (v_order_id, 'pix', v_total, 'pending');
  END IF;

  -- ==========================================================
  -- ETAPA 8: Construir resultado e cache
  -- ==========================================================
  v_result := jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'total', v_total
  );

  IF p_idempotency_key IS NOT NULL THEN
    BEGIN
      INSERT INTO public.idempotency_keys (id, response)
      VALUES (p_idempotency_key, v_result);
    EXCEPTION WHEN unique_violation THEN
      NULL;
    END;
  END IF;

  RETURN v_result;
END;
$$;

-- =============================================================
-- Overload retroativo: check_rate_limit(p_user_id, p_endpoint, ...)
-- Mantido para não quebrar chamadas existentes que passam
-- p_user_id como primeiro parâmetro. O valor é ignorado —
-- a função principal usa auth.uid() internamente.
-- =============================================================
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id UUID,
  p_endpoint TEXT,
  p_max_requests INT DEFAULT 10,
  p_window_seconds INT DEFAULT 60
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN public.check_rate_limit(p_endpoint, p_max_requests, p_window_seconds);
END;
$$;

-- =============================================================
-- 5. cleanup_request_logs — Adicionar SET search_path + admin check
-- =============================================================
CREATE OR REPLACE FUNCTION public.cleanup_request_logs(
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
    RAISE EXCEPTION 'ACESSO_NEGADO' USING HINT = 'Apenas administradores podem limpar logs.';
  END IF;

  DELETE FROM public.request_logs
  WHERE created_at < timezone('utc'::text, now()) - (p_older_than_hours || ' hours')::INTERVAL;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- =============================================================
-- 2. confirm_pix_payment — Adicionar guarda de ownership
-- =============================================================
CREATE OR REPLACE FUNCTION public.confirm_pix_payment(
  p_order_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := timezone('utc'::text, now());
  v_order RECORD;
BEGIN
  -- Verificar autenticação
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NAO_AUTENTICADO');
  END IF;

  -- Verificar ownership (dono do pedido) ou admin
  IF NOT EXISTS (
    SELECT 1 FROM public.orders WHERE id = p_order_id AND user_id = auth.uid()
  ) AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'ACESSO_NEGADO');
  END IF;

  -- Verificar se o pedido existe
  SELECT id, status INTO v_order
  FROM public.orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pedido não encontrado');
  END IF;

  IF v_order.status = 'confirmed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pedido já confirmado');
  END IF;

  IF v_order.status = 'cancelled' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pedido cancelado');
  END IF;

  -- Atualizar transaction
  UPDATE public.payment_transactions
  SET status = 'paid',
      paid_at = v_now
  WHERE order_id = p_order_id AND status = 'pending';

  -- Atualizar status do pedido
  UPDATE public.orders
  SET status = 'confirmed',
      updated_at = v_now
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'status', 'confirmed',
    'paid_at', v_now
  );
END;
$$;

-- =============================================================
-- 3. check_pix_status — Adicionar guarda de ownership
-- =============================================================
CREATE OR REPLACE FUNCTION public.check_pix_status(
  p_order_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_tx RECORD;
BEGIN
  -- Verificar autenticação
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('found', false, 'error', 'NAO_AUTENTICADO');
  END IF;

  -- Verificar ownership ou admin
  IF NOT EXISTS (
    SELECT 1 FROM public.orders WHERE id = p_order_id AND user_id = auth.uid()
  ) AND NOT public.is_admin() THEN
    RETURN jsonb_build_object('found', false, 'error', 'ACESSO_NEGADO');
  END IF;

  SELECT pt.status, pt.paid_at, o.status as order_status
  INTO v_tx
  FROM public.orders o
  LEFT JOIN public.payment_transactions pt ON pt.order_id = o.id
  WHERE o.id = p_order_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  RETURN jsonb_build_object(
    'found', true,
    'transaction_status', COALESCE(v_tx.status, 'none'),
    'order_status', v_tx.order_status,
    'paid_at', v_tx.paid_at
  );
END;
$$;

-- =============================================================
-- 4. check_rate_limit — Usar auth.uid() em vez de parâmetro
-- =============================================================
DROP FUNCTION IF EXISTS public.check_rate_limit;

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_endpoint TEXT,
  p_max_requests INT DEFAULT 10,
  p_window_seconds INT DEFAULT 60
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_count INT;
  v_cutoff TIMESTAMPTZ;
BEGIN
  -- Obter ID do usuário autenticado
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'limit', p_max_requests,
      'window_seconds', p_window_seconds,
      'error', 'NAO_AUTENTICADO'
    );
  END IF;

  v_cutoff := timezone('utc'::text, now()) - (p_window_seconds || ' seconds')::INTERVAL;

  -- Contar requisições do próprio usuário
  SELECT COUNT(*) INTO v_count
  FROM public.request_logs
  WHERE user_id = v_user_id
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

  -- Registrar esta requisição (sempre com auth.uid())
  INSERT INTO public.request_logs (user_id, endpoint)
  VALUES (v_user_id, p_endpoint);

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
-- 5. cleanup_request_logs — Adicionar SET search_path
-- =============================================================
CREATE OR REPLACE FUNCTION public.cleanup_request_logs(
  p_older_than_hours INT DEFAULT 24
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
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
