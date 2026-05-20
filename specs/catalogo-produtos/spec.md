# Especificação — Catálogo de Produtos e Detalhes

## Tela Menu Inicial do Cliente (Catálogo)

### Cenário: Exibição do catálogo na Home
- **Dado** que o cliente está autenticado e na tela principal (Menu Inicial)
- **Quando** a tela carregar
- **Então** o sistema **MUST** exibir a lista de produtos ativos com nome, imagem, preço e categoria
- **E** os produtos **SHOULD** ser carregados do Supabase quando houver conexão
- **E** os produtos **MUST** ser exibidos a partir do cache local (SQLite) quando não houver conexão

### Cenário: Catálogo vazio
- **Dado** que não existem produtos cadastrados no sistema
- **Quando** o cliente acessar a tela principal
- **Então** o sistema **MUST** exibir uma mensagem amigável indicando que não há produtos disponíveis

---

## Filtro por Categoria

### Cenário: Filtrar por segmento (Pet / Agro)
- **Dado** que o catálogo possui produtos de ambos os segmentos
- **Quando** o cliente selecionar o filtro "Pet" ou "Agro"
- **Então** o sistema **MUST** exibir somente os produtos da categoria selecionada
- **E** os demais produtos **MUST NOT** aparecer na listagem

### Cenário: Filtrar por subcategoria
- **Dado** que existem subcategorias cadastradas (ex: "Rações", "Medicamentos")
- **Quando** o cliente selecionar uma subcategoria
- **Então** o sistema **MUST** exibir somente os produtos vinculados àquela subcategoria

### Cenário: Limpar filtro
- **Dado** que o cliente aplicou algum filtro de categoria
- **Quando** ele remover o filtro ou selecionar "Todos"
- **Então** o sistema **MUST** exibir todos os produtos ativos novamente

---

## Busca de Produtos

### Cenário: Busca por nome
- **Dado** que o cliente está na tela principal
- **Quando** ele digitar um termo no campo de busca
- **Então** o sistema **MUST** filtrar os produtos cujo nome contenha o termo digitado
- **E** a busca **SHOULD** ser responsiva (filtrar enquanto digita, sem necessidade de botão)

### Cenário: Busca sem resultados
- **Dado** que o termo digitado não corresponde a nenhum produto
- **Quando** a busca for executada
- **Então** o sistema **MUST** exibir mensagem "Nenhum produto encontrado"
- **E** **SHOULD** sugerir que o cliente tente outro termo ou limpe os filtros

---

## Tela de Detalhes do Produto

### Cenário: Visualizar detalhes do produto
- **Dado** que o cliente está no catálogo
- **Quando** ele tocar em um produto
- **Então** o sistema **MUST** navegar para a tela de Detalhes do Produto
- **E** **MUST** exibir: nome, imagem em tamanho maior, descrição completa, preço, estoque disponível e categoria

### Cenário: Produto com estoque disponível
- **Dado** que o produto possui estoque maior que zero
- **Quando** o cliente visualizar o detalhe
- **Então** o sistema **MUST** exibir o botão "Adicionar ao Carrinho" habilitado
- **E** ao tocar, **MUST** adicionar o produto ao carrinho (persistido no SQLite)
- **E** **MUST** exibir feedback visual de sucesso

### Cenário: Produto sem estoque
- **Dado** que o produto possui estoque igual a zero
- **Quando** o cliente visualizar o detalhe
- **Então** o sistema **MUST** exibir indicação visual de "Fora de estoque"
- **E** o botão "Adicionar ao carrinho" **MUST** estar desabilitado

### Cenário: Produto com link do Mercado Livre
- **Dado** que o produto possui URL do Mercado Livre cadastrada
- **Quando** o cliente visualizar o detalhe
- **Então** o sistema **SHOULD** exibir um botão/link "Comprar pelo Mercado Livre"
- **E** ao tocar, **MUST** abrir o link no navegador do dispositivo
