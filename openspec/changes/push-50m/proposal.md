# Proposta: Push 50M (Item #16)

## Problema
Notificações push enviadas diretamente do dispositivo. Sem fila, sem rate limit, sem retry, sem edge function.

## Solução
1. Edge Function `send-push` no Supabase
2. Worker processa `notification_queue` com rate limiting
3. Dead letter queue para tokens expirados

## Integrações
- Supabase Edge Functions
- Database (notification_queue)
- Expo Push API
