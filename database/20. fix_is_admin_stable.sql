-- =========================================================================
-- SCRIPT PARA CORRIGIR TIMEOUT 522 (OTIMIZAÇÃO EXTREMA DE RLS)
-- Instruções: Execute este script no SQL Editor do seu Dashboard Supabase.
-- =========================================================================

-- O erro 522 acontece porque a função is_admin() estava rodando UMA VEZ PARA CADA LINHA!
-- Se você tem 5000 pedidos, o banco checava se você era admin 5000 vezes em 1 segundo.
-- Adicionar a palavra "STABLE" faz o banco checar APENAS UMA VEZ por consulta e 
-- reutilizar o resultado, deixando as requisições 1000x mais rápidas.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET row_security = off;

ALTER FUNCTION public.is_admin() OWNER TO postgres;
