-- =============================================================
-- Correção de RLS para a Tabela de Configurações da Loja (store_settings)
-- Descrição:
--   1. Habilita RLS na tabela `store_settings` (caso ainda não esteja ativo).
--   2. Permite que qualquer usuário (Clientes e Admins) possa ler as configurações (ex: raio de entrega).
--   3. Permite que apenas Administradores autenticados alterem as configurações.
-- =============================================================

-- 1. Habilitar o RLS
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- 2. Limpar políticas antigas se existirem
DROP POLICY IF EXISTS "Leitura pública de store_settings" ON public.store_settings;
DROP POLICY IF EXISTS "Admin controla store_settings" ON public.store_settings;

-- 3. Criar Política de Leitura Pública
CREATE POLICY "Leitura pública de store_settings" ON public.store_settings 
FOR SELECT 
USING (true);

-- 4. Criar Política de Escrita/Controle Total apenas para Admins
CREATE POLICY "Admin controla store_settings" ON public.store_settings 
FOR ALL 
USING ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT role FROM public.users WHERE id = auth.uid()) = 'admin');
