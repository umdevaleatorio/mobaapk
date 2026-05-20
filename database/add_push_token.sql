-- Adiciona a coluna push_token na tabela de usuários para notificação remota
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS push_token VARCHAR(255);
