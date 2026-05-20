# Especificação — Autenticação

## Tela de Cadastro (Cliente)

### Cenário: Registro com dados válidos
- **Dado** que o usuário está na tela de cadastro do cliente
- **Quando** ele preencher nome completo, e-mail válido, telefone, endereço completo (rua, número, bairro, cidade, CEP) e senha (mínimo 8 caracteres)
- **E** confirmar o cadastro
- **Então** o sistema **MUST** criar a conta com role "client" no Supabase Auth
- **E** **MUST** redirecionar para a tela principal do cliente (Menu Inicial / Catálogo)
- **E** **MUST** armazenar o token de sessão no expo-secure-store

### Cenário: Registro com e-mail já existente
- **Dado** que o e-mail informado já está cadastrado no sistema
- **Quando** o usuário tentar confirmar o cadastro
- **Então** o sistema **MUST** exibir mensagem de erro informando que o e-mail já está em uso
- **E** o sistema **MUST NOT** criar uma conta duplicada

### Cenário: Registro com dados inválidos
- **Dado** que o usuário está na tela de cadastro
- **Quando** ele submeter o formulário com campos obrigatórios vazios ou e-mail em formato inválido
- **Então** o sistema **MUST** exibir mensagens de validação indicando os campos incorretos
- **E** o formulário **MUST NOT** ser submetido

### Cenário: Registro com senha fraca
- **Dado** que o usuário preencheu uma senha com menos de 8 caracteres
- **Quando** ele tentar confirmar o cadastro
- **Então** o sistema **MUST** exibir uma mensagem informando os requisitos mínimos da senha

### Cenário: Registro sem conexão com a internet
- **Dado** que o dispositivo está sem conexão com a internet
- **Quando** o usuário tentar realizar o cadastro
- **Então** o sistema **MUST** exibir mensagem informando que é necessária conexão para criar a conta
- **E** **MUST NOT** perder os dados já preenchidos no formulário

### Cenário: Navegação para login a partir do cadastro
- **Dado** que o usuário está na tela de cadastro
- **Quando** ele tocar em "Já tenho conta" ou equivalente
- **Então** o sistema **MUST** navegar para a tela de login do cliente

---

## Tela de Login (Cliente)

### Cenário: Login com credenciais válidas (cliente)
- **Dado** que o usuário possui conta com role "client"
- **Quando** ele informar e-mail e senha corretos na tela de login do cliente
- **Então** o sistema **MUST** autenticá-lo via Supabase Auth
- **E** **MUST** armazenar o token de sessão no expo-secure-store
- **E** **MUST** redirecioná-lo para o Menu Inicial do cliente (Bottom Tabs: Catálogo, Carrinho, Mapa, Perfil)

### Cenário: Login com credenciais inválidas
- **Dado** que o usuário está na tela de login do cliente
- **Quando** ele informar e-mail ou senha incorretos
- **Então** o sistema **MUST** exibir mensagem de erro genérica ("E-mail ou senha incorretos")
- **E** o sistema **MUST NOT** revelar se o e-mail existe ou não no sistema

### Cenário: Login sem conexão com a internet
- **Dado** que o dispositivo está sem conexão com a internet
- **Quando** o usuário tentar fazer login
- **Então** o sistema **MUST** exibir mensagem informando que é necessária conexão para autenticar
- **E** o sistema **SHOULD** verificar se existe uma sessão válida em cache local e permitir acesso limitado

### Cenário: Navegação para cadastro a partir do login
- **Dado** que o usuário está na tela de login do cliente
- **Quando** ele tocar em "Criar conta" ou equivalente
- **Então** o sistema **MUST** navegar para a tela de cadastro

### Cenário: Navegação para login do admin
- **Dado** que o usuário está na tela de login do cliente
- **Quando** ele tocar em "Entrar como administrador" ou equivalente
- **Então** o sistema **MUST** navegar para a tela de login do admin (tela separada)

---

## Tela de Login (Administrador) — Tela Separada

### Cenário: Login admin com biometria disponível
- **Dado** que o usuário está na tela de login do administrador (tela separada do login do cliente)
- **E** possui conta com role "admin"
- **E** o dispositivo possui sensor biométrico configurado
- **Quando** ele informar e-mail e senha corretos
- **Então** o sistema **MUST** solicitar autenticação biométrica (digital ou facial) via expo-local-authentication
- **E** somente após a confirmação biométrica, **MUST** redirecioná-lo para o Menu Inicial do admin (Drawer)

### Cenário: Admin recusa a biometria
- **Dado** que o admin fez login com e-mail e senha corretos
- **Quando** a tela de biometria for exibida e ele cancelar ou falhar na verificação
- **Então** o sistema **MUST** bloquear o acesso ao painel admin
- **E** o sistema **MUST** exibir mensagem informando que a biometria é obrigatória

### Cenário: Dispositivo sem biometria disponível
- **Dado** que o admin fez login com e-mail e senha corretos
- **E** o dispositivo não possui sensor biométrico ou não está configurado
- **Quando** o sistema tentar solicitar biometria
- **Então** o sistema **MUST** oferecer fallback de autenticação via PIN ou senha adicional
- **E** **MUST NOT** bloquear completamente o acesso admin

### Cenário: Cliente tenta login no painel admin
- **Dado** que o usuário possui role "client"
- **Quando** ele tentar fazer login na tela de login do admin
- **Então** o sistema **MUST** exibir mensagem informando que a conta não possui permissão de administrador
- **E** **MUST NOT** redirecionar para o painel admin

### Cenário: Navegação de volta ao login do cliente
- **Dado** que o usuário está na tela de login do admin
- **Quando** ele tocar em "Voltar" ou "Login como cliente"
- **Então** o sistema **MUST** navegar de volta para a tela de login do cliente

---

## Sessão e Logout

### Cenário: Sessão expirada
- **Dado** que o token de autenticação do usuário expirou
- **Quando** ele tentar acessar qualquer tela protegida
- **Então** o sistema **MUST** redirecioná-lo para a tela de login correspondente ao seu role
- **E** **SHOULD** exibir mensagem informando que a sessão expirou

### Cenário: Logout do sistema
- **Dado** que o usuário está autenticado (cliente ou admin)
- **Quando** ele acionar a opção de sair na tela de configurações ou perfil
- **Então** o sistema **MUST** encerrar a sessão atual no Supabase
- **E** **MUST** limpar os tokens de autenticação do expo-secure-store
- **E** **MUST** redirecionar para a tela de login correspondente
- **E** **MUST NOT** limpar os dados do carrinho salvos localmente (SQLite)

### Cenário: Persistência de sessão
- **Dado** que o usuário fez login e fechou o app sem fazer logout
- **Quando** ele reabrir o app
- **Então** o sistema **MUST** verificar se o token de sessão ainda é válido
- **E** se válido, **MUST** redirecionar diretamente para o Menu Inicial correspondente ao role
- **E** se inválido, **MUST** exibir a tela de login
