# Especificação — Carrinho, Pagamento, Frete e Confirmação

## Tela do Carrinho

### Cenário: Adicionar produto ao carrinho
- **Dado** que o cliente está na tela de detalhes de um produto com estoque disponível
- **Quando** ele tocar em "Adicionar ao carrinho"
- **Então** o sistema **MUST** adicionar o produto ao carrinho com quantidade 1
- **E** **MUST** persistir o item no banco de dados local (SQLite)
- **E** **MUST** exibir feedback visual confirmando a adição (toast ou badge atualizado no ícone do carrinho)
- **E** o carrinho **MUST** sobreviver ao fechamento e reabertura do app

### Cenário: Adicionar produto que já está no carrinho
- **Dado** que o produto já existe no carrinho
- **Quando** o cliente tentar adicioná-lo novamente
- **Então** o sistema **MUST** incrementar a quantidade daquele item em 1
- **E** **MUST** atualizar o registro no SQLite
- **E** **MUST NOT** duplicar o item na lista do carrinho

### Cenário: Alterar quantidade no carrinho
- **Dado** que o cliente está na tela do carrinho
- **Quando** ele alterar a quantidade de um item (aumentar ou diminuir)
- **Então** o sistema **MUST** recalcular o subtotal do item e o valor total do carrinho
- **E** **MUST** persistir a nova quantidade no SQLite
- **E** a quantidade **MUST NOT** ser inferior a 1 (para remover, usar botão específico)

### Cenário: Quantidade excede estoque
- **Dado** que o cliente tenta definir uma quantidade maior do que o estoque disponível
- **Quando** ele tentar incrementar além do limite
- **Então** o sistema **MUST** impedir o incremento
- **E** **MUST** exibir mensagem informando o estoque máximo disponível

### Cenário: Remover item do carrinho
- **Dado** que o cliente está na tela do carrinho
- **Quando** ele acionar a remoção de um item (swipe ou botão de remover)
- **Então** o sistema **MUST** remover o item da lista e do SQLite
- **E** **MUST** recalcular o valor total do carrinho
- **E** **SHOULD** solicitar confirmação antes de remover

### Cenário: Carrinho vazio
- **Dado** que o carrinho não possui itens
- **Quando** o cliente acessar a tela do carrinho
- **Então** o sistema **MUST** exibir mensagem "Seu carrinho está vazio"
- **E** **SHOULD** exibir botão para navegar ao catálogo
- **E** o botão de "Ir para pagamento" **MUST** estar desabilitado

### Cenário: Carrinho persistido após fechar o app
- **Dado** que o cliente adicionou itens ao carrinho e fechou o app
- **Quando** ele reabrir o app e navegar até o carrinho
- **Então** o sistema **MUST** carregar os itens do carrinho a partir do SQLite
- **E** **SHOULD** verificar se os preços/estoque atualizaram (se online) e notificar caso haja mudanças

### Cenário: Navegar para pagamento e frete
- **Dado** que o carrinho possui itens
- **Quando** o cliente tocar em "Ir para pagamento" ou "Finalizar compra"
- **Então** o sistema **MUST** navegar para a Tela de Pagamento e Frete

---

## Tela de Pagamento e Frete

### Cenário: Exibição das opções de entrega — dentro do raio
- **Dado** que o cliente está na tela de pagamento e frete
- **E** a localização do cliente está dentro do raio de 17km de Lambari
- **Quando** a tela carregar
- **Então** o sistema **MUST** exibir as opções de entrega: "Entrega no endereço" e "Retirar na loja"
- **E** **MUST** solicitar ou confirmar o endereço de entrega (pré-preenchido do perfil se disponível)

### Cenário: Exibição das opções de entrega — fora do raio
- **Dado** que a localização do cliente está fora do raio de 17km de Lambari
- **Quando** a tela de pagamento e frete carregar
- **Então** o sistema **MUST** informar que entrega local não está disponível
- **E** **MUST** exibir as opções: "Retirar na loja" ou "Comprar pelo Mercado Livre"
- **E** **MUST NOT** permitir selecionar entrega no endereço

### Cenário: Sem localização determinada
- **Dado** que o sistema não conseguiu obter a localização do cliente
- **Quando** a tela de pagamento e frete carregar
- **Então** o sistema **SHOULD** exibir "Retirar na loja" como padrão
- **E** **SHOULD** oferecer opção de inserir o endereço manualmente para verificar o raio

### Cenário: Escolher Pagamento via PIX
- **Dado** que o cliente está na tela de pagamento e frete
- **Quando** ele selecionar a forma de pagamento "PIX"
- **Então** o sistema **MUST** destacar visualmente a opção PIX como selecionada
- **E** **MUST** informar que o QR Code e o código Copia e Cola serão gerados na próxima tela

### Cenário: Escolher Pagamento via Dinheiro
- **Dado** que o cliente está na tela de pagamento e frete
- **Quando** ele selecionar a forma de pagamento "Dinheiro"
- **Então** o sistema **MUST** destacar visualmente a opção Dinheiro como selecionada
- **E** **SHOULD** exibir campo opcional "Precisa de troco para quanto?"
- **E** **MUST NOT** gerar QR Code nem código PIX

### Cenário: Escolher Pagamento via Cartão (Crédito/Débito)
- **Dado** que o cliente está na tela de pagamento e frete
- **Quando** ele selecionar a forma de pagamento "Cartão de Crédito" ou "Cartão de Débito"
- **Então** o sistema **MUST** destacar visualmente a opção selecionada
- **E** **MUST** informar que o pagamento será realizado na entrega/retirada com a maquininha
- **E** **MUST NOT** gerar QR Code nem código PIX

