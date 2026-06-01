# Design: Idempotência no Pagamento

## Arquitetura

```
┌──────────────┐   finalizar_pedido(          ┌──────────────────┐
│  App Cliente  │     p_idempotency_key,       │  Supabase (RPC)  │
│  (React Native)│    p_user_id, ...)          │  PostgreSQL      │
│              │ ────────────────────────────▶ │                  │
│  Gera UUID v4 │                             │  Verifica se KEY │
│  antes da     │                             │  já existe       │
│  chamada     │                              │  ┌─ Sim → retorna│
│              │                              │  │        cache  │
│              │                              │  └─ Não → cria   │
│              │                              │         pedido + │
│              │                              │         armazena │
│              │                              │         resultado │
└──────────────┘                             └──────────────────┘
```

## Banco de Dados

### Tabela: `idempotency_keys`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID PK | A própria chave de idempotência |
| response | JSONB | Resultado completo da RPC (cache) |
| created_at | TIMESTAMPTZ | Para TTL (cleanup após 24h) |

### RPC: `finalizar_pedido` (modificada)
- Novo parâmetro: `p_idempotency_key UUID DEFAULT NULL`
- Se chave fornecida E existente → retorna `response` armazenado sem processar
- Se chave fornecida E nova → processa, armazena resultado em `idempotency_keys`, retorna
- Se chave NÃO fornecida → comportamento atual (sem proteção, para compatibilidade)

### Cleanup
- RPC `cleanup_idempotency_keys(24h)` para remover chaves expiradas

## Cliente (React Native)

### `usePaymentScreen.ts`
- Importar `uuid` ou usar `crypto.randomUUID()`
- Gerar UUID v4 antes de chamar `finalizar_pedido`
- Passar como `p_idempotency_key`
- Desabilitar botão (já existe via `setLoading(true)`) + mostrar loading
