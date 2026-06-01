# Tasks: Rate Limiting

## Database
- [x] 1. Criar migration `database/22. rate_limiter.sql` com tabela `request_logs` + índice + RPC `check_rate_limit` + RPC `cleanup_request_logs`
- [x] 2. Criar serviço `agropet-cliente/src/services/rateLimitService.ts` com função `checkRateLimit`
- [x] 3. Integrar rate check em `usePaymentScreen.handleCreateOrder()` antes de chamar `finalizar_pedido`
