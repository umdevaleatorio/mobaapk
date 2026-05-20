-- =============================================================
-- Função RPC: finalizar_pedido
-- Descrição: Realiza o checkout de forma atômica, garantindo
--            que o estoque é validado e decrementado em uma
--            única transação. Impede race conditions com
--            SELECT ... FOR UPDATE.
--
-- IMPORTANTE: O estoque só é decrementado SE E SOMENTE SE
--             o checkout for completado com sucesso (pago).
-- =============================================================

CREATE OR REPLACE FUNCTION public.finalizar_pedido(
  p_user_id UUID,
  p_items JSONB,
  p_payment_method payment_method,
  p_delivery_type TEXT DEFAULT 'retirada',
  p_delivery_address TEXT DEFAULT '',
  p_needs_change TEXT DEFAULT ''
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
BEGIN
  -- ==========================================================
  -- ETAPA 1: Validar estoque de TODOS os itens (com trava)
  -- O SELECT ... FOR UPDATE trava as linhas dos produtos,
  -- impedindo que outro cliente leia o mesmo estoque ao
  -- mesmo tempo.
  -- ==========================================================
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT id, name, stock, active INTO v_product
    FROM public.products
    WHERE id = (v_item->>'product_id')::UUID
    FOR UPDATE;

    -- Produto não existe mais
    IF NOT FOUND THEN
      RAISE EXCEPTION 'PRODUTO_NAO_ENCONTRADO:%', 
        jsonb_build_object(
          'product_id', v_item->>'product_id'
        )::TEXT;
    END IF;

    -- Produto desativado
    IF NOT v_product.active THEN
      v_insufficient := v_insufficient || jsonb_build_object(
        'product_id', v_product.id,
        'name', v_product.name,
        'requested', (v_item->>'quantity')::INTEGER,
        'available', 0
      );
      CONTINUE;
    END IF;

    -- Estoque insuficiente
    IF v_product.stock < (v_item->>'quantity')::INTEGER THEN
      v_insufficient := v_insufficient || jsonb_build_object(
        'product_id', v_product.id,
        'name', v_product.name,
        'requested', (v_item->>'quantity')::INTEGER,
        'available', v_product.stock
      );
    END IF;
  END LOOP;

  -- ==========================================================
  -- ETAPA 2: Se algum item tem estoque insuficiente, abortar
  -- Nenhum dado é alterado — transação inteira é revertida.
  -- ==========================================================
  IF jsonb_array_length(v_insufficient) > 0 THEN
    RAISE EXCEPTION 'ESTOQUE_INSUFICIENTE:%', v_insufficient::TEXT;
  END IF;

  -- ==========================================================
  -- ETAPA 3: Calcular total do pedido
  -- ==========================================================
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_total := v_total + (
      (v_item->>'unit_price')::DECIMAL * (v_item->>'quantity')::INTEGER
    );
  END LOOP;

  -- ==========================================================
  -- ETAPA 4: Criar o pedido
  -- ==========================================================
  INSERT INTO public.orders (
    user_id, status, total, delivery_type, 
    payment_method, delivery_address, needs_change
  )
  VALUES (
    p_user_id, 'confirmed', v_total, p_delivery_type, 
    p_payment_method, p_delivery_address, p_needs_change
  )
  RETURNING id INTO v_order_id;

  -- ==========================================================
  -- ETAPA 5: Criar itens do pedido E decrementar estoque
  -- O estoque é decrementado AQUI, no momento do checkout.
  -- O trigger auto_deactivate_product cuida de desativar
  -- o produto se stock chegar a 0.
  -- ==========================================================
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    -- Inserir item do pedido
    INSERT INTO public.order_items (order_id, product_id, quantity, unit_price)
    VALUES (
      v_order_id,
      (v_item->>'product_id')::UUID,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'unit_price')::DECIMAL
    );

    -- Decrementar estoque
    UPDATE public.products
    SET stock = stock - (v_item->>'quantity')::INTEGER
    WHERE id = (v_item->>'product_id')::UUID;
  END LOOP;

  -- ==========================================================
  -- ETAPA 6: Retornar sucesso com dados do pedido
  -- ==========================================================
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'total', v_total
  );
END;
$$;

-- =============================================================
-- Verificação rápida (SQL Editor do Supabase):
--
-- SELECT finalizar_pedido(
--   '<user_uuid>'::UUID,
--   '[{"product_id":"<product_uuid>","quantity":1,"unit_price":29.90}]'::JSONB,
--   'pix'::payment_method,
--   'retirada',
--   '',
--   ''
-- );
--
-- Após execução, verificar:
--   SELECT stock, active FROM products WHERE id = '<product_uuid>';
--   SELECT * FROM orders ORDER BY created_at DESC LIMIT 1;
--   SELECT * FROM order_items ORDER BY order_id DESC LIMIT 1;
-- =============================================================
