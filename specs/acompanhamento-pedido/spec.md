# Especificação — Acompanhamento de Pedido (Cliente) e Mensagens da Loja

## Fluxo de Status do Pedido

O pedido segue este fluxo obrigatório:

1. **Confirmado** — automático quando o pagamento é aprovado
2. **Em preparação** — automático logo após a confirmação (o pedido entra em preparo imediatamente)
3. **Saiu para entrega** — manual pelo admin (pode incluir mensagem opcional)
4. **Entregue** — manual pelo admin
5. **Cancelado** — manual pelo admin (mensagem com motivo obrigatório)

> Os estágios 1 e 2 são automáticos. Os estágios 3 e 4 são manuais (o dono da loja atualiza). O cancelamento pode ocorrer em qualquer momento.

---

## Tela de Acompanhar Pedido (Cliente)

### Cenário: Acessar acompanhamento de um pedido com entrega local
- **Dado** que o cliente possui um pedido com tipo de entrega "local" (dentro do raio de 17km)
- **Quando** ele tocar no pedido no Histórico de Pedidos ou em uma notificação
- **Então** o sistema **MUST** navegar para a tela de Acompanhar Pedido
- **E** **MUST** exibir a timeline completa do pedido e os detalhes dos produtos

### Cenário: Exibição da timeline do pedido
- **Dado** que o cliente está na tela de Acompanhar Pedido
- **Quando** a tela carregar
- **Então** o sistema **MUST** exibir a timeline visual com os estágios:
  1. ✅ **Pedido confirmado** — data/hora (automático)
  2. 📦 **Em preparação** — data/hora (automático, logo após confirmação)
  3. 🚚 **Saiu para entrega** — data/hora (quando o admin atualizar)
  4. ✅ **Entregue** — data/hora (quando o admin confirmar)
- **E** estágios já atingidos **MUST** aparecer com ícone ativo/preenchido e data/hora
- **E** estágios futuros **MUST** aparecer com ícone vazio/desabilitado (aguardando)
- **E** o estágio atual **MUST** estar destacado visualmente

### Cenário: Transição automática de confirmado para em preparação
- **Dado** que o pagamento do pedido foi confirmado/aprovado
- **Quando** o status mudar para "confirmed"
- **Então** o sistema **MUST** automaticamente atualizar o status para "preparing" (em preparação)
- **E** **MUST** registrar a data/hora de ambos os estágios
- **E** na timeline do cliente, os dois primeiros estágios **MUST** aparecer preenchidos

### Cenário: Exibição dos detalhes do pedido com produtos
- **Dado** que o cliente está na tela de Acompanhar Pedido
- **Quando** a tela carregar
- **Então** o sistema **MUST** exibir para cada produto do pedido:
  - Imagem do produto
  - Nome do produto
  - Quantidade comprada
  - Preço unitário pago
  - Subtotal do item (preço × quantidade)
- **E** **MUST** exibir o valor total do pedido
- **E** **MUST** exibir a forma de pagamento utilizada (PIX, Dinheiro, Cartão)
- **E** **MUST** exibir o endereço de entrega

### Cenário: Pedido com múltiplos produtos diferentes
- **Dado** que o pedido contém mais de um produto diferente
- **Quando** a tela carregar
- **Então** o sistema **MUST** listar todos os produtos, cada um com sua imagem, nome, quantidade e preço individual
- **E** **MUST** exibir o valor total somando todos os itens

### Cenário: Mensagem da loja na timeline (saiu para entrega)
- **Dado** que o admin enviou uma mensagem ao marcar "Saiu para entrega"
- **Quando** o cliente visualizar a timeline
- **Então** o sistema **MUST** exibir a mensagem vinculada ao estágio "Saiu para entrega" no formato:
  - **"Mensagem da loja"** (título)
  - **Motivo:** [motivo informado pelo admin]
  - [corpo da mensagem]
  - Data/hora da mensagem

