-- =============================================================
-- Adiciona a coluna delivery_active na tabela store_settings
-- =============================================================

ALTER TABLE public.store_settings 
ADD COLUMN IF NOT EXISTS delivery_active BOOLEAN DEFAULT true NOT NULL;
