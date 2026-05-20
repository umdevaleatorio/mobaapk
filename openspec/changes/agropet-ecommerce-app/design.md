# Design — AgroPet Lambari

## Arquitetura Geral

O projeto segue **Clean Architecture** com **DDD (Domain-Driven Design)** conforme requisito da disciplina.

```
mobile-rep/
├── agropet-cliente/
│   ├── src/
│   │   ├── domain/ ... (Entities, Client UseCases)
│   │   ├── data/ ... (Supabase/SQLite repos)
│   │   ├── presentation/
│   │   │   ├── navigation/
│   │   │   │   ├── AppNavigator.tsx       # Root navigator (Splash → Auth ou Main)
│   │   │   │   ├── AuthStack.tsx          # ClientLoginScreen, RegisterScreen
│   │   │   │   ├── ClientTabs.tsx         # Bottom tabs (cliente)
│   │   │   │   └── CheckoutStack.tsx      # Pagamento → Confirmação
│   │   │   ├── screens/ ... (Telas do cliente 1 a 13)
│   │   │   └── components/ ... (Componentes do cliente)
│   │   └── utils/ ...
│
├── agropet-admin/
│   ├── src/
│   │   ├── domain/ ... (Entities, Admin UseCases)
│   │   ├── data/ ... (Supabase/SQLite repos)
│   │   ├── presentation/
│   │   │   ├── navigation/
│   │   │   │   ├── AppNavigator.tsx       # Root navigator
│   │   │   │   ├── AuthStack.tsx          # AdminLoginScreen
│   │   │   │   └── AdminDrawer.tsx        # Drawer (admin)
│   │   │   ├── screens/ ... (Telas do Admin 1 a 10)
│   │   │   └── components/ ... (Componentes do Admin)
│   │   └── utils/ ...
```

## Entidades do Domínio

### User
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | string (UUID) | ID do Supabase Auth |
| name | string | Nome completo |
| email | Email (VO) | E-mail validado |
| phone | string | Telefone |
| address | string | Endereço completo |
| city | string | Cidade |
| cep | string | CEP |
| coordinates | Coordinates (VO) | Lat/Lng |
| role | "client" \| "admin" | Papel no sistema |

### Product
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | string (UUID) | Identificador |
| name | string | Nome do produto |
| description | string | Descrição |
| price | Price (VO) | Preço em R$ |
| imageUrl | string | URL da imagem (Supabase Storage) |
| categoryId | string | FK para Category |
| stock | number | Quantidade em estoque |
| mercadoLivreUrl | string? | Link ML (opcional) |
| active | boolean | Se está ativo no catálogo |

### Category
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | string (UUID) | Identificador |
| name | string | Nome (ex: "Rações") |
| type | "pet" \| "agro" | Segmento |

### CartItem (Persistido no SQLite)
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | string | Identificador local |
| productId | string | FK para Product |
| productName | string | Nome (snapshot) |
| productPrice | Price (VO) | Preço (snapshot) |
| productImageUrl | string | Imagem (snapshot) |
| quantity | number | Quantidade |

### Order
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | string (UUID) | Identificador |
| userId | string | FK para User |
| status | "pending" \| "confirmed" \| "preparing" \| "delivering" \| "completed" \| "cancelled" | Status |
| total | Price (VO) | Valor total |
| deliveryType | "local" \| "pickup" \| "mercado_livre" | Tipo de entrega |
| paymentMethod | "pix" \| "dinheiro" \| "cartao_credito" \| "cartao_debito" | Forma de pagamento |
| deliveryAddress | string? | Endereço de entrega |
| coordinates | Coordinates? | Coordenadas da entrega |
| needsChange | string? | "Troco para quanto?" (quando dinheiro) |
| createdAt | Date | Data do pedido |
| updatedAt | Date | Data da última atualização de status |

### OrderItem
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | string | Identificador |
| orderId | string | FK para Order |
| productId | string | FK para Product |
| quantity | number | Quantidade |
| unitPrice | Price (VO) | Preço unitário no momento |

### Competitor
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | string | Identificador |
| name | string | Nome da loja |
| address | string | Endereço |
| coordinates | Coordinates (VO) | Lat/Lng |
| phone | string? | Telefone |

### OrderMessage
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | string (UUID) | Identificador |
| orderId | string | FK para Order |
| status | string | Status no momento da mensagem |
| reason | string | Motivo (ex: "Atraso na entrega", "Pagamento cancelado") |
| message | string | Corpo da mensagem ao cliente |
| createdAt | Date | Data/hora do envio |

### StoreSettings
| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | string | Identificador |
| deliveryRadiusKm | number | Raio de entrega (padrão 17km) |
| openingTime | string | Horário de abertura |
| closingTime | string | Horário de fechamento |

## Banco de Dados (Supabase)

