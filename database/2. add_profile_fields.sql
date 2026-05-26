-- Adiciona a coluna username (única)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Adiciona campos de endereço mais detalhados se não existirem
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS rua TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS numero TEXT;

-- Atualiza a função de novo usuário para não quebrar caso o raw_user_meta_data não tenha nome
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), 
    new.email, 
    'client'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
