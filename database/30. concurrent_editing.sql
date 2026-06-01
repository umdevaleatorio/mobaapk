-- =============================================================
-- Migration: Proteção de Edição Concorrente (Item #6)
-- Descrição: Adiciona NOWAIT + lock_timeout + ordenação de locks
--   no RPC finalizar_pedido e proteção contra deadlock no
--   trigger handle_order_cancellation.
-- =============================================================

-- =============================================================
-- 1. finalizar_pedido — Lock com NOWAIT e timeout
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
  v_sorted_items JSONB;
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
  -- ETAPA 0.5: Configurar lock_timeout
  -- ==========================================================
  SET LOCAL lock_timeout = '5000';

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
  -- ETAPA 2: Validar estoque (com trava FOR UPDATE NOWAIT)
  -- ==========================================================
  v_sorted_items := (
    SELECT jsonb_agg(el ORDER BY el->>'product_id')
    FROM jsonb_array_elements(p_items) el
  );

  FOR v_item IN SELECT * FROM jsonb_array_elements(v_sorted_items)
  LOOP
    BEGIN
      SELECT id, name, stock, active INTO v_product
      FROM public.products
      WHERE id = (v_item->>'product_id')::UUID
      FOR UPDATE NOWAIT;

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
    EXCEPTION
      WHEN lock_not_available THEN
        RAISE EXCEPTION 'RECURSO_OCUPADO';
    END;
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
-- 2. handle_order_cancellation — Proteção contra deadlock
-- =============================================================
CREATE OR REPLACE FUNCTION public.handle_order_cancellation()
RETURNS TRIGGER AS $$
DECLARE
  v_item RECORD;
  v_error_context TEXT;
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    FOR v_item IN
      SELECT product_id, quantity
      FROM public.order_items
      WHERE order_id = NEW.id
    LOOP
      LOOP
        BEGIN
          UPDATE public.products
          SET stock = stock + v_item.quantity
          WHERE id = v_item.product_id;
          EXIT;
        EXCEPTION
          WHEN deadlock_detected THEN
            v_error_context := jsonb_build_object(
              'trigger', 'handle_order_cancellation',
              'product_id', v_item.product_id,
              'order_id', NEW.id,
              'error', SQLERRM
            )::TEXT;

            INSERT INTO public.audit_logs (
              user_id, action, resource, resource_id, details
            ) VALUES (
              auth.uid(), 'deadlock_retry', 'products',
              v_item.product_id::TEXT, v_error_context
            );

            PERFORM pg_sleep(0.1);
        END;
      END LOOP;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
