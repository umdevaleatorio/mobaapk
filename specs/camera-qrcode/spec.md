# Especificação — Câmera e QR Code PIX

## Geração de QR Code PIX (Tela de Confirmação do Pagamento)

> A geração do QR Code PIX acontece na Tela de Confirmação do Pagamento quando o cliente seleciona PIX como forma de pagamento. Veja spec completa em `specs/carrinho-checkout/spec.md`.

---

## Leitura de QR Code PIX (Câmera)

### Cenário: Leitura de QR Code com câmera autorizada
- **Dado** que o usuário concedeu permissão de câmera
- **E** a câmera do dispositivo está funcional
- **Quando** ele acessar a funcionalidade de leitura de QR Code
- **Então** o sistema **MUST** ativar a câmera traseira do dispositivo
- **E** **MUST** exibir o visor da câmera com indicação visual da área de leitura
- **E** ao detectar um QR Code válido, **MUST** processar o conteúdo automaticamente

### Cenário: QR Code PIX válido detectado
- **Dado** que a câmera está ativa e lendo QR Codes
- **Quando** um QR Code no padrão EMV/BRCode for detectado
- **Então** o sistema **MUST** extrair as informações de pagamento (chave, valor, recebedor)
- **E** **MUST** exibir os dados extraídos para confirmação do usuário
- **E** **SHOULD** emitir feedback tátil (vibração) ao detectar com sucesso

### Cenário: QR Code inválido ou não-PIX
- **Dado** que a câmera está ativa
- **Quando** um QR Code que não está no padrão PIX/EMV for detectado
- **Então** o sistema **MUST** exibir mensagem informando que o QR Code não é um pagamento PIX válido
- **E** **MUST** continuar escaneando sem travar a tela

### Cenário: Permissão de câmera negada
- **Dado** que o usuário negou a permissão de câmera
- **Quando** ele tentar acessar a leitura de QR Code
- **Então** o sistema **MUST** exibir um modal amigável explicando que a câmera é necessária para leitura do QR Code
- **E** **MUST** oferecer botão para abrir as configurações do sistema operacional
- **E** **MUST NOT** exibir tela preta ou erro sem explicação

### Cenário: Ambiente com pouca luz
- **Dado** que a câmera está ativa
- **Quando** o ambiente possuir pouca luz e dificultar a leitura
- **Então** o sistema **SHOULD** oferecer a opção de ativar o flash/lanterna do dispositivo

---

## Alternativa à Câmera (Galeria / Código Copia e Cola)

### Cenário: Importar QR Code da Galeria
- **Dado** que o usuário está na tela de leitura de QR Code
- **Quando** ele optar por "Selecionar da Galeria"
- **Então** o sistema **MUST** abrir o seletor de imagens nativo do dispositivo
- **E** ao selecionar uma imagem contendo um QR Code, **MUST** processar o código como se tivesse sido escaneado pela câmera
- **E** caso a imagem não contenha um QR Code válido, **MUST** informar ao usuário

### Cenário: Uso do código Copia e Cola (dispositivo único)
- **Dado** que o cliente está pagando com PIX e possui apenas um dispositivo
- **Quando** ele visualizar a Tela de Confirmação do Pagamento
- **Então** o sistema **MUST** exibir o código PIX Copia e Cola abaixo do QR Code
- **E** **MUST** permitir copiar o código para a área de transferência com um toque
- **E** o cliente pode colar o código no app do banco para concluir o pagamento
