# Proposta: Email + Notificação Pós-Compra

## Problema
Item #12 da auditoria: push notification existe só como código local (não envia remoto), email é inexistente, admin não tem botões de mudança de status, App.tsx não tem listeners.

## Solução
1. `notificationService.ts` — adicionar `sendPushNotification` via Expo Push API
2. `notification_queue` — tabela + trigger para enfileirar notificações
3. AdminOrderDetail — botões para alterar status do pedido
4. App.tsx — listeners para notificação recebida
5. Integrar push no fluxo de confirmação

## Integrações
- Expo Push API (remoto)
- Admin (mudança de status)
- Database (trigger + fila)
