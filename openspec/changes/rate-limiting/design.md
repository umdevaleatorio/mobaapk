# Design: Rate Limiting

## Arquitetura

```
┌──────────────┐     check_rate_limit()     ┌──────────────────┐
│  App Cliente  │ ─────────────────────────▶ │  Supabase (RPC)  │
│  (React Native)│                           │  PostgreSQL      │
│              │ ◀───────────────────────── │                  │
│              │   { allowed, remaining }    │  request_logs    │
└──────────────┘                             └──────────────────┘
```

## Banco de Dados

### Tabela: `request_logs`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID PK | Identificador único |
| user_id | UUID FK → users(id) | Usuário que fez a requisição |
| endpoint | TEXT | Nome do endpoint/RPC chamado |
| created_at | TIMESTAMPTZ | Momento da requisição |

### Índice
- `(user_id, endpoint, created_at DESC)` — busca rápida por usuário + endpoint

### RPC: `check_rate_limit`
- Parâmetros: `p_user_id`, `p_endpoint`, `p_max_requests`, `p_window_seconds`
- Retorno: `{ allowed: boolean, remaining: number, limit: number, window_seconds: number }`
- Lógica: conta requisições na janela → se >= limite, rejeita → senão, insere e permite

### Cleanup
- RPC `cleanup_request_logs()` para remover registros mais antigos que 24h
- Pode ser chamada por um cron externo ou manualmente

## Cliente (React Native)

### Serviço: `services/rateLimitService.ts`
- Função `checkRateLimit(userId, endpoint, maxRequests?, windowSeconds?)`
- Chama o RPC `check_rate_limit`
- Fail-open: se o RPC falhar, permite a requisição (não bloquear o usuário por erro nosso)

### Integração
- `usePaymentScreen.handleCreateOrder()`: verificar rate limit antes de chamar `finalizar_pedido`
- Limite sugerido: 5 pedidos por minuto por usuário
