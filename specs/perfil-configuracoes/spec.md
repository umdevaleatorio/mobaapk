# Especificação — Perfil do Usuário e Configurações

## Tela de Perfil (Cliente)

### Cenário: Visualizar perfil do cliente
- **Dado** que o cliente está autenticado e acessou a tela de Perfil
- **Quando** a tela carregar
- **Então** o sistema **MUST** exibir os dados do usuário: nome, e-mail, telefone e endereço
- **E** **MUST** exibir opção de editar os dados

### Cenário: Editar perfil do cliente
- **Dado** que o cliente está na tela de Perfil
- **Quando** ele tocar em "Editar perfil"
- **Então** o sistema **MUST** permitir a edição de: nome, telefone e endereço
- **E** **MUST NOT** permitir a edição do e-mail (campo somente leitura)
- **E** ao salvar, **MUST** atualizar os dados no Supabase

### Cenário: Editar perfil com dados inválidos
- **Dado** que o cliente está editando o perfil
- **Quando** ele submeter com campos obrigatórios vazios
- **Então** o sistema **MUST** exibir mensagens de validação
- **E** **MUST NOT** salvar os dados

### Cenário: Visualizar histórico de pedidos do cliente
- **Dado** que o cliente está na tela de Perfil
- **Quando** ele tocar em "Meus Pedidos" ou "Histórico de Pedidos"
- **Então** o sistema **MUST** navegar para a lista de pedidos do cliente
- **E** **MUST** exibir todos os pedidos feitos, ordenados do mais recente ao mais antigo
- **E** para cada pedido, **MUST** exibir: número, data, valor total, forma de pagamento e status atual

### Cenário: Detalhar pedido do histórico (cliente)
- **Dado** que o cliente está na lista de histórico de pedidos
- **Quando** ele tocar em um pedido
- **Então** o sistema **MUST** exibir os detalhes: itens comprados, quantidades, subtotais, valor total, forma de pagamento, endereço de entrega e status

### Cenário: Histórico de pedidos sem conexão
- **Dado** que o cliente está offline
- **Quando** ele acessar o histórico de pedidos
- **Então** o sistema **SHOULD** exibir os pedidos que estão em cache local (SQLite)
- **E** **MUST** informar que os dados podem não estar atualizados

---

## Tela de Perfil (Admin)

### Cenário: Visualizar perfil do admin
- **Dado** que o admin está autenticado e acessou a tela de Perfil (Admin)
- **Quando** a tela carregar
- **Então** o sistema **MUST** exibir os dados do admin: nome, e-mail, telefone e role
- **E** **MUST** exibir opção de editar os dados

### Cenário: Editar perfil do admin
- **Dado** que o admin está na tela de Perfil
- **Quando** ele tocar em "Editar perfil"
- **Então** o sistema **MUST** permitir a edição de: nome e telefone
- **E** **MUST NOT** permitir a edição do e-mail ou role
- **E** ao salvar, **MUST** atualizar os dados no Supabase

---

## Tela de Configurações (Cliente)

### Cenário: Acessar configurações do cliente
- **Dado** que o cliente está autenticado
- **Quando** ele acessar a tela de Configurações
- **Então** o sistema **MUST** exibir as opções:
  - Notificações (on/off)
  - Endereço de entrega padrão (editar)
  - Tema (Claro / Escuro)
  - Sobre o app
  - Termos de uso
  - Sair da conta (logout)

### Cenário: Alternar tema claro/escuro (cliente)
- **Dado** que o cliente está nas Configurações
- **Quando** ele alternar entre Tema Claro e Tema Escuro
- **Então** o sistema **MUST** aplicar o tema selecionado imediatamente em toda a interface
- **E** **MUST** persistir a preferência localmente (AsyncStorage ou SQLite)
- **E** ao reabrir o app, **MUST** carregar o tema salvo

### Cenário: Ativar/desativar notificações
- **Dado** que o cliente está nas Configurações
- **Quando** ele alternar as notificações
- **Então** o sistema **MUST** salvar a preferência
- **E** **SHOULD** ajustar as notificações push conforme a escolha

### Cenário: Editar endereço de entrega padrão
- **Dado** que o cliente está nas Configurações
- **Quando** ele tocar em "Endereço de entrega padrão"
- **Então** o sistema **MUST** exibir o formulário de endereço preenchido (se já cadastrado)
- **E** ao salvar, **MUST** atualizar o endereço no Supabase e no SQLite local

### Cenário: Sair da conta (Configurações do cliente)
- **Dado** que o cliente está nas Configurações
- **Quando** ele tocar em "Sair da conta"
- **Então** o sistema **MUST** encerrar a sessão (Supabase + expo-secure-store)
- **E** **MUST** redirecionar para a tela de login do cliente
- **E** **MUST NOT** limpar os itens do carrinho salvos no SQLite

---

## Tela de Configurações (Admin)

### Cenário: Acessar configurações do admin
- **Dado** que o admin está autenticado
- **Quando** ele acessar a tela de Configurações (Admin)
- **Então** o sistema **MUST** exibir as opções:
  - Configurações da loja (raio de entrega, horário de funcionamento)
  - Gerenciar categorias
  - Dados do PIX (chave PIX para geração do QR Code)
  - Tema (Claro / Escuro)
  - Modo offline
  - Sobre o app
  - Sair da conta (logout)

### Cenário: Alternar tema claro/escuro (admin)
- **Dado** que o admin está nas Configurações
- **Quando** ele alternar entre Tema Claro e Tema Escuro
- **Então** o sistema **MUST** aplicar o tema selecionado imediatamente em toda a interface do admin
- **E** **MUST** persistir a preferência localmente
- **E** ao reabrir o app, **MUST** carregar o tema salvo

### Cenário: Configurar dados da loja
- **Dado** que o admin está nas Configurações
- **Quando** ele tocar em "Configurações da loja"
- **Então** o sistema **MUST** exibir:
  - Raio de entrega (padrão: 17km, editável)
  - Horário de funcionamento (início e fim)
- **E** ao salvar, **MUST** atualizar no Supabase

### Cenário: Configurar chave PIX
- **Dado** que o admin está nas Configurações
- **Quando** ele tocar em "Dados do PIX"
- **Então** o sistema **MUST** exibir o formulário para configurar:
  - Chave PIX (CPF, CNPJ, e-mail, telefone ou chave aleatória)
  - Nome do recebedor
  - Cidade do recebedor
- **E** ao salvar, **MUST** atualizar os dados usados para geração do QR Code PIX no Supabase

### Cenário: Gerenciar categorias via Configurações
- **Dado** que o admin está nas Configurações
- **Quando** ele tocar em "Gerenciar categorias"
- **Então** o sistema **MUST** navegar para a tela de gerenciamento de categorias
- **E** permitir CRUD completo de categorias (ver spec em `painel-admin`)

### Cenário: Sair da conta (Configurações do admin)
- **Dado** que o admin está nas Configurações
- **Quando** ele tocar em "Sair da conta"
- **Então** o sistema **MUST** encerrar a sessão (Supabase + expo-secure-store)
- **E** **MUST** redirecionar para a tela de login do admin
