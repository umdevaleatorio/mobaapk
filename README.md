<img style="width:100%" src="https://capsule-render.vercel.app/api?type=waving&color=E25822&section=header" />

<div align="center">
  <img src="assets/banner.svg" alt="AgroPet Lambari Banner" width="100%" />
</div>

<h1 align="center">
  <a href="https://git.io/typing-svg">
    <img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=600&size=19&pause=1000&color=E25822&width=750&height=50&lines=Seja+muito+bem-vindo+ao+meu+projeto+Agropet+Lambari%2C+Leitor%21" alt="Welcome Typing SVG" />
  </a>
</h1>

<div align="center">

[![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-1C1C1C?style=for-the-badge&logo=supabase&logoColor=3ECF8E)](https://supabase.com/)
[![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

</div>

---

# 🐾 AgroPet Lambari — E-Commerce Mobile Multi-App

Seja muito bem-vindo ao repositório do **AgroPet Lambari**, um ecossistema mobile avançado composto por **dois aplicativos isolados** (Cliente e Administrador) desenvolvidos com as melhores práticas de Engenharia de Software, arquitetura robusta e banco de dados de alto desempenho.

---

## 👨‍💻 Sobre o Desenvolvedor

<div align="justify">

Olá, Leitor! Meu nome é **Caio Magalhães**, tenho 21 anos e sou graduando em **Sistemas de Informação** no **CEFET-MG** (*Centro Federal de Educação Tecnológica de Minas Gerais*). Como um jovem desenvolvedor apaixonado por arquitetura de software, interfaces imersivas e desempenho mobile, o **AgroPet Lambari** representa o meu primeiro grande marco prático na consolidação de conceitos avançados como transações de banco de dados ACID, desenvolvimento de APIs robustas em tempo real, sincronização offline tolerante a falhas e separação estrita de privilégios.

Este projeto reflete minha dedicação em criar softwares que não apenas resolvam problemas práticos com excelência comercial, mas que também sigam padrões limpos de design, facilitando a manutenção e a escalabilidade técnica.

</div>

---

## 💡 Motivação e Características

O **AgroPet Lambari** é um projeto nascido de uma necessidade real de mercado: modernizar a gestão de vendas e o canal de atendimento de uma loja especializada em agropecuária e petshop na histórica cidade de **Lambari, MG**.

### 🌟 Destaques de Negócio
- **Público de Lambari e Região:** Os moradores podem adquirir rações, ferramentas e insumos com entrega ágil em domicílio.
- **Logística Integrada com Raio de 17km:** O aplicativo calcula dinamicamente a geolocalização do cliente. Clientes dentro de um raio de 17km do centro de Lambari podem usufruir da entrega rápida da loja.
- **Integração Externa (Mercado Livre):** Clientes localizados fora do raio limite de entrega da loja física são redirecionados automaticamente para anúncios do estabelecimento no **Mercado Livre**, expandindo a cobertura de vendas sem onerar a logística local.

---

## 🛠 Tech Stack

<table align="center">
   <tr>
      <td align="center">
         <img alt="TypeScript" height="35" width="45" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg" />
         <br /><sub>TypeScript</sub>
      </td>
      <td align="center">
         <img alt="React Native" height="35" width="45" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg" />
         <br /><sub>React Native</sub>
      </td>
      <td align="center">
         <img alt="Expo" height="35" width="45" src="https://www.vectorlogo.zone/logos/expoio/expoio-icon.svg" />
         <br /><sub>Expo</sub>
      </td>
   </tr>
   <tr>
      <td align="center">
         <img alt="Supabase" height="35" width="45" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/supabase/supabase-original.svg" />
         <br /><sub>Supabase</sub>
      </td>
      <td align="center">
         <img alt="SQLite" height="35" width="45" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/sqlite/sqlite-original.svg" />
         <br /><sub>SQLite</sub>
      </td>
      <td align="center">
         <img alt="PostgreSQL" height="35" width="45" src="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/postgresql/postgresql-original.svg" />
         <br /><sub>PostgreSQL</sub>
      </td>
   </tr>
   <tr>
      <td align="center">
         <img alt="HTML5" height="35" width="45" src="https://raw.githubusercontent.com/devicons/devicon/master/icons/html5/html5-original.svg" />
         <br /><sub>HTML5</sub>
      </td>
      <td align="center">
         <img alt="CSS3" height="35" width="45" src="https://raw.githubusercontent.com/devicons/devicon/master/icons/css3/css3-original.svg" />
         <br /><sub>CSS3</sub>
      </td>
      <td align="center">
         <img alt="JavaScript" height="35" width="45" src="https://raw.githubusercontent.com/devicons/devicon/master/icons/javascript/javascript-plain.svg" />
         <br /><sub>JavaScript</sub>
      </td>
   </tr>
</table>

---

## 📱 Estrutura do Ecossistema (Cliente vs Admin)

Para garantir máxima segurança operacional e separação estrita de escopo, o projeto compila **dois APKs totalmente distintos**, impedindo que vulnerabilidades no código do app de e-commerce possam expor dados de faturamento gerenciais da loja.

```mermaid
graph TD
    subgraph ClienteApp [AgroPet Cliente]
        A1[Splash & Login] --> A2[Catálogo de Produtos]
        A2 --> A3[Carrinho Local SQLite]
        A3 --> A4[Checkout Inteligente]
        A4 --> A5[Acompanhamento Realtime]
    end
    subgraph AdminApp [AgroPet Admin]
        B1[Acesso Restrito] --> B2[Gestão de Pedidos]
        B2 --> B3[Rastreamento de Entregas]
        B3 --> B4[Histórico & Ganhos]
        B4 --> B5[Cadastro/Edição de Produtos]
    end
    ClienteApp ---|Supabase RPC & Realtime| DB[(Banco de Dados Supabase)]
    AdminApp ---|Supabase RPC & Realtime| DB
```

### 🛍️ AgroPet Cliente (13 Telas)
O aplicativo do cliente foi desenhado com foco em conversão, UX de alta fluidez e resiliência a quedas de conexão:
- **Splash Screen Dinâmico:** Carregamento de marca com verificação assíncrona de sessão.
- **Acesso Integrado (Supabase Auth):** Fluxo de login e cadastro seguro de clientes.
- **Catálogo de Alta Performance:** Filtros rápidos, busca integrada e exibição de detalhes detalhados.
- **Carrinho Local (SQLite):** Persistência robusta que mantém as compras do cliente seguras mesmo com o aplicativo fechado ou em locais com falha de sinal de rede.
- **Checkout Dinâmico:** Opções para pagamento no ato da entrega (PIX, Cartão de Crédito/Débito e Dinheiro).
- **Acompanhar Pedido:** Uma timeline responsiva que exibe o status de envio em tempo real com dados da entrega.
- **Mapa e Geolocalização:** Visualização de rotas, endereços salvos e rastreamento ativo de entregadores.

### 🛡️ AgroPet Admin (10 Telas)
O centro operacional do lojista, focado na gestão rápida do estoque, processamento de pedidos e relatórios de receita:
- **Login Autenticado por Permissão (Role):** Segurança robusta bloqueando acessos não autorizados.
- **Painel de Controle Principal (Hub):** Atalhos rápidos para operações essenciais.
- **Mapa de Logística de Entrega:** Visualização das entregas em andamento e cadastro manual de coordenadas de concorrentes regionais para fins estratégicos.
- **Gerenciador de Pedidos Avançado:** Atualização em tempo real do status das encomendas.
- **Cadastro e Edição de Produtos:** Formulários dinâmicos com upload de imagens e gerenciamento de estoque integrado.

---

## 🛠️ Como o Projeto Funciona (Arquitetura Técnica)

O **AgroPet Lambari** adota conceitos de **Clean Architecture** e **DDD (Domain-Driven Design)**, promovendo baixo acoplamento e altíssima testabilidade. Três grandes pilares de engenharia se destacam no seu funcionamento interno:

### 1. Offline-First com Cache Síncrono (SQLite + Supabase)
A fim de contornar os problemas comuns de internet oscilante no interior de Minas Gerais, o aplicativo implementa uma estratégia robusta baseada em **SQLite (`expo-sqlite`)** para armazenar o catálogo de produtos de forma local. Desta forma:
- O catálogo de produtos é cacheado localmente e carregado instantaneamente.
- O carrinho de compras é totalmente operado offline, sincronizando seus dados de forma transacional e transparente com o **Supabase** apenas no momento da consolidação final do pedido.

### 2. Validação Atômica de Estoque no Checkout (Prevenção de Corrida)
Para solucionar o clássico problema concorrente de múltiplos clientes comprando o mesmo item físico de estoque reduzido ao mesmo tempo, a consolidação de compras é processada na camada de banco de dados do **Supabase** através de uma **Função RPC (`finalizar_pedido`)** escrita em PL/pgSQL:
- O sistema executa instruções `SELECT ... FOR UPDATE` travando as linhas dos respectivos produtos durante a transação.
- **Garantia ACID:** Caso o estoque total seja decrementado a zero antes de uma das solicitações, a transação correspondente sofre rollback e o app exibe uma mensagem de erro amigável.
- **Trigger de Auto-Desativação:** Um gatilho automático (`auto_deactivate_product`) desativa instantaneamente a exibição do produto no catálogo do cliente quando o estoque atinge zero, reativando-o assim que o estoque for reposto pelo administrador.

### 3. Rastreamento e Sincronização GPS em Tempo Real
A arquitetura de rastreamento do entregador utiliza a capacidade reativa do **Supabase Realtime**:
- O dispositivo do entregador (App Admin), sob permissões nativas de geolocalização (`expo-location` operando em segundo plano), grava dados na tabela transacional `delivery_tracking` em intervalos periódicos.
- O aplicativo cliente assina esse canal e recebe as coordenadas via WebSockets.
- Para evitar a sensação de "saltos" do carro no mapa decorrentes de oscilações de sinal, o app do cliente implementa técnicas de **interpolação e suavização gráfica** no componente de mapa (`react-native-maps`), entregando ao usuário final um rastreamento limpo e com deslizar contínuo.

---

## 🚀 Funcionalidades Futuras (Backlog de Inovação)

Novas e inovadoras mecânicas de comportamento visual e de negócios estão catalogadas para implementação nas próximas versões:

- **Pagamento Nativo por PIX:** Geração inteligente de QR Code *Copy and Paste* dinâmico com suporte para leitor via câmera no app do cliente.
- **Autenticação Biométrica:** Acesso facilitado e seguro ao painel administrativo por meio de FaceID ou impressão digital local (`expo-local-authentication`).


---

<img src="assets/updates-banner.svg?v=fresh-dog-final" width="500" alt="AgroPet Updates" />









## 🕹️ Histórico de Updates Realizados (Sprint de Inovação)

Compilamos abaixo a lista completa de mecânicas de ponta que foram totalmente implementadas e agregadas ao ecossistema do **AgroPet Lambari**:

### 📊 1. Seleção de Datas para Consulta de Ganhos
*   **Duplo Modo de Filtragem:** O administrador pode somar faturamento e auditar despesas por **Dia Único** ou **Período Personalizado**.
*   **In-Modal Date Picker Dashboard:** Painel inovador contendo duas linhas interativas de Início e Fim que abrem os pickers de forma independente, evitando overlaps e travamentos.
*   **Validação de Domingo/Feriados com Reversão Automática:** Se o admin selecionar um dia em que a loja esteve inativa, o app exibe uma tela branca informativa e reverte de forma automática e silenciosa a seleção para o último intervalo válido anterior.

### 🎛️ 2. Painel de Vendas / Caixa e Sangria
*   **Saldo Permanente Global:** O card de Caixa no topo atua de forma separada dos filtros do dashboard, acumulando todo o faturamento transacional e debitando todas as retiradas desde o início do aplicativo.
*   **Caixa com Gaveta Negativa:** As sangrias (despesas da loja) podem levar a gaveta de dinheiro físico ao negativo. Quando isso ocorre, o saldo do caixa e a bolinha do pulsar ativo de caixa mudam dinamicamente para **Vermelho Claro** (`#FF5252`), sinalizando déficit.
*   **Máscara de Valor Reativa:** O modal de sangria possui input numérico inteligente com máscara em tempo real em R$, persistido de forma segura via `SecureStore`.
*   **Gráfico SVG Dinâmico Verde Água:** Desenho completo e responsivo de curvas suavizadas (Bezier) usando `<Svg>` com preenchimento degradê **Verde Água** (`#00BFA5`).
*   **Métricas Segmentadas:** Ticket Médio customizado em verde registry (`#339914`) e Qtd. Pedidos em Verde Água (`#00BFA5`) no claro e marfim (`#FFE082`) no escuro.

### 🗂️ 3. Filtro Avançado e Alertas de Estoque Reativos
*   **Filtros Unificados e Modernizados:** Unificamos os filtros de controle de catálogo administrativo (*"Todos, Ativos e Inativos"*) em um botão dinâmico e consistente ao de relatórios de vendas.
*   **Detecção de Baixo Estoque:** Criamos uma subseção para visualizar produtos em **Alerta Amarelo** (atenção) e **Alerta Vermelho** (estoque crítico), adotando a mesma identidade visual e cores dos alertas individuais dos cards.
*   **Priorização com Exclusão Mutua:** O catálogo ordena e prioriza produtos críticos vermelhos no topo. Além disso, selecionar filtros de alertas anula e impede a seleção da categoria *Inativos* (e vice-versa), garantindo uma navegação coesa.

### ⚙️ 4. Seleção e Desativação em Massa de Produtos
*   **Operações em Bloco de Performance:** Implementamos um botão de **"Selecionar Tudo"** acoplado a um botão dinâmico de **"Desativar Todos"** (com design branco sofisticado e texto em vermelho, livre de bordas pesadas), simplificando a desativação simultânea de dezenas de itens.
*   **Alternância Inteligente de Controles:** O botão de desativar em bloco se transforma em **"Cancelar Seleção"** de forma silenciosa e fluida quando o modo de exclusão tradicional é ativado pelo lojista.
*   **Aviso Destrutivo em Tela Cheia:** Confirmações de desativação em lote exibem uma tela vermelha moderna de conformidade, garantindo a prevenção de erros acidentais do administrador por ser uma ação destrutiva.

### 🎠 5. Carrossel Multi-Fotos (Até 5) com Animação e Opacidade Flanqueada
*   **Upload de Múltiplas Mídias:** O administrador pode registrar até 5 fotos por produto, que são salvas de forma serializada no banco de dados.
*   **Visualização Clássica de Flanco (Admin & Cliente):** O carrossel principal exibe a imagem centralizada flanqueada por mini-prévias de opacidade reduzida (`opacity: 0.35`) da imagem anterior e seguinte, acoplados a controles em pílula escura direcional compacta.
*   **Animação Cross-Fade Catálogo Cliente:** No catálogo do cliente, o card de produtos com múltiplas fotos inicia um looping sutil de transição automática de imagens a cada **5 segundos**, esmaecendo e revelando sequencialmente as fotos para um visual extremamente dinâmico e interativo.
*   **fallback Estático Coeso:** Telas informativas secundárias (carrinho, histórico, recibo) renderizam estaticamente apenas a primeira foto fixa para otimizar foco e desempenho.

### ⚡ 6. Resolução de Timeouts RLS e Otimizações de Caixa e Histórico
*   **Fim de Gargalos de Supabase (Postgres 57014):** Removemos timeouts graves de recursão infinitas em RLS adicionando `SET row_security = off` e passando a posse de `public.is_admin()` para o usuário padrão `postgres`, otimizando checagens administrativas para **menos de 50ms**.
*   **Desvinculação Estrutural de Caixa e PDV:** Removemos as vendas físicas locais do Fluxo de Caixa ledger (que passa a exibir exclusivamente sangrias e suprimentos manuais), limpando e filtrando dados antigos automaticamente.
*   **Histórico de Pedidos de Clientes Puro:** Modificamos a tela de histórico de vendas do painel de controle administrativo para ocultar as vendas efetuadas localmente no PDV, mostrando estritamente os pedidos concluídos feitos online por clientes reais.

### 🧪 7. Maximização de Cobertura de Testes e Limpeza Arquitetural (NOVO!!!) — 29/05/2026
*   **100% Test Coverage nos Módulos de Domínio:** Injeção de testes unitários herméticos garantindo a prova de falhas em Domain Entities e Value Objects cruciais do sistema (Order, Product, StoreLocation, User, etc.).
*   **Edge Cases e Componentes Complexos:** Aperfeiçoamento dos testes do `AdminMapScreen` para cenários extremos (timeout assíncrono e tracking com duração nula) e mocking avançado do ecossistema de multi-fotos (câmera e galeria) em `ProductEditScreen`.
*   **Limpeza Arquitetural Absoluta:** Remoção rigorosa de artefatos de testes obsoletos e instâncias desnecessárias (arquivos *index.ts* vazios em use-cases) em ambos os aplicativos, reduzindo acoplamento e enxugando o peso da base de código.

---

## 🤝 Agradecimento

Muito obrigado por dedicar seu tempo para conhecer o meu projeto **AgroPet Lambari**! Este repositório reflete horas de estudo, refatoração de código e amor pelo desenvolvimento de software de alta fidelidade técnica. Fique à vontade para explorar os arquivos do repositório, propor melhorias no código ou entrar em contato para trocarmos experiências sobre Engenharia de Software e Tecnologias Mobile.

---

## 📞 Contato & Redes Sociais

Caso queira acompanhar minha jornada de desenvolvimento de perto, ver novidades sobre projetos ou discutir parcerias profissionais:

<div align="center">

<!-- Modern social links utilizing GitHub badges style -->
<a href="https://wa.me/5535998906096" target="_blank">
  <img src="https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="Caio Magalhães WhatsApp" style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin-right: 10px;" />
</a>
<a href="https://www.instagram.com/caio.json/" target="_blank">
  <img src="https://img.shields.io/badge/Instagram-caio.json-E4405F?style=for-the-badge&logo=instagram&logoColor=white" alt="Caio Magalhães Instagram" style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
</a>

</div>

---

<div align="center">
  <sub>© 2026 Caio Magalhães. Todos os direitos reservados. Projetado e construído com 💻, 🧠 e ☕ em Varginha, MG.</sub>
</div>

<img style="width:100%" src="https://capsule-render.vercel.app/api?type=waving&color=E25822&section=footer" />
