## Why

Atualmente, o rastreamento do entregador no aplicativo do cliente funciona com base em uma simulação local e estática. Para fornecer uma experiência real e confiável para os clientes (semelhante a aplicativos de delivery como Uber/99), é necessário que o aplicativo do entregador (Admin) envie sua localização GPS real de forma contínua e o aplicativo do cliente assine essas atualizações, exibindo o movimento fluido do entregador no mapa.

## What Changes

- **Admin App**: Envio periódico da geolocalização do dispositivo do entregador (em segundo plano ou durante a entrega ativa) para o Supabase.
- **Client App**: Inclusão de um canal de escuta em tempo real (Supabase Realtime) que lê a posição do entregador.
- **Banco de Dados**: Criação de uma tabela específica para registrar as coordenadas em tempo real das entregas.
- **Experiência do Usuário (Cliente)**: Substituição da simulação estática por dados reais, aplicando técnicas de interpolação para suavizar o deslize do carro no mapa, mesmo com pequenos atrasos de rede.

## Capabilities

### New Capabilities
- `realtime-gps-tracking`: Rastreamento e sincronização GPS em tempo real da entrega ativa do entregador (aplicativo Admin) para o mapa do cliente, atualizado periodicamente e animado de forma fluida.

### Modified Capabilities

## Impact

- **Supabase**: Nova tabela `delivery_tracking` (order_id, latitude, longitude, updated_at). Configurações de replicação do Supabase Realtime ativadas para essa tabela.
- **Hardware/Permissões**: Solicitação de permissão de geolocalização no dispositivo do entregador (Admin App), incluindo permissão para execução em segundo plano (background location).
- **agropet-admin**: Criação de um serviço de monitoramento GPS e sincronização com o banco.
- **agropet-cliente**: Atualização do `MapScreen.tsx` para se inscrever nas atualizações reais em vez de rodar o loop de simulação estático puro.
