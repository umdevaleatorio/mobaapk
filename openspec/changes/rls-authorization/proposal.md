# Proposta: RLS + Autorização

## Problema
Item #4 da auditoria: tabelas `competitors` e `order_messages` não possuem RLS, permitindo que qualquer usuário autenticado leia ou escreva dados sem restrição.

## Solução
1. Adicionar RLS nas tabelas `competitors` e `order_messages`
2. Garantir que todas as tabelas têm policies restritivas
3. Adicionar verificação de role admin nas RPCs sensíveis

## Integrações
- Supabase (RLS policies)
