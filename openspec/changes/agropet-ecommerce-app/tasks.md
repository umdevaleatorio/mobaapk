# Tasks — AgroPet Lambari E-Commerce

As tarefas estão organizadas por **entregas da disciplina**, alinhadas com o cronograma de aulas.

---

## Entrega 1 — Estrutura, Navegação e Telas Base (até 24/mar)

- [ ] **T1.1** Inicializar os dois projetos Expo com TypeScript
  - `npx create-expo-app agropet-cliente --template blank-typescript`
  - `npx create-expo-app agropet-admin --template blank-typescript`
  - Configurar ESLint e Prettier para ambos

- [ ] **T1.2** Criar estrutura de pastas (Clean Architecture) duplicada ou compartilhada
  - **No `agropet-cliente`**: `src/domain/`, `src/data/`, `src/presentation/` (somente telas de cliente), `src/utils/`
  - **No `agropet-admin`**: `src/domain/`, `src/data/`, `src/presentation/` (somente telas de admin), `src/utils/`

- [ ] **T1.3** Implementar entidades do domínio
  - User, Product, Category, CartItem, Order, OrderItem, Competitor, StoreSettings

- [ ] **T1.4** Implementar value objects
  - Email, Price, Coordinates, DeliveryRadius, PaymentMethod

- [ ] **T1.5** Criar esqueleto dos use cases (interfaces)
  - Auth: Login, Register, CheckSession
  - Products: List, Get, Create, Update, Delete, Activate, Deactivate
  - Cart: Add, Remove, Update, Get, Clear
  - Orders: Create, List, ListClientOrders, UpdateStatus, Cancel
  - Sales: GetSalesHistory
  - Location: GetUserLocation, CheckDeliveryRadius
  - Settings: GetTheme, SetTheme, UpdateStoreSettings

- [ ] **T1.6** Configurar React Navigation nas duas aplicações
  - **AgroPet Cliente:**
    - AppNavigator (root) → SplashScreen
    - AuthStack (ClientLoginScreen, RegisterScreen)
    - ClientTabs (Home/Catálogo, Carrinho, Mapa, Perfil)
    - CheckoutStack (PaymentScreen → PaymentConfirmScreen)
  - **AgroPet Admin:**
    - AppNavigator (root)
    - AuthStack (AdminLoginScreen)
    - AdminDrawer (Menu Inicial Hub, Pedidos, Histórico, Produtos, Mapa, Perfil, Configurações)

- [ ] **T1.7** Criar telas placeholder distribuídas
  - **No Cliente (13):** Splash, ClientLoginScreen, RegisterScreen, HomeScreen, ProductDetailScreen, CartScreen, PaymentScreen, PaymentConfirmScreen, OrderHistoryScreen, OrderTrackingScreen, MapScreen, ProfileScreen, SettingsScreen
  - **No Admin (10):** AdminLoginScreen, AdminHomeScreen (Hub), OrdersScreen, SalesHistoryScreen, ManageProductsScreen, ProductCreateScreen, ProductEditScreen, AdminMapScreen, AdminProfileScreen, AdminSettingsScreen
  - Todas com componente básico + título
  - Navegação funcional em ambos os apps

- [ ] **T1.8** Configurar sistema de tema claro/escuro
  - Criar `lightTheme.ts` e `darkTheme.ts`
  - Criar `ThemeContext.tsx`
  - Criar componente `ThemeToggle.tsx`
  - Persistência da preferência no AsyncStorage

---

## Entrega 2 — Mapas e Geolocalização (até 24/abr)

- [ ] **T2.2** Geolocalização
  - Instalar expo-location
  - GetUserLocationUseCase: obter coordenadas do usuário
  - CheckDeliveryRadiusUseCase: calcular distância (Haversine) do centro de Lambari (-21.9686, -45.3464)
  - Regra: ≤ 17km = entrega local / > 17km = redirecionar ML ou retirada

- [ ] **T2.3** Mapa do Cliente
  - Instalar react-native-maps
  - MapScreen com marcadores (loja + concorrentes)
  - Exibição de pedidos em entrega
  - Tratamento de mapa sem permissão e sem internet

- [ ] **T2.4** Mapa do Admin
  - AdminMapScreen com marcadores (loja + concorrentes)
  - Exibição de entregas em andamento com marcadores
  - CRUD de concorrentes (cadastrar, editar, excluir)

---

## Entrega 3 — Supabase, Auth, Backend e Telas Funcionais (até 22/mai)

- [ ] **T3.1** Configurar Supabase
  - Criar projeto no Supabase
  - Configurar variáveis de ambiente
  - Instalar @supabase/supabase-js
  - Criar client.ts

- [ ] **T3.2** Criar tabelas no Supabase
  - users, categories, products, orders, order_items, order_messages, competitors, store_settings
  - Row Level Security (RLS) policies
  - Roles: client vs admin
  - Row Level Security (RLS) policies
  - Roles: client vs admin

