-- =============================================================
-- Migration: Stock Check Constraint
-- Descrição: Adiciona CHECK constraint na tabela products
--            para garantir que o estoque nunca fique negativo.
--            Última linha de defesa mesmo que o RPC ou trigger
--            falhem por algum motivo.
-- =============================================================

-- Adicionar CHECK constraint para evitar estoque negativo
ALTER TABLE public.products
  ADD CONSTRAINT products_stock_non_negative
  CHECK (stock >= 0);

-- =============================================================
-- Nota: Esta constraint é a garantia final. Mesmo que o
-- SELECT ... FOR UPDATE ou a lógica do RPC finalizar_pedido
-- tenha alguma falha, o banco impedirá que o estoque fique
-- abaixo de zero, retornando um erro de violação de CHECK.
-- 
-- O RPC finalizar_pedido já verifica estoque suficiente
-- antes de decrementar, então esta constraint serve como
-- redundância (defense in depth).
-- =============================================================
