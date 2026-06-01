# Proposta: Fluxo de Pagamento PIX

## Problema
Item #7 da auditoria: pagamentos PIX são registrados como `confirmed` instantaneamente, sem chave PIX visível para o cliente, sem confirmação real de pagamento, sem transação rastreável. O cliente seleciona PIX, o pedido é criado como "confirmado", mas nenhum pagamento de fato ocorre — não há como o cliente copiar a chave PIX, não há polling de status, não há transação intermediária.

## Solução
Três camadas:

1. **Banco:** Adicionar status `'processing'` ao `order_status`, criar `payment_transactions`, adicionar `chave_pix` no `store_settings`, atualizar `finalizar_pedido` para criar PIX como `'processing'`
2. **Cliente:** Tela de confirmação mostra chave PIX com botão copiar, polling de status a cada 10s, botão "Já paguei" com confirmação
3. **Admin:** Campo de chave PIX editável nas configurações da loja

## Integrações
- Supabase (RPCs, store_settings)
- expo-clipboard (copiar chave PIX)
- Sem gateway de pagamento externo (chave PIX + confirmação manual/simulada)
