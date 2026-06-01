# Proposta: Docker (Item #11)

## Problema
Nenhum ambiente containerizado para desenvolvimento/testes locais. Migrações são aplicadas diretamente no Supabase remoto.

## Solução
1. `docker-compose.yml` com stack Supabase local
2. PgBouncer para testar connection pooling
3. Scripts para aplicar migrations localmente

## Integrações
- Banco de dados PostgreSQL local
- Edge Functions (via Supabase Studio)
