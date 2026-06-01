# Proposta: Idempotência no Pagamento

## Problema
Item #1 da auditoria: o RPC `finalizar_pedido` não possui chave de idempotência. Se o usuário clicar duas vezes (ou houver retry de rede), o pedido é criado duas vezes, o estoque é decrementado duas vezes, e o usuário é cobrado duas vezes.

## Solução
Adicionar chave de idempotência ao fluxo de finalização de pedido:

1. **Tabela `idempotency_keys`** — armazena o resultado de cada requisição já processada
2. **Modificar RPC `finalizar_pedido`** — aceitar `p_idempotency_key UUID`, verificar duplicidade antes de processar
3. **Cliente** — gerar UUID v4 antes da chamada e enviar como parâmetro

## Não escopo
- Idempotência em outros RPCs (apenas `finalizar_pedido` por enquanto)
- Gateway de pagamento real (será item #7)

## Integrações
- Supabase (nova tabela + modificação da RPC existente)
- Expo Crypto (UUID v4) — já disponível via `react-native-get-random-values`
