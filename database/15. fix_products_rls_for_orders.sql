-- =============================================================
-- Correção de RLS e Coluna updated_at para Produtos
-- Descrição: 
--   1. Permite leitura global de todos os produtos (active=true/false)
--      para permitir checagem de esgotados e histórico de pedidos.
--   2. Adiciona a coluna updated_at e respectivo trigger para
--      sabermos exatamente quando um produto esgotou (últimas 24h).
-- =============================================================

-- 1. Liberando SELECT para todos os produtos (essencial para histórico, carrinho e alertas)
DROP POLICY IF EXISTS "Produtos visíveis a todos." ON public.products;
CREATE POLICY "Produtos visíveis a todos." ON public.products FOR SELECT USING (true);

-- 2. Adicionando coluna updated_at se não existir
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- 3. Função do trigger de data de modificação
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Criando trigger na tabela products
DROP TRIGGER IF EXISTS set_products_timestamp ON public.products;
CREATE TRIGGER set_products_timestamp
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_timestamp();
