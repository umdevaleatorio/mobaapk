-- =============================================================
-- Migration: Idempotency Keys
-- Descrição: Adiciona suporte a chave de idempotência no
--            fluxo de finalização de pedido para evitar
--            pedidos duplicados em caso de duplo clique
--            ou retry de rede.
-- =============================================================

-- =============================================================
-- Tabela: idempotency_keys
-- Armazena o resultado de cada requisição já processada.
-- A própria chave é o PK (UUID gerado no cliente).
-- =============================================================
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  id UUID PRIMARY KEY,
  response JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índice para busca rápida por chave (já é PK, mas índice explícito ajuda)
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_created_at
  ON public.idempotency_keys (created_at);

-- Habilitar RLS (apenas service_role pode ler/escrever)
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages idempotency keys"
  ON public.idempotency_keys FOR ALL
  USING (auth.role() = 'service_role');

-- =============================================================
-- Modificar RPC: finalizar_pedido
-- Adiciona parâmetro opcional p_idempotency_key.
-- Se fornecido e já existir, retorna o resultado em cache.
-- =============================================================

-- Primeiro dropar a função existente para recriar com nova assinatura
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
BEGIN
  -- ==========================================================
  -- ETAPA 0: Verificar idempotência
  -- Se a chave já foi processada, retornar resultado em cache.
  -- Isso acontece antes de qualquer lock ou operação no banco.
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
  -- ETAPA 6: Construir resultado e armazenar em cache
  -- ==========================================================
  v_result := jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'total', v_total
  );

  -- Armazenar resultado para idempotência
  IF p_idempotency_key IS NOT NULL THEN
    BEGIN
      INSERT INTO public.idempotency_keys (id, response)
      VALUES (p_idempotency_key, v_result);
    EXCEPTION WHEN unique_violation THEN
      -- Outra requisição concorrente já armazenou esta chave
      -- Ignorar e continuar — o resultado é o mesmo
      NULL;
    END;
  END IF;

  RETURN v_result;
END;
$$;

-- =============================================================
-- RPC: cleanup_idempotency_keys
-- Remove chaves de idempotência mais antigas que N horas.
-- =============================================================
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
  DELETE FROM public.idempotency_keys
  WHERE created_at < timezone('utc'::text, now()) - (p_older_than_hours || ' hours')::INTERVAL;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- =============================================================
-- Verificação rápida (SQL Editor do Supabase):
--
-- 1. Gerar um UUID no cliente e passar como p_idempotency_key:
--    SELECT finalizar_pedido(
--      '<user_uuid>'::UUID,
--      '[{"product_id":"<product_uuid>","quantity":1,"unit_price":29.90}]'::JSONB,
--      'pix'::payment_method,
--      'retirada',
--      '',
--      '',
--      '<idempotency_uuid>'::UUID
--    );
--
-- 2. Chamar a mesma função com o mesmo UUID novamente:
--    Deve retornar o MESMO resultado sem criar novo pedido.
--
-- 3. Limpar chaves antigas:
--    SELECT cleanup_idempotency_keys(24);
-- =============================================================
