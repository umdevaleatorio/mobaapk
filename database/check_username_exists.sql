-- Função para verificar se um nome de usuário já existe, contornando a RLS de forma segura
CREATE OR REPLACE FUNCTION public.check_username_exists(username_to_check text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE LOWER(username) = LOWER(username_to_check)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
