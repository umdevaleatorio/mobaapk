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
- **Dashboard Financeiro com Caixa e Sangria:**
  - Card topo exibindo o saldo em caixa sincronizado em tempo real.
  - Divisão horizontal interna exibindo separadamente os montantes de *Crédito*, *Débito*, *PIX* e *Dinheiro*.
  - Botão de **Sangria** para debitar despesas operacionais da loja manualmente, alterando o caixa na hora.
- **Visualização de Mapa Expandido:** Expansão dinâmica em tela cheia (ocultando barras do menu superior/inferior) ao rastrear entrega. Possui design de botões de controle de acordo com o tema:
  - **Tema Claro:** Botão *"Voltar"* azul escuro com texto e seta em branco no canto inferior esquerdo.
  - **Tema Escuro:** Botão *"Voltar"* soft dark com texto e seta em amarelo no mesmo posicionamento.
- **Gestão de Horários Especializada e Alerta Dinâmico:**
  - Suporte a escalas de horário de funcionamento: Dias úteis (08h às 18h), Sábados e Feriados (08h às 12h) e Domingos (Fechado).
  - Contador regressivo dinâmico inteligente no formato `{XX(dias) . XX(horas) . XX(minutos) . XX(segundos)}` para períodos de reabertura maiores de 24h.
  - Bloqueios transacionais de carrinho e rastreamento nos horários de fechamento.
  - Card de status do frete no catálogo em vermelho claro/texto vermelho médio quando inativo, e um belo card azul claro de comemoração ao ser reativado.
- **Histórico com Ganhos e Períodos Dinâmicos:**
  - Filtro administrativo para somar faturamento de intervalos inteiros (ex: dia 1 ao dia 12) modificando o card para *"Neste período:"*.
  - Renomeador inteligente de cabeçalhos de faturamento baseados no dia isolado selecionado: *"Hoje:"*, *"Ontem:"*, *"Anteontem:"* ou *"Neste dia:"*.
  - Modal branco especial informando faturamento nulo e travando seleção caso o admin selecione um domingo ou feriado de loja fechada.

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
