# Especificação — Tela de Splash

## Exibição Inicial

### Cenário: App aberto pela primeira vez (sem sessão)
- **Dado** que o usuário abriu o app pela primeira vez ou não possui sessão salva
- **Quando** a Tela de Splash carregar
- **Então** o sistema **MUST** exibir a logo da AgroPet Lambari centralizada na tela
- **E** **MUST** exibir um indicador de carregamento (spinner ou animação sutil)
- **E** após verificar que não há sessão válida, **MUST** redirecionar para a tela de login do cliente
- **E** a splash **SHOULD** permanecer visível por no mínimo 1,5 segundo (para não piscar)

### Cenário: App aberto com sessão de cliente válida
- **Dado** que o usuário (role "client") possui uma sessão válida armazenada no expo-secure-store
- **Quando** a Tela de Splash carregar
- **Então** o sistema **MUST** exibir a logo da AgroPet Lambari
- **E** **MUST** verificar a validade do token de sessão
- **E** se válido, **MUST** redirecionar diretamente para o Menu Inicial do cliente (Catálogo)
- **E** **MUST NOT** exibir a tela de login

### Cenário: App aberto com sessão de admin válida
- **Dado** que o usuário (role "admin") possui uma sessão válida armazenada
- **Quando** a Tela de Splash carregar
- **Então** o sistema **MUST** exibir a logo da AgroPet Lambari
- **E** **MUST** verificar a validade do token de sessão
- **E** se válido, **MUST** redirecionar para o Menu Inicial do admin (Drawer)
- **E** **SHOULD** solicitar biometria antes de entrar no painel admin (mesmo com sessão válida)

### Cenário: App aberto com sessão expirada
- **Dado** que o usuário possui um token de sessão armazenado, mas ele expirou
- **Quando** a Tela de Splash carregar e verificar o token
- **Então** o sistema **MUST** limpar o token expirado do expo-secure-store
- **E** **MUST** redirecionar para a tela de login do cliente

### Cenário: App aberto sem conexão com a internet
- **Dado** que o dispositivo está sem conexão
- **Quando** a Tela de Splash carregar
- **Então** o sistema **MUST** exibir a logo normalmente
- **E** **SHOULD** verificar se existe sessão em cache local
- **E** se existir sessão em cache, **SHOULD** permitir acesso limitado ao app (modo offline)
- **E** se não existir sessão, **MUST** exibir mensagem informando que é necessária conexão para o primeiro acesso
