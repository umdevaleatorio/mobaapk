# Especificação — Painel Administrativo

## Tela de Login do Admin

> Veja a especificação completa de login do admin em `specs/autenticacao/spec.md`.

---

## Menu Inicial do Admin (Drawer)

### Cenário: Acesso autorizado ao painel admin
- **Dado** que o usuário possui role "admin"
- **E** completou a autenticação biométrica com sucesso
- **Quando** o sistema carregar o painel
- **Então** o sistema **MUST** exibir o menu lateral (Drawer) com as opções: Pedidos, Painel de Vendas, Histórico de Vendas/Caixa, Gerenciar Produtos, Mapa, Perfil, Configurações

### Cenário: Cliente tenta acessar painel admin
- **Dado** que o usuário possui role "client"
- **Quando** ele tentar acessar rotas do painel admin
- **Então** o sistema **MUST** bloquear o acesso
- **E** **MUST** redirecionar para a tela principal do cliente

---

## Tela de Pedidos (Admin)

### Cenário: Listar pedidos
- **Dado** que o admin está na tela de pedidos
- **Quando** a tela carregar
- **Então** o sistema **MUST** listar os pedidos ordenados por data (mais recente primeiro)
- **E** **MUST** exibir: número do pedido, nome do cliente, valor total, forma de pagamento, status atual e data

### Cenário: Filtrar pedidos por status
- **Dado** que o admin está na tela de pedidos
- **Quando** ele selecionar um filtro de status (Em Preparação, Saiu para Entrega, Concluído, Cancelado)
- **Então** o sistema **MUST** exibir somente os pedidos com o status selecionado

### Cenário: Fluxo de status do pedido
- **Dado** que um pedido é criado com pagamento confirmado
- **Quando** o pagamento for aprovado
- **Então** o sistema **MUST** automaticamente definir o status para "confirmed" e em seguida "preparing" (em preparação)
- **E** a partir daí, o admin atualiza manualmente:
  - `preparing` → `delivering` (saiu para entrega) — manual, com mensagem **opcional**
  - `delivering` → `completed` (entregue) — manual
  - Qualquer status → `cancelled` (cancelado) — manual, com mensagem **obrigatória**
- **E** **MUST** registrar a data/hora de cada alteração de status
- **E** **MUST NOT** permitir retroceder o status

### Cenário: Marcar como "Saiu para entrega" com mensagem opcional
- **Dado** que o pedido está com status "preparing"
- **Quando** o admin alterar para "delivering"
- **Então** o sistema **MUST** exibir campos **opcionais** de Motivo e Mensagem ao cliente
- **E** se preenchidos, **MUST** salvar a mensagem vinculada ao pedido
- **E** **SHOULD** notificar o cliente sobre a mudança de status

> Veja spec completa do sistema de mensagens em `specs/acompanhamento-pedido/spec.md`

### Cenário: Cancelar pedido com mensagem obrigatória
- **Dado** que o admin está cancelando um pedido
- **Quando** ele alterar o status para "cancelled"
- **Então** o sistema **MUST** exigir preenchimento de **Motivo** e **Mensagem** (obrigatórios)
- **E** **MUST NOT** permitir cancelar sem preencher
- **E** **MUST** solicitar confirmação antes de efetivar
- **E** **SHOULD** restaurar o estoque dos produtos do pedido

### Cenário: Ver detalhes do pedido
- **Dado** que o admin está na lista de pedidos
- **Quando** ele tocar em um pedido
- **Então** o sistema **MUST** exibir os detalhes completos: itens com imagens, quantidades, subtotais, valor total, endereço de entrega, forma de pagamento, status e mensagens enviadas

---

## Painel de Vendas (Dashboard)

### Cenário: Visualizar dashboard de vendas
- **Dado** que o admin está no Painel de Vendas
- **Quando** a tela carregar
- **Então** o sistema **MUST** exibir as métricas em tempo real:
  - Total de vendas do dia (valor em R$)
  - Quantidade de pedidos do dia
  - Ticket médio
  - Total de pedidos pendentes
  - Total de produtos cadastrados (ativos)
- **E** **SHOULD** exibir gráficos visuais (barras ou linhas) com resumo da semana

### Cenário: Dashboard sem conexão
- **Dado** que o admin está sem conexão com a internet
- **Quando** ele acessar o dashboard
- **Então** o sistema **SHOULD** exibir as últimas métricas em cache local
- **E** **MUST** exibir indicador de modo offline com data/hora da última atualização

---

## Histórico de Vendas / Caixa (Admin)

### Cenário: Visualizar vendas do dia
- **Dado** que o admin está na tela de Histórico de Vendas/Caixa
- **Quando** ele selecionar o filtro "Dia"
- **Então** o sistema **MUST** exibir a lista de todas as vendas concluídas no dia atual
- **E** para cada venda, **MUST** exibir: número do pedido, nome do cliente, produtos vendidos, forma de pagamento utilizada e valor total
- **E** **MUST** exibir o total acumulado do dia no topo ou rodapé

