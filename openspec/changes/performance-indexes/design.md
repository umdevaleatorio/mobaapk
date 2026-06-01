# Design: Índices de Performance

## Banco de Dados

### Migration: `27. performance_indexes.sql`

#### Índices

```sql
-- 1. Listagem de pedidos do cliente (filtro por user_id + ordenação por data)
CREATE INDEX IF NOT EXISTS idx_orders_user_created
  ON public.orders (user_id, created_at DESC);

-- 2. Listagem de pedidos do admin (filtro por status + ordenação por data)
CREATE INDEX IF NOT EXISTS idx_orders_status_created
  ON public.orders (status, created_at DESC);

-- 3. Catálogo de produtos do cliente (filtro por active + ordenação por data)
CREATE INDEX IF NOT EXISTS idx_products_active_created
  ON public.products (active, created_at DESC);

-- 4. PDV do admin (filtro por active + ordenação por nome)
CREATE INDEX IF NOT EXISTS idx_products_active_name
  ON public.products (active, name);

-- 5. Trigger de restauração de estoque (busca order_items por order_id)
CREATE INDEX IF NOT EXISTS idx_order_items_order
  ON public.order_items (order_id);

-- 6. RLS de order_messages (subconsulta por order_id)
CREATE INDEX IF NOT EXISTS idx_order_messages_order
  ON public.order_messages (order_id);
```

#### Justificativa

| Índice | Query alvo | Impacto estimado |
|--------|-----------|------------------|
| `orders(user_id, created_at DESC)` | `useOrdersScreen`, `useTrackingScreen` — filtra por user_id e ordena por data | Cobertura total: índice atende filtro + ordenação sem sort adicional |
| `orders(status, created_at DESC)` | `useAdminOrders`, `useAdminConsultSales`, `useAdminSalesHistoryScreen` — filtra por status e ordena por data | Cobertura total: mesmo princípio |
| `products(active, created_at DESC)` | `useHomeScreen` — filtra ativos e ordena por data | Cobertura total |
| `products(active, name)` | `useAdminDashboardPdv` — filtra ativos e ordena por nome | Cobertura total |
| `order_items(order_id)` | `handle_order_cancellation()` trigger — busca itens por order_id | Evita scan na trigger |
| `order_messages(order_id)` | RLS policy — subconsulta `WHERE order_id IN (SELECT id FROM orders WHERE user_id = $1)` | Evita scan em RLS |
