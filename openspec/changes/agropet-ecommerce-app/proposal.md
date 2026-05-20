# AgroPet Lambari — E-Commerce Mobile App

## Resumo

Aplicativo mobile de e-commerce para uma loja de agropecuária e petshop localizada em **Lambari, MG**. O app permite que clientes naveguem pelo catálogo de produtos (agro + pet), adicionem ao carrinho (persistido localmente), façam pedidos informando a forma de pagamento desejada (**PIX**, **Dinheiro** ou **Cartão**) que será efetuada no momento da entrega, e recebam entregas dentro de um raio de **17km** da cidade. Para clientes fora do raio, o app redireciona para o anúncio no **Mercado Livre**.

O sistema é composto por **dois aplicativos isolados** (AgroPet Cliente e AgroPet Admin) consumindo o mesmo banco de dados. Isso garante máxima segurança, separando o código de compras sensível do código de painel gerencial da loja.

## Motivação

- Projeto acadêmico de desenvolvimento mobile (Expo/React Native)
- Cronograma de entregas da disciplina (março a julho 2026)
- Necessidade real de digitalizar as vendas de uma loja AgroPet

## Escopo

### Incluído

**Telas do Cliente (13 telas):**
- Tela de Splash (logo + verificação de sessão)
- Tela de cadastro
- Tela de login (cliente)
- Menu Inicial / Catálogo (com filtros e busca)
- Detalhes do Produto
- Carrinho (persistido no SQLite)
- Tela de Pagamento e Frete (PIX, Dinheiro, Cartão)
- Tela de Confirmação do Pedido (Mensagem de sucesso + orientações de pagamento na entrega)
- Acompanhar Pedido (timeline de status + detalhes com produtos/preços + mensagens da loja)
- Histórico de Pedidos
- Mapa/Geolocalização (loja, concorrentes, acompanhar entregas)
- Perfil do Usuário (com histórico de pedidos)
- Configurações (tema claro/escuro, endereço padrão, notificações)

**Telas do Admin (10 telas):**
- Login Adm (separada, acesso via role)
- Menu Inicial (Hub de Navegação, apenas atalhos)
- Maps (acompanhar entregas e gerir concorrentes)
- Configurações (ajustes e preferências da loja)
- Tela Ver Pedidos (gerenciar status dos pedidos)
- Histórico de Vendas (listagem de todas as vendas concluídas)
- Editar Produto Tela (Lista de todos os produtos do sistema para gerenciar)
- Registrar Produto (Adicionar novo)
- Editar Produto (Formulário do produto)
- Perfil Adm

**Funcionalidades transversais:**
- Login/cadastro de usuários (Supabase Auth)
- Geolocalização para entrega (raio 17km de Lambari)
- Redirecionamento para Mercado Livre (fora do raio)
- Mapa com localização de concorrentes (cadastro manual)
- Tema claro/escuro (para cliente e admin)
- Modo offline com SQLite (catálogo, carrinho, sincronização em cache automático sem tela)
- Geração de 2 APKs separados (AgroPet Cliente e AgroPet Admin)

### Funcionalidades Futuras (Para Próximas Versões / Backlog)
- Pagamento nativo no app via PIX com geração de QR Code e Leitor de Câmera.
- Autenticação de Admin através de Biometria / Reconhecimento Facial local.
- Painel de Vendas / Dashboard Administrativo com gráficos e cálculos de métricas avançados.

### Fora do Escopo
- Integração com API do Mercado Livre
- Reconhecimento facial via ML
- Sistema de frete com cálculo automático
- Gateway de pagamento real (cartão de crédito online)
- Chat/suporte em tempo real

## Público-alvo

- **Clientes**: Moradores de Lambari e região que compram produtos agropecuários e de petshop
- **Admin**: Dono/funcionário da loja que gerencia produtos e pedidos

## Tecnologias

| Componente | Tecnologia |
|-----------|-----------| 
| Framework | Expo / React Native |
| Backend | Supabase (Auth, Database, Storage) |
| DB Local | SQLite (expo-sqlite) |
| Mapas | react-native-maps + expo-location |
| Navegação | React Navigation (Stack, Tabs, Drawer) |
| Arquitetura | Clean Architecture / DDD |
| Armazenamento Seguro | expo-secure-store (tokens) |
| Tema | AsyncStorage ou SQLite (preferência claro/escuro) |
