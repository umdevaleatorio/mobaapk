# Estratégia de Escala — AgroPet

## Stack Atual
- **Mobile:** React Native (Expo SDK 54) — stateless por natureza
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Cache offline:** SQLite local no dispositivo
- **Autenticação:** Supabase Auth com JWT

## Recomendações

### Fase 1 — Plano Supabase Pro (atual)
- Pooler automático (PgBouncer) incluso
- 500 conexões simultâneas
- Backup point-in-time
- Branching de banco

### Fase 2 — Connection Pooling
```sql
-- Configurar PgBouncer no Supabase:
-- Dashboard → Database → Connection pooling → Habilitar
-- Connection string: postgres://{user}:{password}@aws-0-{region}.pooler.supabase.com:6543/postgres
```

### Fase 3 — Read Replicas
- Habilitar replicas de leitura no Supabase Pro
- Usar `?options=project=ref` para distribuir leituras

### Fase 4 — Cache Distribuído
- Redis via Upstash ou Redis Cloud
- Cachear catálogo de produtos (TTL: 5 min)
- Cachear geolocalização de entregadores

### Fase 5 — Edge Functions
- Migrar notificações para Edge Functions
- Processamento de fila serverless
- Webhooks de pagamento

## Monitoramento
- Supabase Logs (Dashboard)
- Sentry para erros de aplicação
- healthCheck() no auditService
