-- SCRIPT PRODUÇÃO SECURE (RLS DEFINITIVO E SEGURO)

-- 1. Limpando a permissão provisória (passe-livre inseguro)
DROP POLICY IF EXISTS "Permissao Total Autenticados Orders" ON public.orders;
DROP POLICY IF EXISTS "Permissao Total Autenticados Order_Items" ON public.order_items;

-- 2. POLÍTICAS DA TABELA ORDERS (PEDIDOS)
-- Permite que o Cliente leia APENAS os próprios pedidos (Segurança Máxima)
CREATE POLICY "Client view own orders" ON public.orders FOR SELECT
USING (auth.uid() = user_id);

-- Permite que o Cliente crie (Checkout) um pedido SEMPRE usando o próprio ID (Impossível fraudar)
CREATE POLICY "Client insert own orders" ON public.orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Permite que o Administrador leia e veja os pedidos de TODO MUNDO na Loja (Necessário para a Tarefa T3.9)
CREATE POLICY "Admin view all orders" ON public.orders FOR SELECT
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- 3. POLÍTICAS DA TABELA ORDER_ITEMS (CARRINHO SALVO)
-- Cliente só lê os itens que pertencem a um Pedido dele
CREATE POLICY "Client view own items" ON public.order_items FOR SELECT
USING (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()));

-- Cliente só insere itens em um pedido que é comprovadamente dele
CREATE POLICY "Client insert own items" ON public.order_items FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()));

-- Administrador enxerga os itens de todos os pedidos da loja
CREATE POLICY "Admin view all items" ON public.order_items FOR SELECT
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
