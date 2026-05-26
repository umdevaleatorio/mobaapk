-- =========================================================================
-- SCRIPT DE OTIMIZAÇÃO DAS POLÍTICAS RLS PARA EVITAR TIMEOUT (INFINITE LOOP)
-- Instruções: Execute este script no SQL Editor do seu Dashboard Supabase.
-- =========================================================================

-- 1. Garante que a função is_admin está criada e com SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Recriando políticas da tabela public.orders para usar is_admin() (Sem recursão e ultra veloz!)
DROP POLICY IF EXISTS "Admin view all orders" ON public.orders;
CREATE POLICY "Admin view all orders" ON public.orders FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Admin update all orders" ON public.orders;
CREATE POLICY "Admin update all orders" ON public.orders FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 3. Recriando políticas da tabela public.order_items
DROP POLICY IF EXISTS "Admin view all items" ON public.order_items;
CREATE POLICY "Admin view all items" ON public.order_items FOR SELECT
USING (public.is_admin());
