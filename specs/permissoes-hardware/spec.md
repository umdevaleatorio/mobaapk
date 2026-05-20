# Especificação — Permissões de Hardware

Este documento consolida todos os cenários de permissão de hardware do aplicativo. As interações com o sistema operacional para solicitação e gerenciamento de permissões seguem padrões consistentes.

---

## Permissão de Câmera

### Cenário: Primeira solicitação de permissão de câmera
- **Dado** que o usuário nunca concedeu ou negou a permissão de câmera para o app
- **Quando** ele acessar a funcionalidade de leitura de QR Code pela primeira vez
- **Então** o sistema **MUST** exibir a solicitação nativa do sistema operacional para permissão de câmera
- **E** **MUST NOT** acessar a câmera antes da resposta do usuário

### Cenário: Permissão de câmera concedida
- **Dado** que o usuário concedeu a permissão de câmera
- **Quando** ele acessar a leitura de QR Code
- **Então** o sistema **MUST** ativar a câmera normalmente
- **E** **MUST NOT** solicitar a permissão novamente

### Cenário: Permissão de câmera negada
- **Dado** que o usuário negou a permissão de câmera
- **Quando** ele tentar acessar a leitura de QR Code
- **Então** o sistema **MUST** exibir um modal amigável com:
  - Explicação clara do porquê a câmera é necessária ("Para ler o QR Code do pagamento PIX")
  - Botão para abrir as configurações do sistema operacional
  - Botão para fechar/cancelar
- **E** **MUST NOT** exibir tela preta, tela em branco ou erro técnico

### Cenário: Permissão de câmera revogada durante o uso
- **Dado** que a câmera estava ativa
- **Quando** o usuário revogar a permissão pelas configurações do SO
- **Então** o sistema **MUST** desativar a câmera de forma segura
- **E** **MUST** exibir mensagem informando que a permissão foi removida

---

## Permissão de Localização

### Cenário: Primeira solicitação de permissão de localização
- **Dado** que o usuário nunca concedeu ou negou a permissão de localização
- **Quando** ele acessar funcionalidade que requer localização (mapa, checkout com entrega)
- **Então** o sistema **MUST** exibir a solicitação nativa do sistema operacional
- **E** **SHOULD** exibir previamente um modal explicativo sobre o uso da localização ("Para verificar se você está dentro da área de entrega")

### Cenário: Permissão de localização concedida (somente em uso)
- **Dado** que o usuário concedeu permissão de localização "somente durante o uso do app"
- **Quando** ele acessar o mapa ou checkout
- **Então** o sistema **MUST** obter a localização normalmente
- **E** **MUST NOT** acessar a localização em segundo plano

### Cenário: Permissão de localização negada
- **Dado** que o usuário negou a permissão de localização
- **Quando** ele tentar acessar o mapa ou checkout com entrega
- **Então** o sistema **MUST** exibir um modal amigável com:
  - Explicação clara ("Para verificar se a entrega está disponível na sua região")
  - Botão para abrir as configurações do sistema operacional
  - Botão para prosseguir sem localização
- **E** o app **MUST** continuar funcional (catálogo, carrinho, perfil)
- **E** no checkout, **SHOULD** oferecer opção de inserir endereço manualmente

### Cenário: Localização negada permanentemente
- **Dado** que o sistema operacional não permite mais solicitar a permissão (negada permanentemente)
- **Quando** o usuário tentar usar funcionalidade de localização
- **Então** o sistema **MUST** direcionar o usuário às configurações do SO
- **E** **MUST NOT** exibir a solicitação nativa (pois o SO a bloqueou)

---

## Permissão de Biometria

### Cenário: Dispositivo com biometria configurada
- **Dado** que o dispositivo possui sensor biométrico (digital ou facial)
- **E** o usuário configurou pelo menos uma biometria no SO
- **Quando** o login do admin solicitar autenticação biométrica
- **Então** o sistema **MUST** exibir o prompt biométrico nativo do dispositivo

### Cenário: Dispositivo sem sensor biométrico
- **Dado** que o dispositivo não possui sensor biométrico
- **Quando** o admin fizer login
- **Então** o sistema **MUST** oferecer método alternativo de autenticação (PIN ou senha adicional)
- **E** **MUST NOT** bloquear completamente o acesso ao painel admin

### Cenário: Biometria não configurada no dispositivo
- **Dado** que o dispositivo possui sensor, mas nenhuma biometria foi cadastrada pelo usuário
- **Quando** o admin fizer login
- **Então** o sistema **SHOULD** sugerir que o usuário configure a biometria no SO
- **E** **MUST** oferecer método alternativo de autenticação

---

## Comportamento Geral de Permissões

### Cenário: Solicitação de permissão não deve bloquear o app
- **Dado** que qualquer permissão de hardware foi negada
- **Quando** o usuário continuar navegando no app
- **Então** o sistema **MUST** manter todas as funcionalidades que não dependem daquela permissão funcionando normalmente
- **E** **MUST NOT** encerrar o app ou exibir tela de erro fatal

### Cenário: Múltiplas permissões necessárias
- **Dado** que uma funcionalidade requer mais de uma permissão (ex: mapa requer localização)
- **Quando** o usuário acessar essa funcionalidade
- **Então** o sistema **MUST** solicitar cada permissão individualmente
- **E** **MUST NOT** solicitar todas as permissões de uma vez na abertura do app
- **E** **MUST** solicitar cada permissão somente no momento em que for necessária (lazy permission)