### Cenário: Resumo do pedido na tela de pagamento
- **Dado** que o cliente está na tela de pagamento e frete
- **Quando** a tela carregar
- **Então** o sistema **MUST** exibir o resumo dos itens do carrinho (nome, quantidade, subtotal)
- **E** **MUST** exibir o valor total do pedido
- **E** **MUST** exibir a forma de entrega selecionada

### Cenário: Confirmar pedido com PIX
- **Dado** que o cliente selecionou PIX e preencheu dados de entrega
- **Quando** ele tocar em "Confirmar Pedido"
- **Então** o sistema **MUST** criar o pedido com status "pending" e forma de pagamento "pix" no Supabase
- **E** **MUST** gerar o QR Code PIX (padrão EMV/BRCode) com o valor total
- **E** **MUST** navegar para a Tela de Confirmação do Pagamento exibindo o QR Code + código Copia e Cola

### Cenário: Confirmar pedido com Dinheiro
- **Dado** que o cliente selecionou Dinheiro e preencheu dados de entrega
- **Quando** ele tocar em "Confirmar Pedido"
- **Então** o sistema **MUST** criar o pedido com status "pending" e forma de pagamento "dinheiro" no Supabase
- **E** **MUST** navegar para a Tela de Confirmação do Pagamento (sem QR Code)

### Cenário: Confirmar pedido com Cartão
- **Dado** que o cliente selecionou Cartão (Crédito ou Débito) e preencheu dados de entrega
- **Quando** ele tocar em "Confirmar Pedido"
- **Então** o sistema **MUST** criar o pedido com status "pending" e forma de pagamento "cartao_credito" ou "cartao_debito" no Supabase
- **E** **MUST** navegar para a Tela de Confirmação do Pagamento (sem QR Code)

### Cenário: Confirmar pedido sem conexão com a internet
- **Dado** que o cliente está sem conexão com a internet
- **Quando** ele tentar confirmar o pedido
- **Então** o sistema **MUST** informar que é necessária conexão para realizar o pedido
- **E** **SHOULD** salvar os dados do checkout localmente para tentativa futura

---

## Tela de Confirmação do Pagamento

### Cenário: Confirmação com PIX — Exibição de QR Code e Código
- **Dado** que o pedido foi criado com sucesso com forma de pagamento PIX
- **Quando** a tela de confirmação carregar
- **Então** o sistema **MUST** exibir mensagem "Pedido realizado com sucesso!"
- **E** **MUST** exibir o QR Code PIX para escaneamento (caso o cliente tenha outro dispositivo)
- **E** **MUST** exibir o código PIX Copia e Cola logo abaixo do QR Code (para quando o cliente está usando apenas um celular)
- **E** **MUST** exibir botão "Copiar Código PIX"
- **E** **MUST** exibir o valor total do pedido e os dados do recebedor (loja AgroPet Lambari)
- **E** **MUST** exibir instrução: "Copie o código e cole no app do seu banco para pagar"

### Cenário: Ação de Copiar Código PIX
- **Dado** que o QR Code e o botão de copiar estão visíveis
- **Quando** o cliente tocar em "Copiar Código PIX"
- **Então** o sistema **MUST** copiar a linha digitável do PIX (payload EMV) para a área de transferência
- **E** **MUST** exibir notificação (Toast): "Código PIX copiado! Cole no app do seu banco para pagar."
- **E** o sistema **SHOULD** oferecer opção de abrir o app do banco (via deep link genérico, se possível)

### Cenário: Confirmação com Dinheiro
- **Dado** que o pedido foi criado com sucesso com forma de pagamento Dinheiro
- **Quando** a tela de confirmação carregar
- **Então** o sistema **MUST** exibir mensagem "Pedido realizado com sucesso!"
- **E** **MUST** exibir instrução: "O pagamento será realizado em dinheiro na entrega/retirada"
- **E** **MUST** exibir o número do pedido, resumo dos itens e valor total
- **E** **MUST NOT** exibir QR Code ou código PIX

### Cenário: Confirmação com Cartão
- **Dado** que o pedido foi criado com sucesso com forma de pagamento Cartão
- **Quando** a tela de confirmação carregar
- **Então** o sistema **MUST** exibir mensagem "Pedido realizado com sucesso!"
- **E** **MUST** exibir instrução: "O pagamento será realizado com cartão na maquininha na entrega/retirada"
- **E** **MUST** exibir o tipo de cartão selecionado (Crédito ou Débito)
- **E** **MUST** exibir o número do pedido, resumo dos itens e valor total
- **E** **MUST NOT** exibir QR Code ou código PIX

### Cenário: Limpar carrinho após confirmação
- **Dado** que o pedido foi confirmado com sucesso (qualquer forma de pagamento)
- **Quando** a tela de confirmação for exibida
- **Então** o sistema **MUST** limpar os itens do carrinho no SQLite
- **E** o carrinho **MUST** estar vazio ao retornar para a tela do catálogo

### Cenário: Navegar após confirmação
- **Dado** que o cliente está na tela de confirmação do pagamento
- **Quando** ele tocar em "Voltar ao Catálogo" ou "Ver meus pedidos"
- **Então** o sistema **MUST** navegar para a tela correspondente
- **E** **MUST NOT** permitir voltar à tela de checkout (evitar pedido duplicado)
