-- =============================================================
-- Migration: Notificação Pós-Compra (Item #12)
-- Descrição: Tabela de fila de notificações, trigger em orders,
--   e RPC update_order_status com validação de transição.
-- =============================================================

-- =============================================================
-- 1. Tabela notification_queue
-- =============================================================
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('push', 'email')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  sent_at TIMESTAMPTZ
);

-- =============================================================
-- 2. Trigger: notificar quando status do pedido mudar
-- =============================================================
CREATE OR REPLACE FUNCTION public.handle_order_status_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_title TEXT;
  v_body TEXT;
  v_user_id UUID;
BEGIN
  SELECT user_id INTO v_user_id FROM public.orders WHERE id = NEW.id;

  IF NEW.status = 'confirmed' THEN
    v_title := 'Pedido Confirmado';
    v_body := 'Seu pedido foi confirmado e está sendo processado.';
  ELSIF NEW.status = 'preparing' THEN
    v_title := 'Preparando Pedido';
    v_body := 'Seu pedido está sendo preparado.';
  ELSIF NEW.status = 'delivering' THEN
    v_title := 'Pedido a Caminho';
    v_body := 'Seu pedido saiu para entrega!';
  ELSIF NEW.status = 'completed' THEN
    v_title := 'Pedido Entregue';
    v_body := 'Seu pedido foi entregue. Bom apetite!';
  ELSIF NEW.status = 'cancelled' THEN
    v_title := 'Pedido Cancelado';
    v_body := 'Seu pedido foi cancelado.';
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.notification_queue (user_id, order_id, type, title, body, status)
  VALUES (v_user_id, NEW.id, 'push', v_title, v_body, 'pending');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notify_order_status ON public.orders;

CREATE TRIGGER trg_notify_order_status
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.handle_order_status_notification();

-- =============================================================
-- 3. RPC: update_order_status com validação de transição
-- =============================================================
CREATE OR REPLACE FUNCTION public.update_order_status(
  p_order_id UUID,
  p_new_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_current_status TEXT;
  v_user_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'NAO_AUTENTICADO');
  END IF;

  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'ACESSO_NEGADO');
  END IF;

  SELECT status, user_id INTO v_current_status, v_user_id
  FROM public.orders WHERE id = p_order_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pedido não encontrado');
  END IF;

  IF NOT (
    (v_current_status = 'processing' AND p_new_status = 'confirmed') OR
    (v_current_status = 'confirmed' AND p_new_status = 'preparing') OR
    (v_current_status = 'confirmed' AND p_new_status = 'cancelled') OR
    (v_current_status = 'preparing' AND p_new_status = 'delivering') OR
    (v_current_status = 'preparing' AND p_new_status = 'cancelled') OR
    (v_current_status = 'delivering' AND p_new_status = 'completed')
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transição inválida');
  END IF;

  UPDATE public.orders
  SET status = p_new_status,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_order_id;

  INSERT INTO public.audit_logs (user_id, action, resource, resource_id, details)
  VALUES (auth.uid(), 'update_order_status', 'orders', p_order_id::TEXT,
    jsonb_build_object('from', v_current_status, 'to', p_new_status)
  );

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'new_status', p_new_status,
    'user_id', v_user_id
  );
END;
$$;

-- =============================================================
-- 4. RPC: send_pending_notifications — Worker para processar fila
-- =============================================================
CREATE OR REPLACE FUNCTION public.send_pending_notifications()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_count INT := 0;
  v_item RECORD;
BEGIN
  FOR v_item IN
    SELECT nq.id, nq.user_id, nq.title, nq.body, u.push_token
    FROM public.notification_queue nq
    LEFT JOIN public.users u ON u.id = nq.user_id
    WHERE nq.status = 'pending'
      AND nq.type = 'push'
      AND u.push_token IS NOT NULL
    LIMIT 10
  LOOP
    UPDATE public.notification_queue
    SET status = 'sent', sent_at = timezone('utc'::text, now())
    WHERE id = v_item.id;
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;
