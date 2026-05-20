# Proposta: Validação Atômica de Estoque no Checkout

## Resumo

Atualmente, quando um cliente finaliza um pedido no AgroPet Lambari, o sistema **não valida o estoque disponível** e **não decrementa a quantidade** após a compra. Isso significa que múltiplos clientes podem comprar o mesmo produto simultaneamente, gerando vendas além do estoque real.

Esta mudança implementa:
1. **Validação e decremento atômico de estoque** no momento do checkout via função PostgreSQL (RPC)
2. **Desativação automática do produto** quando o estoque chega a zero (trigger no banco)
3. **Tratamento de erro amigável** no app cliente quando o estoque é insuficiente

## Problema

O professor levantou o seguinte cenário:

> "O que será feito no seu aplicativo em caso de um produto ter 2-3 de estoque e 5 clientes querem comprar esse produto?"

### Situação atual

- `PaymentScreen.tsx` faz `INSERT` direto em `orders` e `order_items` sem checar estoque
- O campo `stock` na tabela `products` nunca é decrementado
- O campo `active` nunca é alterado automaticamente baseado no estoque
- A desativação de produto só ocorre manualmente pelo admin via toggle

### Consequência

5 clientes podem comprar 1 unidade cada de um produto com estoque = 2, resultando em -3 de estoque (impossível na vida real).

## Solução Proposta

**Estratégia: First-Come, First-Served com validação atômica**

Os primeiros clientes que finalizarem o checkout esgotam o estoque. Os demais recebem uma mensagem clara de que o estoque é insuficiente.

### Componentes

1. **Função RPC `finalizar_pedido`** no Supabase (PostgreSQL)
   - Recebe: `user_id`, `items[]`, `payment_method`, `delivery_type`
   - Usa `SELECT ... FOR UPDATE` para travar as linhas dos produtos durante a transação
   - Valida que todos os itens têm estoque suficiente
   - Decrementa o estoque atomicamente
   - Cria o pedido e os itens do pedido
   - Retorna sucesso ou erro específico por produto

2. **Trigger `auto_deactivate_product`** no PostgreSQL
   - Dispara após `UPDATE` na tabela `products`
   - Quando `stock` chega a 0, seta `active = false` automaticamente
   - Quando o admin repõe estoque (stock > 0), reativa (`active = true`)

3. **Atualização do `PaymentScreen.tsx`**
   - Substitui o `INSERT` direto por chamada `supabase.rpc('finalizar_pedido', ...)`
   - Trata erro de estoque insuficiente com `Alert` amigável
   - Informa quais produtos não têm estoque suficiente

## Integrações com Supabase

| Recurso | Uso |
|---------|-----|
| **Database Functions (RPC)** | Função `finalizar_pedido` para validação atômica |
| **Database Triggers** | Trigger `auto_deactivate_product` para desativar produto |
| **RLS (já existente)** | Política `active = true` já filtra produtos inativos pro cliente |

## Permissões de Hardware

Nenhuma permissão adicional de hardware é necessária para esta mudança.

## Escopo

### Incluído
- Função RPC de checkout com validação de estoque
- Trigger de auto-desativação/reativação de produto
- Tratamento de erro no app cliente
- Script SQL para aplicar no Supabase
- Testes unitários

### Não incluído (fora de escopo)
- Reserva temporária de estoque (timer no carrinho)
- Notificação de "produto quase esgotando"
- Fila de espera para produtos esgotados
- Alterações na interface visual (o visual de `opacity: 0.5` para produtos inativos no admin já existe)

## Impacto

- **Banco de dados**: 1 função RPC + 1 trigger (aditivos, sem breaking changes)
- **App cliente**: Alteração apenas no `handleCreateOrder` do `PaymentScreen.tsx`
- **App admin**: Nenhuma alteração (já exibe produtos inativos com opacidade reduzida)
- **RLS**: Nenhuma alteração (política de `active = true` já existe)