### Cenário: Mensagem de cancelamento na timeline
- **Dado** que o admin cancelou o pedido com mensagem e motivo
- **Quando** o cliente visualizar o pedido
- **Então** o sistema **MUST** exibir o status "Cancelado" em destaque (vermelho)
- **E** **MUST** exibir a mensagem da loja com o motivo do cancelamento no formato:
  - **"Mensagem da loja"**
  - **Motivo:** [motivo obrigatório, ex: "Pagamento cancelado", "Desistência do cliente"]
  - [corpo da mensagem]

### Cenário: Notificação de mudança de status
- **Dado** que o status do pedido foi atualizado
- **Quando** a atualização for salva
- **Então** o sistema **SHOULD** enviar uma notificação para o cliente informando o novo status
- **E** se houver mensagem do admin, **SHOULD** incluir o motivo na notificação

### Cenário: Pedido por retirada na loja (fora do raio ou opção escolhida)
- **Dado** que o pedido foi feito com tipo de entrega "pickup" (retirar na loja)
- **Quando** o cliente acessar os detalhes do pedido
- **Então** o sistema **MUST** exibir os detalhes do pedido (produtos com imagens, preços, quantidades)
- **E** **MUST** exibir o status atual (confirmado / em preparação / pronto para retirada)
- **E** **MUST NOT** exibir timeline de entrega
- **E** **SHOULD** exibir mensagem "Retirada na loja — entre em contato para combinar"

### Cenário: Pedido concluído (entregue)
- **Dado** que o pedido possui status "completed"
- **Quando** o cliente acessar o acompanhamento
- **Então** o sistema **MUST** exibir a timeline completa com todos os estágios preenchidos
- **E** **MUST** exibir os detalhes completos (produtos com imagens, preços, quantidades, valor total)

### Cenário: Acompanhamento offline
- **Dado** que o cliente está sem conexão
- **Quando** ele acessar o acompanhamento de um pedido
- **Então** o sistema **SHOULD** exibir o último status conhecido em cache local (SQLite)
- **E** **MUST** informar que os dados podem não estar atualizados

---

## Sistema de Mensagens — Lado do Admin

### Cenário: Admin marca pedido como "Saiu para entrega" com mensagem opcional
- **Dado** que o admin está na tela de pedidos e selecionou um pedido com status "preparing"
- **Quando** ele alterar o status para "delivering" (saiu para entrega)
- **Então** o sistema **MUST** exibir campos **opcionais**:
  - **Motivo:** (campo de texto curto, ex: "Atraso na entrega", "Entrega antecipada")
  - **Mensagem:** (campo de texto livre para o admin digitar mensagem ao cliente)
- **E** o admin **MAY** preencher ou deixar em branco
- **E** ao confirmar, **MUST** salvar o status no Supabase
- **E** se preenchidos, **MUST** salvar a mensagem vinculada ao pedido

### Cenário: Admin cancela pedido com mensagem obrigatória
- **Dado** que o admin está cancelando um pedido
- **Quando** ele alterar o status para "cancelled"
- **Então** o sistema **MUST** exibir os campos de mensagem como **obrigatórios**:
  - **Motivo:** (obrigatório — ex: "Pagamento cancelado", "Desistência do cliente", "Produto indisponível")
  - **Mensagem:** (obrigatório — explicação ao cliente)
- **E** **MUST NOT** permitir cancelar sem preencher motivo e mensagem

### Cenário: Admin marca pedido como entregue
- **Dado** que o pedido está com status "delivering"
- **Quando** o admin alterar para "completed" (entregue)
- **Então** o sistema **MUST** registrar a data/hora da conclusão
- **E** **MUST NOT** exibir campos de mensagem (entrega concluída normalmente)

### Cenário: Visualizar histórico de mensagens de um pedido (admin)
- **Dado** que o admin está vendo os detalhes de um pedido
- **Quando** a tela carregar
- **Então** o sistema **MUST** exibir todas as mensagens enviadas naquele pedido em ordem cronológica
- **E** **MUST** exibir o motivo, corpo da mensagem e data/hora de cada uma
