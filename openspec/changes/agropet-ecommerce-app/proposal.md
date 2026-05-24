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
- Geração de 2 APKs separados (AgroPet Cliente e AgroPet Admin)

### Funcionalidades Concluídas (Antecipadas do Backlog)
- **Desativação Dinâmica do Frete (Controle Admin):** Possibilidade de o admin desativar o frete no painel, alterando o comportamento do aplicativo do cliente:
  - O mapa ficará oculto para o cliente, exibindo apenas os três ícones na barra de navegação inferior (Início/Casinha, Carrinho e Opções/Configurações).
  - **Card de Aviso de Frete Dinâmico (Tela de Catálogo do Cliente):**
    - **Frete Inativo:** Exibição permanente de um aviso abaixo do cabeçalho com texto em vermelho equilibrado sobre um card de fundo vermelho claro para contraste: *"Aviso: O frete encontra-se desativado no momento. Nesse período, você não conseguirá ver o mapa, rastrear pedido e nem prosseguir com a compra, mas você pode salvar suas compras no carrinho até ele voltar. Obrigado pela compreensão. Voltaremos em breve!"*
    - **Frete Reativado (Primeiro Acesso):** Card de fundo azul claro com texto em azul equilibrado: *"O frete foi reativado, Uhuu 🥳! Você pode voltar a comprar, ver o mapa e rastrear sua entrega"*.
  - Bloqueio de finalização de compras no carrinho com a mensagem de erro: *"Não é possível prosseguir com a compra. O frete encontra-se inativo no momento."*
  - Exibição de mensagem informativa de rastreamento: *"Não é possível Rastrear o pedido no momento pois o frete encontra-se inativo"* ao tentar rastrear.
  - Ao preencher o endereço no perfil, as informações serão registradas localmente/no banco com sucesso, exibindo o aviso: *"Suas informações foram registradas com sucesso! Porém não é possível registrar sua localização no mapa pois o frete encontra-se inativo no momento. Quando voltarmos da manutenção do veículo, você já terá todas as funcionalidades do mapa ativo. Não se preocupe! Voltaremos em breve!"*
- **Visualização de Mapa Expandido ao Rastrear:** Ao clicar em rastrear nas telas de detalhes do pedido (tanto para o cliente quanto para o admin), o mapa se expandirá para tela cheia (sem barra superior e sem barra de navegação inferior):
  - Exibição em tela cheia apenas da rota com o ícone de carro, a mensagem *"Em rota"* na parte superior, a legenda e o botão de centralizar/mirar.
  - Exibição de um único botão posicionado no **canto inferior esquerdo**: um botão com uma seta apontada para a esquerda e o texto *"Voltar"*.
  - **Design do botão conforme o tema:**
    - **Tema Claro:** Botão azul escuro com texto e seta em branco.
    - **Tema Escuro:** Botão *soft dark* com texto e seta em amarelo (na mesma tonalidade da cor do botão "Ver produtos").
- **Saudações Dinâmicas Contextuais (Dia/Noite):** Sistema de saudações personalizado conforme o horário local:
  - **Dia (06:00 às 17:59):** Exibição de *"Bom dia, {nome da pessoa}!"* (cliente) ou *"Bom dia, {nome do admin}!"* (admin).
  - **Noite (18:00 às 05:59):** Exibição de *"Boa noite, {nome da pessoa}!"* (cliente) ou *"Boa noite, {nome do admin}!"* (admin).
  - **Persistência e Descarte:** Botão `X` com micro-interação animada de rotação (180º) e escala que permite fechar a barra, persistindo o estado `'false'` via `SecureStore` (chave `'show_greeting_bar'`).
  - **Controle Total (Toggles):** Adição da opção "Saudação e Horário" nas configurações do cliente e admin (exatamente entre Notificação e Permissão) para gerenciar persistência com switches animados.
- **Gestão de Horário de Funcionamento e Alertas Dinâmicos:**
  - **Diferenciação de Horários de Funcionamento:**
    - Dias úteis (Segunda a Sexta): das **08:00 às 18:00**.
    - Sábados e Feriados: das **08:00 às 12:00 (meio-dia)**.
    - Domingos: Fechado o dia todo.
  - **Contador Regressivo Dinâmico (Cliente e Admin):** Exibido na tela inicial de catálogo e painel administrativo (com opção de desativar).
    - **Contador com Campo de Dias:** Quando o período até a reabertura for maior que 24 horas (como aos domingos e feriados, ou após o meio-dia de sábado até a manhã de segunda), o formato exibido ganha o campo de dia: *"A loja abrirá em {XX(dias) . XX(horas) . XX(minutos) . XX(segundos)}"*. (Ex: *01 dia . 20 horas . 00 minutos . 00 segundos*).
    - **Com a loja fechada (Cliente):** Exibe no catálogo o prefixo dinâmico *"Atualmente estamos fechados. A loja abrirá..."*. O cliente pode salvar produtos no carrinho, mas fica impedido de prosseguir com compras ou rastrear entregas.
      - Ao tentar prosseguir no carrinho ou rastrear em dias normais de fechamento: exibe mensagem de erro vermelha abaixo do botão (com sumiço em 5 segundos).
      - **Aos Domingos ou Feriados:** Ao tentar comprar no carrinho, exibe a mensagem de erro *"Você não pode fazer compras hoje pois é Domingo (ou Feriado)!"*. Ao tentar rastrear, exibe: *"Você não pode rastrear produtos hoje pois é Domingo (ou Feriado)"*.
      - **Aviso Permanente (Domingos e Feriados):** Exibição fixa abaixo do cabeçalho e acima do filtro na tela de catálogo de um card vermelho claro com texto em vermelho equilibrado contendo: *"Hoje é domingo(ou feriado) dia XX (dia) - XX(mês) - XXXX(ano). Não abrimos hoje."*.
    - **Com a loja aberta:** Exibe o contador regressivo de fechamento *"A loja fechará em {XX(horas) . XX(minutos) . XX(segundos)}"*.

