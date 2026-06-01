# Proposta: Soft Delete + Exportar Dados (LGPD)

## Problema
Item #18 da auditoria: sem `deleted_at` em nenhuma tabela, sem funcionalidade de exclusão de conta, sem exportação de dados. LGPD Art. 18 exige que o usuário possa solicitar exclusão e portabilidade.

## Solução
1. Coluna `deleted_at` + `scheduled_delete_at` em `public.users` (30 dias de carência)
2. RPCs: `request_account_deletion`, `cancel_account_deletion`, `export_user_data`, `hard_delete_expired_accounts`
3. Botões no SettingsScreen: "Baixar meus dados", "Excluir conta", "Reativar conta"
4. Admin: visualizar contas marcadas para exclusão

## Integrações
- Banco de dados (SQL)
- SettingsScreen (cliente)
- Admin (visualização de usuários deletados)
