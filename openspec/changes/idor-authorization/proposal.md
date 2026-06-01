# Proposta: Proteção IDOR em RPCs

## Problema
Item #4 da auditoria: 4 RPCs `SECURITY DEFINER` aceitam `user_id` / `order_id` do cliente sem verificar se o usuário autenticado é o dono do recurso. Um atacante pode:
- Criar pedidos em nome de outro usuário (`finalizar_pedido`)
- Confirmar pagamento PIX de qualquer pedido (`confirm_pix_payment`)
- Espiar status de pagamento de qualquer pedido (`check_pix_status`)
- Consumir cota de rate limit de outro usuário (`check_rate_limit`)

## Solução
Adicionar `auth.uid()` checks no início de cada RPC SECURITY DEFINER:
- `finalizar_pedido`: verificar `auth.uid() = p_user_id`
- `confirm_pix_payment`: verificar ownership do pedido OU `is_admin()`
- `check_pix_status`: verificar ownership do pedido OU `is_admin()`
- `check_rate_limit`: usar `auth.uid()` internamente em vez de parâmetro

## Integrações
- Somente banco de dados (SQL) + 1 arquivo TypeScript (rateLimitService)
