# Proposta: Proteção de Edição Concorrente

## Problema
Item #6 da auditoria: o RPC `finalizar_pedido` usa `SELECT ... FOR UPDATE` que segura locks por toda a transação. Sem `NOWAIT`, sem `lock_timeout`, sem retry. Três cenários críticos:
1. Dois clientes comprando o mesmo produto: o segundo espera indefinidamente
2. Cancelamento de pedido concorrente com compra: trigger `restore_stock_on_cancel` pode causar deadlock
3. Cliente sem feedback: se o lock falhar, o usuário vê um erro genérico sem opção de retry

## Solução
1. `FOR UPDATE NOWAIT` no `finalizar_pedido` + `SET LOCAL lock_timeout = '5s'`
2. Ordenar `product_id` no loop FOR UPDATE (locks consistentes)
3. Retry automático no cliente com backoff exponencial (3 tentativas)

## Integrações
- Banco de dados (SQL)
- `usePaymentScreen.ts` (retry lógico)
