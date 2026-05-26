-- =============================================================
-- Trigger: auto_deactivate_product
-- Descrição: Desativa automaticamente um produto quando o 
--            estoque chega a 0 e reativa quando o estoque
--            volta a ser positivo (reposição pelo admin).
-- =============================================================

-- Função do trigger
CREATE OR REPLACE FUNCTION public.handle_stock_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Desativar quando estoque chega a 0
  IF NEW.stock = 0 AND NEW.active = true THEN
    NEW.active := false;
  END IF;

  -- Reativar quando estoque volta a ser positivo (admin repôs estoque)
  IF NEW.stock > 0 AND OLD.stock = 0 AND NEW.active = false THEN
    NEW.active := true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar o trigger (BEFORE UPDATE para poder modificar NEW diretamente)
-- Drop se já existir para permitir re-execução
DROP TRIGGER IF EXISTS auto_deactivate_product ON public.products;

CREATE TRIGGER auto_deactivate_product
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_stock_change();

-- =============================================================
-- Verificação rápida (pode rodar no SQL Editor do Supabase):
--
-- 1. Teste desativação:
--    UPDATE products SET stock = 0 WHERE id = '<algum_id>';
--    SELECT id, name, stock, active FROM products WHERE id = '<algum_id>';
--    -- Esperado: active = false
--
-- 2. Teste reativação:
--    UPDATE products SET stock = 5 WHERE id = '<algum_id>';
--    SELECT id, name, stock, active FROM products WHERE id = '<algum_id>';
--    -- Esperado: active = true
-- =============================================================
