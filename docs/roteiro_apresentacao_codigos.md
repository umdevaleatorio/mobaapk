# Roteiro de Mapeamento de Códigos para Apresentação
## Guia Rápido (Cola) para Demonstrar ao Professor — Parte 3 do Trabalho

Este guia serve de roteiro prático e rápido para você abrir na hora da apresentação e indicar exatamente onde cada parte do requisito exigido pelo professor está codificada no projeto **AgroPet Lambari**.

---

## 📸 1. CÂMERA (Hardware, Captura e Pipeline de Evidências)

*   ### A. Solicitação de Permissões de Hardware
    *   **Arquivo/Tela**: [SettingsScreen.tsx](mobaapk/agropet-cliente/src/presentation/screens/client/SettingsScreen.tsx#L348-L358)
    *   **Linhas**: 348 a 358
    *   **O que falar**: *"Aqui gerenciamos e solicitamos a permissão nativa de Câmera e Galeria do sistema operacional usando a biblioteca `expo-image-picker`."*

*   ### B. Captura da Foto e Armazenamento no Filesystem
    *   **Arquivo/Tela**: [ProfileScreen.tsx](mobaapk/agropet-cliente/src/presentation/screens/client/ProfileScreen.tsx#L590-L626)
    *   **Linhas**: 590 a 626
    *   **O que falar**: *"Neste trecho inicializamos a câmera física do aparelho (`launchCameraAsync`), tiramos a foto do perfil, o app salva o arquivo temporário no filesystem do celular e retorna a URI local (caminho físico) da imagem."*

*   ### C. Renderização na Interface (Apresentação)
    *   **Arquivo/Tela**: [ProfileScreen.tsx](mobaapk/agropet-cliente/src/presentation/screens/client/ProfileScreen.tsx#L641-L678)
    *   **Linhas**: 641 a 678
    *   **O que falar**: *"Aqui é a camada de **Apresentação (Interface)**: renderizamos o avatar circular do usuário. Se houver uma URI de foto local no estado, ela é exibida na interface nativa."*

---

## 📍 2. GEOLOCALIZAÇÃO E MAPAS (GPS, Geocoding e Rotas)

*   ### A. Solicitação de Permissão e Aquisição da Posição
    *   **Arquivo/Tela**: [SettingsScreen.tsx](mobaapk/agropet-cliente/src/presentation/screens/client/SettingsScreen.tsx#L360-L364)
    *   **Linhas**: 360 a 364
    *   **O que falar**: *"Requisitamos a permissão do sensor GPS do dispositivo móvel usando `expo-location`."*

*   ### B. Geocodificação (Geocoding) via Nominatim
    *   **Arquivo/Tela**: [ProfileScreen.tsx](mobaapk/agropet-cliente/src/presentation/screens/client/ProfileScreen.tsx#L233-L258)
    *   **Linhas**: 233 a 258
    *   **O que falar**: *"Consumimos de forma assíncrona a API REST do OpenStreetMap Nominatim para transformar o endereço digitado pelo usuário em coordenadas exatas de `latitude` e `longitude`."*

*   ### C. Cálculo de Rota (API OSRM) e Renderização Espacial
    *   **Arquivo/Tela**: [MapScreen.tsx](mobaapk/agropet-cliente/src/presentation/screens/client/MapScreen.tsx#L444-L508)
    *   **Linhas**: 444 a 508 e 723 a 785
    *   **O que falar**: *"Consumimos a API do roteador público OSRM para traçar as coordenadas geográficas da rota do veículo de entrega, saindo da loja física de Lambari-MG até a residência do cliente. Renderizamos no mapa usando a biblioteca `react-native-maps`."*

*   ### D. Simulação e Animação Física (Fiorino)
    *   **Arquivo/Tela**: [MapScreen.tsx](mobaapk/agropet-cliente/src/presentation/screens/client/MapScreen.tsx#L132-L284)
    *   **Linhas**: 132 a 284
    *   **O que falar**: *"Este é o componente visual do carrinho Fiorino. Implementamos micro-animações físicas de pulo e achatamento elástico (efeito clássico Squash and Stretch) usando a biblioteca de animação nativa do React Native sempre que o veículo muda de direção no mapa."*

---

## 💾 3. SQLITE (Modelagem Relacional, Cache e Offline-First)

*   ### A. Modelagem Relacional do Banco e WAL
    *   **Arquivo**: [database.ts](mobaapk/agropet-cliente/src/data/datasources/sqlite/database.ts#L3-L50)
    *   **Linhas**: 3 a 50
    *   **O que falar**: *"Esta é a **Modelagem de Dados Relacional** embarcada no aplicativo. Inicializamos o banco local SQLite com modo WAL (`Write-Ahead Logging`) e criamos as tabelas relacionais de carrinho (`cart`), cache de produtos catálogo (`products_cache`), cache de histórico de pedidos (`orders_cache`) e a fila de sincronização (`sync_queue`)."*

*   ### B. Operação Offline-first (Carrinho de Compras)
    *   **Arquivo**: [CartContext.tsx](mobaapk/agropet-cliente/src/presentation/contexts/CartContext.tsx#L45-L74)
    *   **Linhas**: 45 a 74
    *   **O que falar**: *"Implementação da **Operação Offline-first**: As transações de adicionar item, remover e limpar carrinho operam com consultas SQL diretas (`db.runAsync`) no banco local de forma imediata e resiliente."*

*   ### C. Recuperação de Estado (Cold Start)
    *   **Arquivo**: [CartContext.tsx](mobaapk/agropet-cliente/src/presentation/contexts/CartContext.tsx#L33-L38)
    *   **Linhas**: 33 a 38
    *   **O que falar**: *"Garante a **Recuperação de Estado**: Quando o aplicativo sofre um cold start (é iniciado do zero), o React recupera instantaneamente os dados armazenados no SQLite local e renderiza o carrinho salvo da última sessão."*

*   ### D. Sync Queue (Fila de Sincronização) e Cache de Produtos
    *   **Arquivo**: [syncQueue.ts](mobaapk/agropet-cliente/src/data/datasources/sqlite/syncQueue.ts)
    *   **O arquivo inteiro**
    *   **O que falar**: *"Este arquivo centraliza o **Sync Queue Pattern (Fila de Sincronização)** e o **Cache de Produtos**: se o usuário tentar enviar um pedido sem sinal de internet, a transação é enfileirada no banco SQLite local. Assim que o sensor de rede detecta internet, o `SyncQueueService` varre o SQLite e executa em background a sincronização das transações com o Supabase na nuvem."*
