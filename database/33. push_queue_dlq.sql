-- Migração #33: Dead Letter Queue + edge function suporte para notification_queue

-- Adiciona coluna sent_at para rastreamento
ALTER TABLE public.notification_queue ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ;

-- Adiciona coluna failed_at para DLQ
ALTER TABLE public.notification_queue ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ;

-- Adiciona coluna retry_count
ALTER TABLE public.notification_queue ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- View para dead letter queue (notificações que falharam permanentemente)
CREATE OR REPLACE VIEW public.dlq_notifications AS
SELECT *
FROM public.notification_queue
WHERE status = 'failed'
  AND retry_count >= 3
ORDER BY failed_at DESC;

-- Função para reprocessar itens da DLQ
CREATE OR REPLACE FUNCTION public.reprocess_dlq()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.notification_queue
  SET status = 'pending', failed_at = NULL, retry_count = 0
  WHERE status = 'failed' AND retry_count >= 3;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
