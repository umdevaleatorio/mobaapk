# Especificação — Geolocalização, Mapa e Entrega

## Obtenção da Localização do Usuário

### Cenário: Localização obtida com sucesso
- **Dado** que o usuário (cliente ou admin) concedeu permissão de localização
- **E** o GPS do dispositivo está ativo
- **Quando** o sistema solicitar a localização
- **Então** o sistema **MUST** obter as coordenadas (latitude, longitude) do dispositivo
- **E** **MUST** armazenar as coordenadas para uso nas funcionalidades de entrega e mapa

### Cenário: Permissão de localização negada
- **Dado** que o usuário negou a permissão de localização
- **Quando** o sistema tentar obter as coordenadas
- **Então** o sistema **MUST** exibir um modal amigável explicando por que a localização é necessária
- **E** **MUST** oferecer botão para abrir as configurações do sistema operacional
- **E** o sistema **MUST NOT** travar ou apresentar erro crítico

### Cenário: GPS desativado
- **Dado** que o GPS do dispositivo está desligado
- **Quando** o sistema solicitar a localização
- **Então** o sistema **SHOULD** exibir mensagem solicitando a ativação do GPS
- **E** **MUST** permitir que o usuário continue usando o app sem localização (com funcionalidades limitadas)

### Cenário: Falha na obtenção da localização
- **Dado** que a permissão foi concedida e o GPS está ativo
- **Quando** o sistema não conseguir obter a localização por timeout ou erro
- **Então** o sistema **SHOULD** tentar novamente automaticamente
- **E** após falhas consecutivas, **MUST** informar o usuário e oferecer inserção manual do endereço

---

## Verificação de Raio de Entrega

### Cenário: Usuário dentro do raio de entrega (≤ 17km)
- **Dado** que o centro de referência é Lambari, MG (-21.9686, -45.3464)
- **E** o raio máximo de entrega é de 17 km
- **Quando** a distância calculada (fórmula de Haversine) entre o usuário e o centro for menor ou igual a 17 km
- **Então** o sistema **MUST** classificar o tipo de entrega como "local"
- **E** **MUST** habilitar a opção de entrega no endereço do cliente

### Cenário: Usuário fora do raio de entrega (> 17km)
- **Dado** que a distância do usuário até o centro de Lambari é maior que 17 km
- **Quando** o sistema avaliar o tipo de entrega
- **Então** o sistema **MUST** classificar como "fora do raio"
- **E** **MUST** oferecer as alternativas: "Retirar na loja" e/ou "Comprar pelo Mercado Livre"
- **E** **MUST NOT** exibir opção de entrega local

### Cenário: Redirecionamento para Mercado Livre
- **Dado** que o usuário está fora do raio de entrega
- **E** o produto possui URL do Mercado Livre cadastrada
- **Quando** o usuário selecionar "Comprar pelo Mercado Livre"
- **Então** o sistema **MUST** abrir o link do anúncio no navegador do dispositivo

---

## Tela de Mapa (Cliente)

### Cenário: Exibição do mapa do cliente com marcadores
- **Dado** que o cliente está autenticado e acessou a tela de Mapa
- **Quando** o mapa carregar
- **Então** o sistema **MUST** exibir o marcador da loja AgroPet Lambari no mapa
- **E** **MUST** exibir marcadores dos concorrentes cadastrados
- **E** **SHOULD** centralizar o mapa na localização do usuário (se disponível)

### Cenário: Acompanhar pedido no mapa (cliente)
- **Dado** que o cliente possui um pedido com status "delivering" (em entrega)
- **Quando** ele acessar a tela de Mapa
- **Então** o sistema **SHOULD** exibir o status do pedido em entrega no mapa
- **E** **SHOULD** exibir o endereço de entrega marcado no mapa

### Cenário: Mapa sem permissão de localização
- **Dado** que o usuário não concedeu permissão de localização
- **Quando** ele acessar a tela de Mapa
- **Então** o sistema **MUST** exibir o mapa centralizado na loja AgroPet Lambari
- **E** **MUST** exibir os marcadores de concorrentes normalmente
- **E** **MUST NOT** exibir o marcador do usuário

### Cenário: Tocar em marcador de concorrente
- **Dado** que o mapa está sendo exibido com marcadores
- **Quando** o usuário tocar no marcador de um concorrente
- **Então** o sistema **MUST** exibir as informações do concorrente (nome, endereço, telefone)

### Cenário: Mapa sem conexão com a internet
- **Dado** que o dispositivo está sem conexão
- **Quando** o usuário tentar acessar o mapa
- **Então** o sistema **SHOULD** exibir mensagem informando que o mapa requer conexão com a internet
- **E** **MUST NOT** exibir tela em branco ou erro não tratado

---

## Tela de Mapa (Admin)

### Cenário: Exibição do mapa do admin
- **Dado** que o admin está autenticado e acessou a tela de Mapa (Admin)
- **Quando** o mapa carregar
- **Então** o sistema **MUST** exibir o marcador da loja AgroPet Lambari
- **E** **MUST** exibir marcadores dos concorrentes cadastrados
- **E** **SHOULD** centralizar o mapa na localização do admin (se disponível)

### Cenário: Acompanhar pedidos em entrega no mapa (admin)
- **Dado** que existem pedidos com status "delivering" (em entrega)
- **Quando** o admin acessar a tela de Mapa
- **Então** o sistema **SHOULD** exibir os endereços de entrega dos pedidos em andamento como marcadores no mapa
- **E** ao tocar em um marcador de entrega, **MUST** exibir os detalhes do pedido (número, cliente, valor, status)

### Cenário: Admin gerencia concorrentes pelo mapa
- **Dado** que o admin está na tela de Mapa
- **Quando** ele tocar em um marcador de concorrente
- **Então** o sistema **MUST** exibir as informações do concorrente (nome, endereço, telefone)
- **E** **SHOULD** oferecer opção de editar ou excluir o concorrente

### Cenário: Admin cadastra concorrente
- **Dado** que o admin está na tela de Mapa ou via Configurações
- **Quando** ele informar nome, endereço, coordenadas e telefone do concorrente
- **Então** o sistema **MUST** salvar o concorrente no Supabase
- **E** o concorrente **MUST** aparecer como marcador no mapa (tanto do cliente quanto do admin)

### Cenário: Admin edita concorrente
- **Dado** que existem concorrentes cadastrados
- **Quando** o admin selecionar um para editar
- **Então** o sistema **MUST** carregar os dados atuais no formulário
- **E** ao confirmar, **MUST** atualizar no Supabase

### Cenário: Admin exclui concorrente
- **Dado** que o admin quer excluir um concorrente
- **Quando** ele confirmar a exclusão
- **Então** o sistema **MUST** remover do Supabase
- **E** o marcador **MUST** desaparecer do mapa
