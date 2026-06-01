# Proposta: Escala (Item #9)

## Problema
Nenhuma estratégia de escalabilidade definida. Queries sem `.limit()` podem causar OOM em produção. Sem Docker para ambientes replicáveis.

## Solução
1. Adicionar `.limit()` em 3 queries unbounded
2. Documentar estratégia de escala
3. Configuração PgBouncer/Supabase pooler

## Integrações
- Database (queries)
- Docs (estratégia)
