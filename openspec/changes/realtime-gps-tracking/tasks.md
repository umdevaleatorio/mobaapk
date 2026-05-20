## 1. Banco de Dados e Infraestrutura do Supabase

- [ ] 1.1 Criar script de migração para a nova tabela `delivery_tracking` (order_id, latitude, longitude, updated_at) com políticas de RLS.
- [ ] 1.2 Ativar a replicação Realtime do Supabase na tabela `delivery_tracking` para permitir a escuta de atualizações via WebSocket.

## 2. Configurações de Permissões e Geolocalização (Admin App)

- [ ] 2.1 Configurar o arquivo `app.json` no `agropet-admin` com as permissões de geolocalização em primeiro e segundo plano (Android e iOS).
- [ ] 2.2 Inicializar a tabela local `pending_gps_logs` no SQLite local do `agropet-admin` para fins de persistência offline.
- [ ] 2.3 Implementar a inicialização do `TaskManager` e registro da tarefa de background de localização usando `expo-location`.

## 3. Testes e Lógica de Envio de GPS (TDD no Admin App)

- [ ] 3.1 Escrever caso de teste automatizado para validar o fluxo de gravação local em SQLite quando o dispositivo do entregador estiver offline.
- [ ] 3.2 Implementar a lógica de transmissão periódica do GPS ao Supabase e gravação local em SQLite caso falhe a conexão.
- [ ] 3.3 Escrever caso de teste para validar o reenvio (sincronização) das coordenadas acumuladas no SQLite local assim que a conexão de rede for restabelecida.
- [ ] 3.4 Implementar a rotina de envio em lote dos logs pendentes pós-reconexão com tratamento de erro.

## 4. Integração do Rastreamento Realtime (Client App)

- [ ] 4.1 Escrever teste simulando a assinatura no Supabase Realtime e recepção das coordenadas para verificar o fluxo de dados recebidos no cliente.
- [ ] 4.2 Modificar o `MapScreen.tsx` no `agropet-cliente` para conectar ao canal Realtime do Supabase associado à tabela `delivery_tracking` filtrado pelo pedido atual.
- [ ] 4.3 Substituir a simulação nativa no cliente pelo fluxo de coordenadas do Supabase, conectando a nova entrada de dados à interpolação suave (deslize) e catch-up rápida.
