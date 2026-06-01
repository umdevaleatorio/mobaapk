# Proposta: Índices de Performance

## Problema
Itens #8 e #14 da auditoria: banco de dados sem índices estratégicos nas tabelas de negócio. As queries mais frequentes (listagem de pedidos por usuário, listagem de pedidos por status no admin, catálogo de produtos ativos) fazem scans sequenciais. Em 500M registros o tempo de resposta inviabiliza o sistema.

## Solução
Criar 6 índices estratégicos nas tabelas mais consultadas:

1. **orders:** `(user_id, created_at DESC)` — listagem de pedidos do cliente
2. **orders:** `(status, created_at DESC)` — listagem de pedidos do admin
3. **products:** `(active, created_at DESC)` — catálogo do cliente
4. **products:** `(active, name)` — PDV do admin
5. **order_items:** `(order_id)` — trigger de restauração de estoque
6. **order_messages:** `(order_id)` — RLS e consultas de mensagens

## Integrações
- Somente banco de dados (SQL puro, sem alteração de código TypeScript)
