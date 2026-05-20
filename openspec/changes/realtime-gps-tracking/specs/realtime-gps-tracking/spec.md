## ADDED Requirements

### Requirement: Solicitação de Permissões de Geolocalização (Admin App)
O aplicativo do Administrador DEVE solicitar permissões de geolocalização no primeiro plano (Foreground) e no plano de fundo (Background) antes de iniciar a entrega de um pedido.

#### Scenario: Permissões Concedidas pelo Usuário
- **WHEN** o entregador inicia uma entrega no aplicativo Admin
- **THEN** o sistema solicita permissões de localização e o entregador as concede
- **THEN** o sistema ativa o rastreamento em primeiro e segundo plano com sucesso

#### Scenario: Permissões Negadas pelo Usuário
- **WHEN** o entregador inicia uma entrega no aplicativo Admin e o sistema solicita as permissões de localização
- **THEN** o entregador recusa conceder as permissões de localização
- **THEN** o sistema exibe um alerta de aviso informativo e impede o início da entrega até que as permissões sejam concedidas manualmente nas configurações do dispositivo

### Requirement: Envio Contínuo de Coordenadas de Geolocalização (Admin App)
O aplicativo do Administrador DEVERÁ ler a posição atual do GPS do celular e enviar as coordenadas para a tabela `delivery_tracking` no Supabase em intervalos de tempo configuráveis (por padrão, a cada 5 segundos) enquanto a entrega estiver ativa.

#### Scenario: Transmissão bem-sucedida de GPS
- **WHEN** a entrega está ativa e o entregador se move
- **THEN** o aplicativo lê as novas coordenadas do GPS
- **THEN** o aplicativo atualiza o registro correspondente ao pedido no Supabase com latitude, longitude e timestamp mais recentes

#### Scenario: Falha de conexão de rede durante o rastreamento
- **WHEN** o aplicativo do Administrador tenta atualizar a localização no Supabase mas a internet do celular falha ou desconecta
- **THEN** o aplicativo armazena localmente a última localização conhecida no SQLite
- **THEN** o aplicativo tenta reenviar as coordenadas acumuladas assim que a conexão de rede for restabelecida

### Requirement: Assinatura em Tempo Real e Exibição do Trajeto (Client App)
O aplicativo do Cliente DEVERÁ assinar as atualizações em tempo real da tabela `delivery_tracking` para a entrega ativa do seu pedido e renderizar o ícone do entregador de forma fluida e contínua no mapa utilizando animação de deslize e catch-up em caso de reconexões.

#### Scenario: Visualização do trajeto com deslize suave
- **WHEN** o cliente abre a tela de rastreamento do pedido ativo e o Supabase dispara uma nova coordenada do entregador
- **THEN** o aplicativo do cliente recebe a nova coordenada
- **THEN** o aplicativo interpola a posição do veículo em trechos de 50ms gerando um deslize visual suave de 20 FPS até o novo ponto

#### Scenario: Recuperação rápida após reabertura do aplicativo (Catch-up)
- **WHEN** o cliente fecha o aplicativo, passa 2 minutos, e reabre o aplicativo na tela de rastreamento
- **THEN** o aplicativo consulta a diferença temporal e calcula o ponto esperado
- **THEN** o aplicativo posiciona o veículo alguns metros atrás da posição atual real e roda um deslize acelerado (150ms por coordenada) até alcançar o entregador em tempo real
