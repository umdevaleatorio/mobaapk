# Design: Email + Notificação Pós-Compra

## Migration: `32. notification_queue.sql`
- `notification_queue` (id, user_id, order_id, type, title, body, status, created_at, sent_at)
- Trigger `trg_notify_order_status` no `orders` AFTER UPDATE OF status
- Insere na fila quando status muda

## notificationService.ts
- `sendPushNotification(token, title, body, data?)` → POST https://exp.host/--/api/v2/push/send
- `sendOrderStatusNotification(orderId, userId, status)` → busca push_token do user, envia

## App.tsx (cliente + admin)
- `addNotificationReceivedListener` → exibe toast/alert
- `addNotificationResponseReceivedListener` → navega para tela do pedido

## AdminOrderDetail
- Botões condicionais conforme status atual:
  - processing → "Confirmar Pedido"
  - confirmed → "Iniciar Preparação"
  - preparing → "Sair para Entrega"
  - delivering → "Concluir"
- Cada ação: `supabase.rpc('update_order_status', { p_order_id, p_new_status })`

## RPC update_order_status
- Valida transição válida
- Atualiza status
- Trigger dispara notificação

## Integração pós-compra
- `usePaymentScreen`: após `finalizar_pedido` → `sendOrderStatusNotification`
- `PaymentConfirmScreen`: após `confirm_pix_payment` → `sendOrderStatusNotification`
