-- =============================================================
-- Migration: Índices de Performance
-- Descrição: Adiciona índices estratégicos nas tabelas de
--   negócio para otimizar as queries mais frequentes:
--   1. orders(user_id, created_at DESC) — listagem do cliente
--   2. orders(status, created_at DESC) — listagem do admin
--   3. products(active, created_at DESC) — catálogo do cliente
--   4. products(active, name) — PDV do admin
--   5. order_items(order_id) — trigger de restauração
--   6. order_messages(order_id) — RLS e consultas
-- =============================================================

-- =============================================================
-- 1. orders(user_id, created_at DESC)
-- Query alvo: listagem de pedidos do cliente
--   .eq('user_id', user.id).order('created_at', {ascending: false})
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_orders_user_created
  ON public.orders (user_id, created_at DESC);

-- =============================================================
-- 2. orders(status, created_at DESC)
-- Query alvo: listagem de pedidos do admin
--   .in('status', [...]).order('created_at', {ascending: false})
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_orders_status_created
  ON public.orders (status, created_at DESC);

-- =============================================================
-- 3. products(active, created_at DESC)
-- Query alvo: catálogo de produtos do cliente
--   .eq('active', true).order('created_at', {ascending: false})
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_products_active_created
  ON public.products (active, created_at DESC);

-- =============================================================
-- 4. products(active, name)
-- Query alvo: PDV do admin (listagem de produtos ativos por nome)
--   .eq('active', true).order('name', {ascending: true})
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_products_active_name
  ON public.products (active, name);

-- =============================================================
-- 5. order_items(order_id)
-- Query alvo: trigger handle_order_cancellation()
--   SELECT product_id, quantity FROM order_items WHERE order_id = $1
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_order_items_order
  ON public.order_items (order_id);

-- =============================================================
-- 6. order_messages(order_id)
-- Query alvo: RLS policy de order_messages
--   (subconsulta WHERE order_id IN (SELECT id FROM orders WHERE user_id = $1))
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_order_messages_order
  ON public.order_messages (order_id);

-- =============================================================
-- Verificação rápida:
--
-- 1. Listar índices criados:
--    SELECT indexname, indexdef FROM pg_indexes
--    WHERE tablename IN ('orders','products','order_items','order_messages')
--    AND indexname LIKE 'idx_%'
--    ORDER BY tablename, indexname;
--
-- 2. Verificar se índices estão sendo usados (após carga de dados):
--    SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
--    FROM pg_stat_user_indexes
--    WHERE indexname LIKE 'idx_%'
--    ORDER BY idx_scan DESC;
-- =============================================================