- **Relatório e Filtro Inteligente de Ganhos (Tela de Histórico de Vendas do Admin):**
  - **Filtro de Intervalo Personalizado (Selecionar data inteira):** Permite ao admin selecionar um período contínuo (ex: de dia 1 a dia 12). Desenvolvemos um **Painel de Controle Integrado no Modal (In-Modal Dashboard)** onde o admin seleciona as datas de Início e Fim clicando em linhas interativas independentes, o que evita conflitos ou overlaps de pickers nativos no Android/iOS. O sistema somará todo o faturamento do intervalo, detalhando os totais gerais e os valores individuais por forma de pagamento (crédito, débito, pix e dinheiro). O título do faturamento mudará para *"Neste período:"*.
  - **Títulos Dinâmicos por Seleção de Dia Único:**
    - **Dia atual selecionado:** Exibe o título *"Hoje:"* com o ganho e o detalhamento do dia.
    - **1 dia atrás selecionado:** Exibe o título *"Ontem:"* com os ganhos do respectivo dia.
    - **2 dias atrás selecionado:** Exibe o título *"Anteontem:"* com os ganhos do respectivo dia.
    - **3 ou mais dias atrás (ou dia avulso aleatório):** Exibe o título *"Neste dia:"* com os ganhos do dia selecionado.
  - **Tratamento de Domingos e Feriados:** Se o admin selecionar um dia que foi domingo ou feriado (quando a loja esteve fechada), o app exibirá um modal (*telinha branca*) informativo: *"Este dia foi domingo/feriado, portanto seus ganhos foram 0."* e reverterá automaticamente para a data ou período selecionado anteriormente.
  - **Acessibilidade e Polimento no Tema Claro:** Correção do contraste do seletor/botão "Selecionar data" em Tema Claro. Substituição do SVG de texto estático (que renderizava em branco) por um componente Text nativo e responsivo, adaptando sua cor de forma inteligente: azul escuro (#1C2434) em Tema Claro, mantendo paridade visual absoluta com a cor de cabeçalho "Hoje:", e branco puro (#FFFFFF) em Tema Escuro.
- **Painel de Vendas / Dashboard Administrativo com Caixa e Sangria:** Desenvolvimento de dashboard avançado para o administrador com gráficos de desempenho, cálculos de métricas de vendas e:
  - **Sistema de Caixa Independente (Visualização Global):** Card destacado mostrando o saldo total em caixa (atualizado automaticamente de forma global com todos os pedidos concluídos da história e abatimento de todas as sangrias). Abaixo do total (dentro do próprio card e separado por uma linha horizontal), exibição individual dos totais de saldo em *Cartão de Crédito*, *Cartão de Débito*, *PIX* e *Dinheiro*.
  - **Gaveta Negativa com Sinalização Visual:** O saldo físico de dinheiro pode ficar negativo e, se isso ocorrer, o valor do saldo e a bolinha do pulsar ativo de caixa mudam dinamicamente para vermelho claro (`#FF5252`), fornecendo alerta visual instantâneo de déficit.
  - **Sistema de Sangria Criptografado:** Lançamento de saques manuais com máscara monetária reativa em R$ e motivo do saque, persistidos localmente e de forma criptografada via `SecureStore` (chave `'agropet_sangrias'`).
  - **Gráfico SVG Dinâmico & Reativo:** Plotagem de curvas suaves (de alta e queda) usando `<Svg>` com preenchimento em degradê Verde Água (`#00BFA5`). O gráfico se ajusta reativamente ao filtro de data: exibe vendas a cada 2 horas no *Dia Único* e faturamento diário agrupado no *Período Personalizado*.
  - **Grade de Métricas Financeiras:** Ticket Médio (verde `#339914`), Volume de Pedidos (amarelo resumo `#FFE082` no escuro e verde água `#00BFA5` no claro) e Método Preferido de vendas no período filtrado.

### Funcionalidades Futuras (Para Próximas Versões / Backlog)
- Pagamento nativo no app via PIX com geração de QR Code e Leitor de Câmera.
- Autenticação de Admin através de Biometria / Reconhecimento Facial local.

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
