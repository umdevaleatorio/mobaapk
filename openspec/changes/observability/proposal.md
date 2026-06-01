# Proposta: Observabilidade

## Problema
Item #3 da auditoria: sistema não possui qualquer mecanismo de observabilidade. Sem health check, sem logging estruturado, sem alertas. Se o sistema cair de madrugada, ninguém descobre até o cliente reclamar.

## Solução
Três camadas de observabilidade:
1. **Banco:** Tabela `audit_logs` para logging estruturado de ações críticas
2. **App:** Error Boundary que captura crashes da árvore React + logger estruturado
3. **Health check:** RPC simples que verifica conectividade com banco

## Integrações
- Supabase (audit_logs + health check)
- Sem SDK externa necessária (abordagem leve sem Sentry por enquanto)
