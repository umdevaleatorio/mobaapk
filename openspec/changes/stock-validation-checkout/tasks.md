# Tarefas: Validação Atômica de Estoque no Checkout

## 1. Backend — Banco de Dados (Supabase SQL)

### 1.1 Criar script SQL da função RPC `finalizar_pedido`
- [x] **Implementação:** Criar arquivo `database/rpc_finalizar_pedido.sql` com a função `finalizar_pedido` conforme especificado no design

### 1.2 Criar script SQL do trigger `auto_deactivate_product`
- [x] **Implementação:** Criar arquivo `database/trigger_auto_deactivate.sql` com a função `handle_stock_change` e o trigger `auto_deactivate_product`

## 2. Frontend — App Cliente (React Native)

### 2.1 Refatorar `handleCreateOrder` no `PaymentScreen.tsx`
- [x] **Implementação:** Substituir os `INSERT` diretos em `orders` e `order_items` por chamada a `supabase.rpc('finalizar_pedido', {...})`

### 2.2 Tratamento de erro de estoque insuficiente
- [x] **Implementação:** Adicionar parsing da mensagem de erro `ESTOQUE_INSUFICIENTE`, exibir `Alert` detalhando quais produtos e quantidades disponíveis, e remover automaticamente os itens sem estoque do carrinho local (SQLite)

### 2.3 Tratamento de erros genéricos e falha de rede
- [x] **Implementação:** Garantir que o `try/catch` no `handleCreateOrder` trata erros de rede e produto não encontrado com mensagens amigáveis

## 3. Documentação e Deploy

### 3.1 Guia de aplicação do SQL no Supabase
- [ ] Executar `database/trigger_auto_deactivate.sql` no SQL Editor do Supabase Dashboard
- [ ] Executar `database/rpc_finalizar_pedido.sql` no SQL Editor do Supabase Dashboard
- [ ] **Ordem:** trigger primeiro, depois a RPC

### 3.2 Validação manual pós-deploy
- [ ] Testar no app: adicionar produto ao carrinho e finalizar pedido — verificar que estoque decrementa
- [ ] Testar no app: tentar comprar produto com estoque = 0 — verificar que o Alert de estoque insuficiente aparece
- [ ] Verificar no Supabase Dashboard: quando estoque chega a 0, produto deve ter `active = false`
- [ ] Verificar no app admin: produto desativado automaticamente aparece com opacidade reduzida
- [ ] Verificar no app cliente: produto desativado some do catálogo
