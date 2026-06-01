# Tasks: Idempotência no Pagamento

- [x] 1. Criar migration `database/23. idempotency_keys.sql` com tabela + modificação da RPC `finalizar_pedido` + cleanup
- [x] 2. Atualizar `usePaymentScreen.ts` para gerar UUID v4 e passar `p_idempotency_key`
