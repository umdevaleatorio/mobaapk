-- 1. Habilitar o RLS na tabela public.agropet_store_location
ALTER TABLE public.agropet_store_location ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Leitura pública de agropet_store_location" ON public.agropet_store_location;
DROP POLICY IF EXISTS "Admin controla agropet_store_location" ON public.agropet_store_location;

-- 3. Criar Política de Leitura Pública (Para que todos os clientes possam ler a posição da loja no mapa)
CREATE POLICY "Leitura pública de agropet_store_location" ON public.agropet_store_location
FOR SELECT
USING (true);

-- 4. Criar Política de Escrita/Controle Total apenas para administradores
CREATE POLICY "Admin controla agropet_store_location" ON public.agropet_store_location
FOR ALL
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');

-- 5. Habilitar publicação Realtime no Supabase para as tabelas principais
-- Adiciona na publicação supabase_realtime para habilitar o tempo real.
-- (Se já estiverem inseridas, a query é inofensiva e você pode apenas rodar).
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agropet_store_location;


