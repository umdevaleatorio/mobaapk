-- Adiciona campo para indicar que o cliente confirmou seu endereço
-- e desbloqueou a função do ponto azul no mapa
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS location_confirmed BOOLEAN DEFAULT false;