- [ ] **T3.3** Autenticação Dividida (Supabase)
  - **No Cliente:** Login e Cadastro via Supabase Auth. Sem rota para admin.
  - **No Admin:** Apenas Login via Supabase Auth (simples, sem biometria). Restrito para role='admin'.
  - AuthContext com estado global isolado em cada app.
  - expo-secure-store configurado nos dois lados.

- [ ] **T3.4** Storage — Imagens de produtos
  - Bucket no Supabase Storage
  - Upload de imagem ao cadastrar produto (admin)
  - Exibição de imagens no catálogo

- [ ] **T3.5** Implementar repositories Supabase
  - SupabaseProductRepo: CRUD completo + ativar/desativar
  - SupabaseUserRepo: perfil, atualização
  - SupabaseOrderRepo: criar pedido, listar, atualizar status, cancelar, transição automática confirmed→preparing
  - SupabaseOrderMessageRepo: criar e listar mensagens de pedido
  - SupabaseCompetitorRepo: CRUD concorrentes
  - SupabaseStoreSettingsRepo: configurações da loja

- [ ] **T3.6** Contexts e Estado Global
  - CartContext: estado do carrinho + persistência no SQLite
  - AuthContext: autenticação e role
  - ThemeContext: tema claro/escuro

- [ ] **T3.7** Telas do Cliente (funcionais)
  - HomeScreen: catálogo com filtro por categoria e busca
  - ProductDetailScreen: detalhes + adicionar ao carrinho
  - CartScreen: itens, quantidades, valor total (persistido SQLite)
  - PaymentScreen: seleção de forma de pagamento (PIX/Dinheiro/Cartão) + frete + endereço
  - PaymentConfirmScreen: confirmação do pedido
    - Exibe mensagem de sucesso e instruções de realizar o pagamento escolhido na entrega.
  - OrderHistoryScreen: pedidos do cliente com status
  - OrderTrackingScreen: acompanhar pedido com timeline (confirmado→preparando→saiu→entregue), detalhes dos produtos com imagem/preço/quantidade, mensagens da loja
  - ProfileScreen: dados pessoais, editar perfil
  - SettingsScreen: tema, endereço padrão, notificações, logout

- [ ] **T3.8** Telas do Admin (funcionais)
  - AdminHomeScreen: hub de navegação simples para outras telas do admin (sem dashboard)
  - OrdersScreen: lista de pedidos + atualizar status + filtro + campos de mensagem (motivo + corpo)
    - Status auto: confirmed → preparing (automático)
    - Status manual: preparing → delivering (mensagem opcional) → completed
    - Cancelamento: mensagem com motivo obrigatório
  - SalesHistoryScreen: histórico de pedidos concluídos
  - ManageProductsScreen: lista todos os produtos para gerenciamento
  - ProductCreateScreen: formulário para adicionar novo produto
  - ProductEditScreen: formulário para editar produto existente
  - AdminProfileScreen: dados pessoais, editar
  - AdminSettingsScreen: tema, raio entrega, horário, logout

---

## Entrega 4 — Offline, Cache e APK (até 30/jun)

- [ ] **T4.1** SQLite — Banco local
  - Instalar expo-sqlite
  - Criar tabelas: products_cache, cart_items, orders_cache, user_preferences, sync_queue
  - SQLiteProductRepo para cache de produtos
  - SQLiteCartRepo para carrinho persistido
  - SQLiteOrderRepo para cache de pedidos

- [ ] **T4.2** Sincronização SQLite ↔ Supabase
  - Sync ao abrir o app (pull do Supabase → SQLite)
  - Detecção de modo offline (NetInfo)
  - Fila de operações para sync quando voltar online (sync_queue)
  - syncManager.ts: gerenciador de sincronização

- [ ] **T4.3** Imagens locais + cache
  - Cache de imagens dos produtos localmente
  - Salvar endereço do usuário no SQLite

- [ ] **T4.4** Comportamento Offline Automático
  - Acesso transparente ao SQLite (apenas leitura de cache quando sem conexão)
  - Não há "Tela" administrativa para forçar o Offline (funciona via status da rede em background)

- [ ] **T4.5** Indicador global de conectividade
  - OfflineBanner.tsx: banner persistente em todas as telas quando offline
  - Sync automático ao reconectar
  - Carrinho funcional offline

- [ ] **T4.6** SplashScreen funcional
  - Logo AgroPet Lambari (asset fornecido pelo usuário)
  - Verificação de sessão + redirecionamento
  - Comportamento offline (acesso limitado se tem sessão em cache)

- [ ] **T4.7** Gerar APK
  - Configurar app.json / eas.json
  - Build com EAS Build ou expo build:android
  - Testar instalação no celular

---

## Tarefas Contínuas

- [ ] **TC.1** Testes manuais em cada entrega
- [ ] **TC.2** Refinamento do UI/UX (tema claro/escuro, animações, responsividade)
- [ ] **TC.3** Cadastro das categorias e produtos reais (quando o dono fornecer os dados)
- [ ] **TC.4** Documentação do projeto para apresentação final (23/jun)
