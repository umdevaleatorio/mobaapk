-- =========================================================================
-- SCRIPT PARA CORRIGIR DEFINITIVAMENTE O STATEMENT TIMEOUT (RLS RECURSION)
-- Instruções: Execute este script no SQL Editor do seu Dashboard Supabase.
-- =========================================================================

-- 1. Cria a função is_admin() configurada com SECURITY DEFINER e row_security = off.
-- O parâmetro "SET row_security = off" garante que as consultas internas da função
-- NÃO disparem as políticas de segurança RLS da tabela, eliminando o loop infinito!
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM public.users WHERE id = auth.uid()) = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET row_security = off;

-- 2. Define o proprietário da função como 'postgres' (Superusuário)
-- Isso garante que a função possua privilégios para ignorar o RLS e rodar com performance máxima.
ALTER FUNCTION public.is_admin() OWNER TO postgres;
