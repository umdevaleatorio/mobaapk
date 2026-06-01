-- =============================================================
-- Migration: Fluxo de Pagamento PIX
-- Descrição: Adiciona suporte a pagamento PIX com status
--   intermediário 'processing', tabela de transações, e RPCs
--   para consulta e confirmação de pagamento:
--   1. ALTER TYPE order_status ADD 'processing'
--   2. ALTER TABLE store_settings ADD chave_pix + pix_merchant_name
--   3. Tabela payment_transactions
--   4. RPC get_pix_key()
--   5. RPC check_pix_status()
--   6. RPC confirm_pix_payment()
--   7. Atualizar finalizar_pedido para PIX usar status 'processing'
-- =============================================================

-- =============================================================
-- 1. Adicionar status 'processing' ao order_status
-- =============================================================
-- ⚠️  ALTER TYPE ADD VALUE NÃO PODE estar em bloco BEGIN/COMMIT.
-- ⚠️  Rode ESTA linha ISOLADAMENTE no SQL Editor, depois o resto.
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'processing';

-- =============================================================
-- 2. Adicionar chave PIX e nome do merchant em store_settings
-- =============================================================
ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS chave_pix TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS pix_merchant_name TEXT DEFAULT '';

-- =============================================================
-- 3. Tabela: payment_transactions
-- Rastreia cada transação de pagamento iniciada
-- =============================================================
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  payment_method payment_method NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  gateway_tx_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_order
  ON public.payment_transactions (order_id);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own payment transactions"
  ON public.payment_transactions FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "Admin insert payment transactions"
  ON public.payment_transactions FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin update payment transactions"
  ON public.payment_transactions FOR UPDATE
  USING (public.is_admin());

-- =============================================================
-- 4. RPC: get_pix_key()
-- Retorna a chave PIX configurada no store_settings
-- =============================================================
CREATE OR REPLACE FUNCTION public.get_pix_key()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'chave_pix', COALESCE(chave_pix, ''),
    'pix_merchant_name', COALESCE(pix_merchant_name, ''),
    'found', true
  ) INTO v_result
  FROM public.store_settings
  LIMIT 1;

  IF v_result IS NULL THEN
    RETURN jsonb_build_object(
      'chave_pix', '',
      'pix_merchant_name', '',
      'found', false
    );
  END IF;

  RETURN v_result;
END;
$$;

-- =============================================================
-- 5. RPC: check_pix_status(p_order_id)
-- Retorna o status atual da transação PIX de um pedido
-- =============================================================
CREATE OR REPLACE FUNCTION public.check_pix_status(
  p_order_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tx RECORD;
BEGIN
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
-- 6. RPC: confirm_pix_payment(p_order_id)
-- Confirma o pagamento PIX: atualiza transaction para 'paid'
-- e order status para 'confirmed'
-- =============================================================
CREATE OR REPLACE FUNCTION public.confirm_pix_payment(
  p_order_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now TIMESTAMPTZ := timezone('utc'::text, now());
  v_order RECORD;
BEGIN
  -- Verificar se o pedido existe e está em 'processing'
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
-- 7. Atualizar RPC: finalizar_pedido
-- Para PIX: status = 'processing' + criar payment_transactions
-- Para outros métodos: status = 'confirmed' (fluxo atual)
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
SECURITY DEFINER
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
  -- ETAPA 0: Verificar idempotência
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
  -- ETAPA 1: Validar estoque (com trava FOR UPDATE)
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
  -- ETAPA 2: Calcular total
  -- ==========================================================
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_total := v_total + (
      (v_item->>'unit_price')::DECIMAL * (v_item->>'quantity')::INTEGER
    );
  END LOOP;

  -- ==========================================================
  -- ETAPA 3: Definir status inicial do pedido
  -- PIX → processing, demais → confirmed
  -- ==========================================================
  IF p_payment_method = 'pix' THEN
    v_order_status := 'processing';
  ELSE
    v_order_status := 'confirmed';
  END IF;

  -- ==========================================================
  -- ETAPA 4: Criar o pedido
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
  -- ETAPA 5: Criar itens e decrementar estoque
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
  -- ETAPA 6: Se PIX, criar transaction pendente
  -- ==========================================================
  IF p_payment_method = 'pix' THEN
    INSERT INTO public.payment_transactions (order_id, payment_method, amount, status)
    VALUES (v_order_id, 'pix', v_total, 'pending');
  END IF;

  -- ==========================================================
  -- ETAPA 7: Construir resultado e cache
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
-- Verificação rápida (SQL Editor do Supabase):
--
-- 1. Verificar chave PIX da loja:
--    SELECT get_pix_key();
--
-- 2. Fazer pedido PIX:
--    SELECT finalizar_pedido(
--      '<user_uuid>'::UUID,
--      '[{"product_id":"<product_uuid>","quantity":1,"unit_price":29.90}]'::JSONB,
--      'pix'::payment_method
--    );
--
-- 3. Verificar transação:
--    SELECT * FROM payment_transactions ORDER BY created_at DESC;
--    SELECT check_pix_status('<order_uuid>');
--
-- 4. Confirmar pagamento:
--    SELECT confirm_pix_payment('<order_uuid>');
--    SELECT check_pix_status('<order_uuid>');
-- =============================================================