### Cenário: Visualizar vendas da semana
- **Dado** que o admin está na tela de Histórico de Vendas/Caixa
- **Quando** ele selecionar o filtro "Semana"
- **Então** o sistema **MUST** exibir a lista de todas as vendas concluídas na semana atual
- **E** para cada venda, **MUST** exibir: produtos vendidos, forma de pagamento e valor
- **E** **MUST** exibir o total acumulado da semana

### Cenário: Visualizar vendas do mês
- **Dado** que o admin está na tela de Histórico de Vendas/Caixa
- **Quando** ele selecionar o filtro "Mês"
- **Então** o sistema **MUST** exibir a lista de todas as vendas concluídas no mês atual
- **E** para cada venda, **MUST** exibir: produtos vendidos, forma de pagamento e valor
- **E** **MUST** exibir o total acumulado do mês

### Cenário: Detalhar venda no histórico
- **Dado** que o admin está na lista do histórico
- **Quando** ele tocar em uma venda
- **Então** o sistema **MUST** exibir os detalhes completos: todos os itens, quantidades, subtotais, forma de pagamento, data/hora e dados do cliente

### Cenário: Filtrar por forma de pagamento
- **Dado** que o admin está na tela de Histórico de Vendas/Caixa
- **Quando** ele filtrar por forma de pagamento (PIX, Dinheiro, Cartão Crédito, Cartão Débito)
- **Então** o sistema **MUST** exibir somente as vendas com a forma de pagamento selecionada
- **E** **MUST** recalcular o total acumulado considerando o filtro

---

## Registrar, Remover ou Desativar Produto (Admin)

### Cenário: Listar todos os produtos
- **Dado** que o admin está na tela de gerenciamento de produtos
- **Quando** a tela carregar
- **Então** o sistema **MUST** listar todos os produtos (ativos e inativos) com nome, preço, estoque e status

### Cenário: Cadastrar novo produto
- **Dado** que o admin está na tela de formulário de produto
- **Quando** ele preencher nome, descrição, preço, categoria, estoque e imagem
- **E** confirmar o cadastro
- **Então** o sistema **MUST** salvar o produto no Supabase
- **E** **MUST** fazer upload da imagem para o Supabase Storage
- **E** **MUST** exibir confirmação de sucesso e voltar para a lista

### Cenário: Cadastrar produto sem imagem
- **Dado** que o admin preencheu os dados do produto
- **Quando** ele tentar cadastrar sem selecionar uma imagem
- **Então** o sistema **MUST** exibir mensagem informando que a imagem é obrigatória
- **E** **MUST NOT** permitir o cadastro sem imagem

### Cenário: Cadastrar produto com dados inválidos
- **Dado** que o admin está no formulário de produto
- **Quando** ele submeter com campos obrigatórios vazios ou preço negativo
- **Então** o sistema **MUST** exibir mensagens de validação nos campos incorretos
- **E** **MUST NOT** salvar o produto

### Cenário: Editar produto existente
- **Dado** que o admin está na lista de produtos
- **Quando** ele selecionar um produto para editar
- **Então** o sistema **MUST** carregar o formulário preenchido com os dados atuais
- **E** ao confirmar alterações, **MUST** atualizar o produto no Supabase

### Cenário: Desativar produto
- **Dado** que o admin está na lista de produtos
- **Quando** ele desativar um produto
- **Então** o sistema **MUST** alterar o status para inativo
- **E** o produto **MUST NOT** aparecer no catálogo dos clientes
- **E** **SHOULD** solicitar confirmação antes de desativar

### Cenário: Reativar produto desativado
- **Dado** que o admin está visualizando um produto com status inativo
- **Quando** ele reativar o produto
- **Então** o sistema **MUST** alterar o status para ativo
- **E** o produto **MUST** voltar a aparecer no catálogo dos clientes

### Cenário: Excluir produto permanentemente
- **Dado** que o admin quer excluir um produto
- **Quando** ele confirmar a exclusão
- **Então** o sistema **MUST** remover o produto do Supabase
- **E** **MUST** remover a imagem do Supabase Storage
- **E** **MUST** solicitar confirmação com aviso de que a ação é irreversível

---

## Gerenciamento de Categorias

### Cenário: Listar categorias
- **Dado** que o admin está na tela de categorias (acessível via Configurações do Admin)
- **Quando** a tela carregar
- **Então** o sistema **MUST** listar todas as categorias com nome e segmento (Pet/Agro)

### Cenário: Criar nova categoria
- **Dado** que o admin está na tela de categorias
- **Quando** ele informar nome e selecionar o segmento (Pet ou Agro) e confirmar
- **Então** o sistema **MUST** criar a categoria no Supabase

### Cenário: Excluir categoria com produtos vinculados
- **Dado** que a categoria possui produtos vinculados
- **Quando** o admin tentar excluí-la
- **Então** o sistema **MUST** exibir aviso de que existem produtos vinculados
- **E** **MUST NOT** permitir a exclusão até que os produtos sejam remanejados
