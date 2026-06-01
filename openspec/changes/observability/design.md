# Design: Observabilidade

## Banco de Dados

### Tabela: `audit_logs`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID PK | Identificador único |
| user_id | UUID FK → users(id) | Usuário que realizou a ação |
| action | TEXT | Nome da ação (ex: 'order.created', 'order.cancelled') |
| metadata | JSONB | Dados contextuais da ação |
| level | TEXT | 'info', 'warn', 'error' |
| created_at | TIMESTAMPTZ | Momento da ação |

### RPC: `log_audit`
- Insere registro em `audit_logs`
- `SECURITY DEFINER` para permitir que qualquer usuário logue

### RPC: `health_check`
- Verifica conexão com banco (SELECT 1)
- Retorna `{ status: 'ok', timestamp: ..., db: 'connected' }`

## Frontend

### Componente: `ErrorBoundary`
- Wrapper que captura erros da árvore React
- Exibe UI amigável de fallback
- Loga o erro via `auditService.log()`

### Serviço: `auditService.ts`
- `log(action, metadata?, level?)` — registra no Supabase + console
- `healthCheck()` — chama RPC health_check

### Integração
- Ambos os `App.tsx` envolvem a árvore com ErrorBoundary
- Ações críticas chamam `auditService.log()` em vez de `console.log`
