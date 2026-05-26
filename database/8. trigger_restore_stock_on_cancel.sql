-- =============================================================
-- Trigger: restore_stock_on_cancel
-- Descrição: Devolve os itens de um pedido de volta ao estoque
--            quando o status do pedido é alterado para 'cancelled'.
-- =============================================================

CREATE OR REPLACE FUNCTION public.handle_order_cancellation()
RETURNS TRIGGER AS $$
DECLARE
  v_item RECORD;
BEGIN
  -- Verificar se o status mudou para 'cancelled'
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    -- Loop por todos os itens do pedido
    FOR v_item IN 
      SELECT product_id, quantity 
      FROM public.order_items 
      WHERE order_id = NEW.id
    LOOP
      -- Devolver a quantidade ao estoque do produto
      UPDATE public.products
      SET stock = stock + v_item.quantity
      WHERE id = v_item.product_id;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar o trigger na tabela orders (AFTER UPDATE para garantir que a atualização ocorreu)
DROP TRIGGER IF EXISTS restore_stock_on_cancel ON public.orders;

CREATE TRIGGER restore_stock_on_cancel
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_cancellation();
