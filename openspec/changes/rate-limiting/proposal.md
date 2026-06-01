# Proposta: Rate Limiting

## Problema
Os itens #5 e #17 da auditoria técnica apontam que o sistema não possui qualquer proteção contra abuso de requisições. Um atacante (ou bug no cliente) pode chamar RPCs como `finalizar_pedido` centenas de vezes por segundo, resultando em:
- Pedidos duplicados (mesmo sem idempotência implementada ainda)
- Decremento indevido de estoque
- Degradação do serviço para usuários legítimos

## Solução
Implementar rate limiting em duas camadas:

1. **Banco de dados (camada principal):** Tabela `request_logs` + RPC `check_rate_limit` que conta requisições por usuário/endpoint em uma janela de tempo e rejeita quando o limite é excedido.
2. **Cliente (camada auxiliar):** Serviço que consulta o RPC antes de operações sensíveis e alerta o usuário.

## Não escopo
- API Gateway rate limiting (não há servidor próprio)
- Rate limiting por IP (irrelevante em app mobile com Supabase)
- CAPTCHA (seria uma melhoria futura)

## Integrações
- Supabase (nova tabela + RPC no PostgreSQL)
- Nenhuma SDK externa necessária
