# Design: RLS + Autorização

## Tabelas sem RLS

### `competitors`
| Operação | Policy |
|----------|--------|
| SELECT | Público (qualquer um pode ver no mapa) |
| INSERT | Apenas admin |
| UPDATE | Apenas admin |
| DELETE | Apenas admin |

### `order_messages`
| Operação | Policy |
|----------|--------|
| SELECT | Cliente vê próprias mensagens; Admin vê todas |
| INSERT | Cliente pode inserir no próprio pedido; Admin em qualquer |

## RPCs com verificação de admin
- `finalizar_pedido` já é `SECURITY DEFINER` — correto (precisa escrever em orders + produtos)
- `cleanup_idempotency_keys` — `SECURITY DEFINER` com verificação de admin
- `cleanup_request_logs` — `SECURITY DEFINER` com verificação de admin
