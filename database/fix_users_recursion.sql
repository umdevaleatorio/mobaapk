-- SCRIPT PARA DEVOLVER O PODER DE LER NOMES DOS CLIENTES AO ADMIN SEM RECURSÃO

-- 1. Criar uma Função Segura (Security Definer) que checa se quem está logado é Admin
-- Como ela roda nos bastidores com super-poderes, ela não engatilha o loop infinito (RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Limpa qualquer regra antiga de Admins na tabela Users
DROP POLICY IF EXISTS "Admin can view all users" ON public.users;

-- 3. Aplica a nova regra inteligente usando nossa função segura
CREATE POLICY "Admin can view all users" 
ON public.users FOR SELECT 
USING (public.is_admin());