```sql
-- Tabelas principais no Supabase (PostgreSQL)
users (id, name, email, phone, address, city, cep, lat, lng, role)
categories (id, name, type)
products (id, name, description, price, image_url, category_id, stock, mercado_livre_url, active)
orders (id, user_id, status, total, delivery_type, payment_method, delivery_address, lat, lng, needs_change, created_at, updated_at)
order_items (id, order_id, product_id, quantity, unit_price)
order_messages (id, order_id, status, reason, message, created_at)
competitors (id, name, address, lat, lng, phone)
store_settings (id, delivery_radius_km, opening_time, closing_time)
```

## Banco Local (SQLite)

```sql
-- Tabelas SQLite para cache e persistência local
products_cache (id, name, description, price, image_local_path, category_id, stock, active, synced_at)
cart_items (id, product_id, product_name, product_price, product_image_url, quantity)
orders_cache (id, user_id, status, total, payment_method, delivery_type, created_at, synced_at)
user_preferences (key, value)  -- tema, endereço padrão, etc.
sync_queue (id, operation, table_name, data_json, created_at)  -- fila offline
```

## Fluxo de Navegação (Dois Aplicativos Separados)

### APP 1: AgroPet Cliente
```text
App Start
  │
  └─▶ SplashScreen (logo AgroPet + verificação de sessão)
       │
       ├─ Sem sessão ──▶ AuthStack
       │                   ├── ClientLoginScreen
       │                   │     └── [link] → RegisterScreen
       │                   └── RegisterScreen
       │                         └── Cadastro → ClientTabs
       │
       └─ Com sessão de "client"
            │
            └─▶ ClientTabs (Bottom Tabs)
                 ├── 🏠 Home (Catálogo)
                 │     └── ProductDetailScreen → [Adicionar ao carrinho]
                 ├── 🛒 Carrinho
                 │     └── PaymentScreen (Pagamento + Frete)
                 │           ├── PIX → PaymentConfirmScreen (Instruções)
                 │           ├── Dinheiro → PaymentConfirmScreen (Instruções)
                 │           └── Cartão → PaymentConfirmScreen (Instruções)
                 ├── 🗺️ Mapa (loja, concorrentes, acompanhar entrega)
                 └── 👤 Perfil
                       ├── OrderHistoryScreen (Histórico de Pedidos)
                       │     └── OrderTrackingScreen (Acompanhar Pedido)
                       └── SettingsScreen (Configurações)
                             ├── Tema, Endereço e Logout

```

### APP 2: AgroPet Admin
```text
App Start
  │
  └─▶ SplashScreen (opcional)
       │
       ├─ Sem sessão ──▶ AdminLoginScreen (Acesso exclusivo)
       │
       └─ Com sessão de "admin"
            │
            └─▶ AdminDrawer (A partir do Menu Inicial de Hub)
                 ├── 📋 Tela Ver Pedidos (gerenciar status)
                 ├── 💰 Histórico de Vendas
                 ├── 📦 Editar Produto Tela (Listagem)
                 │     ├── Registrar Produto
                 │     └── Editar Produto
                 ├── 🗺️ Maps (entregas, concorrentes)
                 ├── 👤 Perfil Adm
                 └── ⚙️ Configurações
                       ├── Tema, Raio, Logout
```

## Geolocalização — Regra de Entrega

- Centro de Lambari: **-21.9686, -45.3464**
- Raio máximo: **17km** (configurável pelo admin)
- Cálculo via fórmula de Haversine
- Se `distância(user, centro) <= 17km` → entrega local disponível
- Se `distância > 17km` → mostrar opção "Retirar na loja" ou Mercado Livre

## Formas de Pagamento

| Método | Comportamento | Onde será pago |
|--------|--------------|----------|
| **PIX** | Cliente indica interesse. Pagamento via chave enviada ou QR impresso pelo motoboy. | Na entrega/retirada |
| **Dinheiro** | Registra intenção, informa troco se aplicável. | Na entrega/retirada |
| **Cartão Crédito** | Registra intenção. | Na entrega (na maquininha) |
| **Cartão Débito** | Registra intenção. | Na entrega (na maquininha) |

### Autenticação Dividida
Como temos 2 aplicativos físicos:
- **AgroPet Cliente:** Faz o login via Supabase. O banco de dados valida se a conta é do role `client`. Se um `admin` tentar acessar pelo app de cliente, ele será negado na própria API ou terá uma visão limpa de consumidor sem que as lógicas de admin estejam sequer no APK.
- **AgroPet Admin:** App exclusivo. A tela principal é sempre o *Login Adm*. O usuário preenche credenciais e a aplicação abre o Drawer Hub. Ninguém pode forçar a abertura de uma tela cliente por lá. Nenhuma biometria secundária é usada.

## Tema Claro/Escuro

- Disponível para **cliente e admin**
- Preferência salva localmente (AsyncStorage ou SQLite)
- `ThemeContext` global que aplica o tema em toda a interface
- Dois arquivos de tema: `lightTheme.ts` e `darkTheme.ts`

## Carrinho Persistido

- Itens do carrinho salvos no **SQLite** (não apenas em memória)
- Sobrevive ao fechamento do app
- Não é limpo após logout (o cliente pode voltar e encontrar seus itens)
- Limpo **somente** após confirmação de pedido com sucesso
