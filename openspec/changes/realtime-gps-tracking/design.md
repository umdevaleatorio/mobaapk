## Context

Atualmente, o rastreamento no aplicativo do cliente simula a entrega a partir de dados fixos. O objetivo deste design é documentar a arquitetura técnica para capturar a geolocalização do entregador (aplicativo Admin) e transmiti-la em tempo real para o cliente via Supabase.

## Goals / Non-Goals

**Goals:**
- Implementar rastreamento contínuo em primeiro e segundo plano (background) no app Admin usando `expo-location`.
- Criar a tabela `delivery_tracking` no Supabase e habilitar publicação/assinatura via Supabase Realtime.
- Integrar o fluxo de dados em tempo real no `MapScreen.tsx` do aplicativo cliente, substituindo a simulação local.
- Adicionar sincronização local de coordenadas em SQLite no app Admin quando não houver internet disponível.

**Non-Goals:**
- Armazenamento permanente do histórico completo de rota de todas as entregas realizadas (a tabela apenas guardará o estado atual e será limpa/arquivada pós-entrega).
- Navegação GPS curva-a-curva guiada por voz no app do entregador.

## Decisions

### 1. Geolocalização em Segundo Plano (Background Location)
- **Decisão**: Utilizar `expo-location` configurando tarefas em segundo plano com o `TaskManager` do Expo.
- **Configurações necessárias (`app.json`)**:
  - **Android**: Adicionar as permissões `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `ACCESS_BACKGROUND_LOCATION` e o serviço `FOREGROUND_SERVICE`.
  - **iOS**: Adicionar chaves `NSLocationWhenInUseUsageDescription`, `NSLocationAlwaysAndWhenInUseUsageDescription` e habilitar background modes para `location`.
- **Alternativas consideradas**: `react-native-geolocation-service` (exige desvincular do Expo Managed Workflow). Mantivemos o `expo-location` para manter a compatibilidade do Expo Go e facilidade de build.

### 2. Sincronização Local e Supabase
- **Estratégia SQLite**: Caso o entregador passe por uma zona sem sinal de celular (típico em rotas suburbanas de Lambari), as coordenadas serão gravadas temporariamente na tabela local `pending_gps_logs` no SQLite.
- **Sincronização**: Uma tarefa periódica tentará dar upload nos registros acumulados para o Supabase assim que uma conexão de rede estável for detectada, mantendo o histórico de trajeto íntegro.

### 3. Integração Realtime no Cliente
- **Fluxo de Escuta**:
  - O cliente escuta alterações na tabela `delivery_tracking` usando o canal de real-time do Supabase:
    ```typescript
    const subscription = supabase
      .channel('delivery_location')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'delivery_tracking', filter: `order_id=eq.${orderId}` }, payload => {
        // Atualizar coordenadas recebidas
      })
      .subscribe();
    ```

## Risks / Trade-offs

- **Consumo de Bateria**: O rastreamento de background com GPS ativo drena bateria significativamente.
  - *Mitigação*: Ajustar a precisão de localização para `LocationAccuracy.Balanced` e usar intervalo de tempo de 5 a 10 segundos, suspendendo a tarefa assim que o status da entrega mudar para "entregue".
- **Desconexão Temporária**: O veículo pode sumir ou travar na tela do cliente.
  - *Mitigação*: Manter o mecanismo de interpolação suave (deslize) e catch-up rápido (deslizar rapidamente para alcançar a posição real quando reestabelecida a conexão).
