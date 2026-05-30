<img style="width:100%" src="https://capsule-render.vercel.app/api?type=waving&color=1C2434&section=header" />

<div align="center">
  <h2>🎓 MATRIZ DE ENGENHARIA DE TESTES E PLANO DE ARQUITETURA 🎓</h2>
  <h3>🚀 AgroPet Lambari — Da Teoria de Domínio à Prática de 100% de Cobertura</h3>
  
  <p>Este documento formaliza as decisões arquiteturais e o plano mestre de testes e refatoração do ecossistema mobile <b>AgroPet Lambari</b>. É projetado para servir como um artefato acadêmico de alta relevância, apresentando as soluções de concorrência de banco, modularização de componentes e mitigação de modelos de domínio anêmicos.</p>
</div>

<div align="center">

[![Status](https://img.shields.io/badge/Status-Planejado-blue?style=for-the-badge&logo=github-actions&logoColor=white)]()
[![SI CEFET-MG](https://img.shields.io/badge/SI-CEFET--MG-orange?style=for-the-badge&logo=education&logoColor=white)]()
[![Cobertura Alvo](https://img.shields.io/badge/Coverage-100%25-brightgreen?style=for-the-badge&logo=jest&logoColor=white)]()

</div>

---

## 💡 1. Introdução: O Desafio de Negócio e Complexidade

O **AgroPet Lambari** não é um aplicativo simples de formulários. Trata-se de um ecossistema mobile distribuído composto por dois aplicativos nativos isolados (**Cliente** e **Admin**), que operam sobre três pilares avançados de engenharia de software:

1. **Offline-First com Cache Local Síncrono**: Gerenciamento local de carrinho e catálogo via **SQLite** (`expo-sqlite`) com sincronização tardia tolerante a falhas de rede.
2. **Concorrência ACID Bloqueante**: Prevenção de *Oversell* no checkout de estoque crítico processado via PostgreSQL na nuvem do **Supabase** usando bloqueio pessimista (`SELECT FOR UPDATE`).
3. **Logística Reativa**: Rastreamento GPS do entregador em tempo real atualizado via **WebSockets** (Supabase Realtime) e suavizado com interpolação vetorial na UI.

---

## 🧠 2. Superando o "Modelo de Domínio Anêmico"

Um dos maiores alertas em arquiteturas orientadas a DDD (Domain-Driven Design) é o **Modelo de Domínio Anêmico**. Isso ocorre quando as classes/entidades de domínio servem apenas como meros recipientes de dados (getters/setters ou tipos vazios) e toda a lógica de negócios é "sequestrada" pelas telas (views) ou controladores de forma desorganizada.

### 🔴 O Cenário Anêmico (Sem Proteção):
Sem testes automatizados e com lógica de validação dispersa em componentes visuais gigantes, qualquer alteração futura no Supabase ou no fluxo de checkout pode gerar efeitos colaterais catastróficos, quebrando o funcionamento silenciosamente.

### 🟢 A Solução: Domínio Rico + Testes com 100% de Cobertura (Padrão `caio_prova3`):
A arquitetura proposta migra a inteligência para módulos utilitários e serviços testados isoladamente. Adotamos o rigor técnico da suíte **`caio_prova3`**:
- **Testes com 100% de Coverage**: Cobertura de 100% de linhas, ramificações (branches) e funções, cobrindo todos os fluxos felizes e de erro (incluindo falhas de GPS, RLS e concorrência).
- **Mocks Nativos Premium**: Uso de espionagem de chamadas (`jest.spyOn`) e simulação de componentes nativos interativos (como a câmera e o SQLite local) para garantir que a UI seja auditada em cenários de estresse.

---

## 🛠️ 3. O Plano de Refatoração: Meta de 500 Linhas por Arquivo

Conforme o feedback acadêmico de seu orientador, telas com milhares de linhas (como os 2500+ linhas do `AdminDashboardScreen.tsx`) elevam a complexidade ciclomática e o débito técnico de manutenção. A refatoração visa quebrar estas telas seguindo o padrão de **Componentização e Separação de Conceitos (SoC)**, mantendo a interface e a reatividade visual 100% intocadas.

### 📐 Estrutura de Decomposição Proposta:

```
┌────────────────────────────────────────────────────────────────────────┐
│               AdminDashboardScreen.tsx (Main Hub)                      │
│               - Gerencia apenas a orquestração e navegação             │
└───────────────────────────┬────────────────────────────────────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
┌─────────────────┐┌─────────────────┐┌─────────────────┐
│   useCaixa.ts   ││   usePDV.ts     ││  Custom UI Comp │
│  (Custom Hook)  ││  (Custom Hook)  ││ (Dumb/Present)  │
│ - Lógica Sangria││ - Estado do PDV ││ - CaixaCard.tsx │
│ - Chamadas API  ││ - Métricas PDV  ││ - PDVModal.tsx  │
└─────────────────┘└─────────────────┘└─────────────────┘
```

1. **Custom Hooks de Lógica (`useCaixa.ts`, `usePDV.ts`)**:
   - Isolam todo o gerenciamento de estados (`useState`), chamadas assíncronas do Supabase, persistência com `SecureStore` e lógica financeira do caixa.
   - **Resultado**: A lógica pura se torna 100% testável via `@testing-library/react-hooks` sem precisar renderizar a interface de tela inteira.
2. **Componentes Burros/Apresentacionais (Dumb Components)**:
   - Componentes visuais focados puramente em renderização baseados em `props` (ex: `CaixaCard.tsx`, `BezierChart.tsx`, `PdvCartList.tsx`).
   - Fáceis de testar individualmente usando o React Native Testing Library.
3. **O Arquivo Principal (`AdminDashboardScreen.tsx`)**:
   - Atua apenas como o orquestrador (Hub), importando os hooks e os componentes e plugando-os juntos. O arquivo final cai de **2500 linhas para menos de 450 linhas**!

---

## 🎯 4. Matriz Mestre de Testes (Prioridade Crítica: 4 ➡️ 2 ➡️ 1 ➡️ 3)

Alinhados com a gravidade comercial do projeto, a suíte de testes do AgroPet Lambari priorizará as camadas de maior criticidade primeiro:

### 🌐 [Fase 1] - Banco de Dados, APIs e Regras de Segurança (Prioridade 4)
*Garantia absoluta de integridade transacional na nuvem.*

- **Teste 1: Concorrência e Lock de Linha (`rpc_finalizar_pedido`)**:
  - *Mecânica*: Disparar chamadas concorrentes assíncronas simultâneas (`Promise.allSettled`) para comprar o último item de estoque.
  - *Garantia*: Validar o bloqueio atômico de linha do postgres, forçando um pedido a retornar `200` e o concorrente `400` por falta de estoque.
- **Teste 2: Bypass de RLS Administrativo (`public.is_admin`)**:
  - *Mecânica*: Executar a checagem com privilégios limitados e garantir tempo de resposta < 50ms, auditando a total ausência de loops recursivos.
- **Teste 3: Isolamento de Vendas Físicas locais no Histórico**:
  - *Mecânica*: Chamar a API de histórico de vendas do Admin e certificar que a cláusula `.neq('delivery_address', 'Venda Física PDV')` impeça o vazamento de compras de balcão no relatório de clientes online.

---

### ⚙️ [Fase 2] - Testes Integrados de UI e Estados Reativos (Prioridade 2)
*Validação da experiência do usuário (UX) e do fluxo de navegação.*

- **Teste 4: Exclusão Mútua de Alertas de Estoque (`ManageProductsScreen.tsx`)**:
  - *Mecânica*: Usar `fireEvent.press` para simular o clique no filtro **Inativos** e verificar se o estado dos alertas amarelo e vermelho zera automaticamente. Em seguida, testar o fluxo inverso.
- **Teste 5: Ordenação por Gravidade de Alerta**:
  - *Mecânica*: Alimentar a tela com produtos sob alerta e testar se os produtos em **Alerta Vermelho** são injetados obrigatoriamente no topo da listagem.
- **Teste 6: Ações em Massa de Produtos**:
  - *Mecânica*: Acionar o botão "Selecionar Tudo", validar o estado dos checkboxes e testar se a modal de aviso vermelho destrutivo de exclusão é montada na UI.
- **Teste 7: Sincronização em Tempo Real de Frete Inativo (`ClientTabs.tsx`)**:
  - *Mecânica*: Simular evento de WebSocket indicando que o frete está inativo. Validar se a aba de Mapas é ocultada da navegação e se o checkout do carrinho é bloqueado.

---

### 🟨 [Fase 3] - Testes Unitários de Lógica Isolada (Prioridade 1)
*Garantia de exatidão em algoritmos matemáticos e utilitários puros.*

- **Teste 8: Feriados Nacionais e Contadores de Horário (`shopHours.ts`)**:
  - *Mecânica*: Testar o cálculo de feriados móveis brasileiros (Carnaval, Páscoa, Corpus Christi) e verificar se domingos inativos de fechamento alteram reativamente o status da loja para `isClosed = true`.
- **Teste 9: Reversão Automática de Intervalo Inválido**:
  - *Mecânica*: Tentar filtrar o faturamento em um feriado inativo e certificar que o estado de pesquisa reverte automaticamente para a última data válida anterior.
- **Teste 10: Parsers de imagem (`getFirstImageUrl`)**:
  - *Mecânica*: Testar a conversão segura e o fallback de imagens legadas (string pura) e modernas (JSON stringified) sem quebras.

---

### 📱 [Fase 4] - Testes Nativos, Timers e Armazenamento (Prioridade 3)
*Auditoria de concorrência com o ecossistema do celular.*

- **Teste 11: Purga do SecureStore (`agropet_sangrias`)**:
  - *Mecânica*: Alimentar a chave no SecureStore com transações contendo o tipo legado `'venda'` e testar se a rotina de carregamento higieniza a gaveta física local, retendo apenas sangrias/suprimentos manuais.
- **Teste 12: Loop Infinito e Memory Leaks de Carrossel (`HomeScreen.tsx`)**:
  - *Mecânica*: Validar se o loop cross-fade de 5s de produtos multi-fotos é desmontado no `cleanup` do componente e que itens com foto única não iniciam temporizadores nativos.

---

## 📈 5. Conclusão Acadêmica

Ao unir o rigor técnico e a cobertura de 100% da suíte de testes de alta fidelidade com um plano robusto de refatoração para componentização (SoC), o **AgroPet Lambari** se consolida como um **projeto exemplar em nível acadêmico de graduação**. Ele prova que complexidade de e-commerce e robustez de arquitetura corporativa podem ser implementados e securizados com sucesso absoluto no ambiente mobile!

---

<div align="center">
  <sub>© 2026 Caio Magalhães. Desenvolvido para a AgroPet Lambari. Todos os direitos reservados.</sub>
</div>
