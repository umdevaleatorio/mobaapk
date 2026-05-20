# Especificação — Modo Offline e Sincronização

## Cache Local de Dados

### Cenário: Armazenamento de produtos para acesso offline
- **Dado** que o dispositivo possui conexão com a internet
- **Quando** o catálogo de produtos for carregado do Supabase
- **Então** o sistema **MUST** salvar uma cópia dos produtos no banco de dados local (SQLite)
- **E** **MUST** incluir: nome, descrição, preço, categoria, estoque e caminho da imagem em cache

### Cenário: Acesso ao catálogo sem internet
- **Dado** que o dispositivo está sem conexão com a internet
- **Quando** o cliente acessar o catálogo de produtos
- **Então** o sistema **MUST** carregar os produtos a partir do SQLite
- **E** **MUST** exibir indicador visual de que o app está em modo offline
- **E** **SHOULD** informar a data/hora da última sincronização

### Cenário: Cache de imagens local
- **Dado** que um produto possui imagem armazenada no Supabase Storage
- **Quando** a imagem for baixada pela primeira vez
- **Então** o sistema **MUST** salvar a imagem no sistema de arquivos local do dispositivo
- **E** ao exibir o produto offline, **MUST** utilizar a imagem em cache

---

## Sincronização (Online ↔ Offline)

### Cenário: Sincronização na abertura do app
- **Dado** que a conexão com a internet foi restabelecida
- **Quando** o app for aberto
- **Então** o sistema **MUST** sincronizar silenciosamente os dados do Supabase com o SQLite local
- **E** **MUST** atualizar produtos novos, alterados ou removidos
- **E** **MUST NOT** interromper a experiência do usuário durante a sincronização

### Cenário: Dados modificados offline que precisam ser enviados
- **Dado** que o usuário realizou operações enquanto estava offline (ex: itens no carrinho)
- **Quando** a conexão for restabelecida
- **Então** o sistema **MUST** enviar as operações pendentes para o Supabase
- **E** em caso de conflito de dados, **MUST** priorizar a versão mais recente
- **E** **MUST** informar o usuário caso alguma operação não possa ser sincronizada

### Cenário: Falha na sincronização
- **Dado** que o sistema tentou sincronizar mas houve erro no servidor
- **Quando** o erro for detectado
- **Então** o sistema **SHOULD** agendar nova tentativa automática
- **E** **MUST NOT** apagar os dados locais por causa da falha
- **E** **SHOULD** registrar o erro em log para diagnóstico

---

## Funcionalidades Offline (Cliente)

### Cenário: Carrinho de compras offline
- **Dado** que o dispositivo está sem internet
- **Quando** o cliente adicionar ou remover itens do carrinho
- **Então** o sistema **MUST** persistir o estado do carrinho no SQLite
- **E** o carrinho **MUST** estar intacto quando a conexão for restabelecida

### Cenário: Checkout offline (bloqueado)
- **Dado** que o dispositivo está sem internet
- **Quando** o cliente tentar finalizar o pedido
- **Então** o sistema **MUST** informar que não é possível criar pedidos sem conexão
- **E** **SHOULD** salvar os dados do checkout para tentativa futura

### Cenário: Histórico de pedidos offline (cliente)
- **Dado** que o cliente já visualizou seus pedidos com internet anteriormente
- **Quando** ele acessar o histórico offline
- **Então** o sistema **SHOULD** exibir os pedidos que estão em cache local
- **E** **MUST** informar que os dados podem não estar atualizados

---

## Modo Offline (Admin)

### Cenário: Acessar modo offline pelo admin
- **Dado** que o admin está nas Configurações
- **Quando** ele acessar a opção "Modo Offline"
- **Então** o sistema **MUST** exibir:
  - Status da conexão atual (Online / Offline)
  - Data/hora da última sincronização
  - Quantidade de operações pendentes de envio
  - Botão "Forçar Sincronização" (quando online)

### Cenário: Admin consulta produtos offline
- **Dado** que o admin está sem conexão com a internet
- **Quando** ele acessar a lista de produtos
- **Então** o sistema **MUST** carregar os produtos a partir do SQLite
- **E** **MUST** exibir indicador visual de modo offline
- **E** **SHOULD** permitir visualizar detalhes dos produtos em cache
- **E** **MUST NOT** permitir cadastrar, editar ou excluir produtos offline

### Cenário: Admin consulta pedidos offline
- **Dado** que o admin está sem conexão
- **Quando** ele acessar a tela de pedidos
- **Então** o sistema **SHOULD** exibir os pedidos em cache local
- **E** **MUST** informar que os dados podem não estar atualizados
- **E** **MUST NOT** permitir atualizar status de pedidos offline

### Cenário: Admin acessa dashboard offline
- **Dado** que o admin está sem conexão
- **Quando** ele acessar o Painel de Vendas
- **Então** o sistema **SHOULD** exibir as últimas métricas em cache
- **E** **MUST** informar data/hora da última atualização
- **E** **MUST** exibir indicador de modo offline

### Cenário: Forçar sincronização (admin)
- **Dado** que o admin está online e na tela de Modo Offline
- **Quando** ele tocar em "Forçar Sincronização"
- **Então** o sistema **MUST** iniciar sincronização imediata do SQLite com o Supabase
- **E** **MUST** exibir progresso da sincronização
- **E** ao concluir, **MUST** atualizar a data/hora da última sincronização

---

## Indicação de Status de Conexão

### Cenário: Detecção de mudança de conectividade
- **Dado** que o app está em execução
- **Quando** a conexão de internet for perdida
- **Então** o sistema **MUST** exibir indicador visual persistente de modo offline (banner ou badge) em todas as telas
- **E** quando a conexão for restabelecida, **MUST** remover o indicador
- **E** **MUST** iniciar a sincronização automaticamente
