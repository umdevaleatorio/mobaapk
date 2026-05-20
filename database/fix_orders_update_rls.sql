-- =============================================================
-- Correção de RLS para UPDATE na Tabela de Pedidos (Orders)
-- Descrição: 
--   1. Permite que Clientes atualizem (cancelar) os próprios pedidos.
--   2. Permite que Administradores atualizem qualquer pedido (mudar status).
-- =============================================================

-- 1. Permissão de UPDATE para Clientes (para cancelamento)
DROP POLICY IF EXISTS "Client update own orders" ON public.orders;
CREATE POLICY "Client update own orders" ON public.orders FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Permissão de UPDATE para Administradores (para gerenciar status)
DROP POLICY IF EXISTS "Admin update all orders" ON public.orders;
CREATE POLICY "Admin update all orders" ON public.orders FOR UPDATE
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
