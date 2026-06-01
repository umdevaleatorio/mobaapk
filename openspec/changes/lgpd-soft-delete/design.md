# Design: Soft Delete + Exportar Dados (LGPD)

## Migration: `31. lgpd_soft_delete.sql`

### Schema changes
- `public.users`: ADD COLUMN `deleted_at TIMESTAMPTZ`, `scheduled_delete_at TIMESTAMPTZ`

### RPCs
1. **`request_account_deletion()`** — Seta `deleted_at = NOW()`, `scheduled_delete_at = NOW() + 30d`. Log no audit_logs.
2. **`cancel_account_deletion()`** — Limpa `deleted_at` e `scheduled_delete_at`. Só funciona se `scheduled_delete_at > NOW()`.
3. **`export_user_data()`** — Retorna JSONB com: profile, orders, order_items, order_messages, payment_transactions, audit_logs.
4. **`hard_delete_expired_accounts()`** — Admin: deleta contas onde `scheduled_delete_at < NOW()`.

### Políticas RLS
- SELECT em `users` filtra `deleted_at IS NULL` (usuários normais não veem deletados)
- Admins veem todos

## Frontend (Cliente)

### SettingsScreen
- Seção "Privacidade" dentro do darkCard:
  - **"Baixar meus dados"** → chama `export_user_data()`, salva arquivo JSON
  - **"Excluir conta"** → modal de confirmação, chama `request_account_deletion()`
  - **"Reativar conta"** → se `deleted_at` setado, chama `cancel_account_deletion()`

### useSettingsScreen
- `handleExportData()` — chama RPC, gera blob, compartilha
- `handleDeleteAccount()` — alerta de confirmação, chama RPC
- `handleReactivateAccount()` — chama RPC

## Admin
- Lista de usuários com `deleted_at IS NOT NULL`
- Botão "Excluir permanentemente" (hard delete)
