# Design: Proteção de Edição Concorrente

## Migration: `30. concurrent_editing.sql`

### 1. `finalizar_pedido` — Lock mais seguro
- `SET LOCAL lock_timeout = '5000'` no início
- Ordenar `product_id` no loop FOR UPDATE
- `FOR UPDATE NOWAIT` + capturar exceção `SQLSTATE '55P03'` (lock_not_available)
- Retornar erro amigável: "RECURSO_OCUPADO"

### 2. `handle_order_cancellation` trigger — Proteção contra deadlock
- Adicionar `SAVEPOINT` antes do UPDATE products
- Capturar deadlock e logar no audit_logs

## Frontend

### `usePaymentScreen.ts`
- Se erro `RECURSO_OCUPADO`: retry automático com backoff (1s, 2s, 4s)
- Se erro `ESTOQUE_INSUFICIENTE`: não retry (já tratado)
- Máximo 3 tentativas
- Se esgotar tentativas: alerta "Sistema ocupado, tente novamente"
