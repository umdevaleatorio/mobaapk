# Design: Validação Atômica de Estoque no Checkout

## Visão Geral da Arquitetura

```
  ┌──────────────────────────────────────────────────────────────┐
  │                     APP CLIENTE (React Native)               │
  │                                                              │
  │  PaymentScreen.tsx                                           │
  │  ┌────────────────────────────────────────────────────────┐  │
  │  │  handleCreateOrder()                                   │  │
  │  │    │                                                   │  │
  │  │    ├─ ANTES: INSERT orders + INSERT order_items        │  │
  │  │    │                                                   │  │
  │  │    └─ DEPOIS: supabase.rpc('finalizar_pedido', {       │  │
  │  │         p_user_id, p_items, p_payment_method,          │  │
  │  │         p_delivery_type                                │  │
  │  │       })                                               │  │
  │  │       │                                                │  │
  │  │       ├─ Sucesso → clearCart → PaymentConfirmScreen    │  │
  │  │       └─ Erro → Alert com detalhes do estoque          │  │
  │  └────────────────────────────────────────────────────────┘  │
  └──────────────────────────────────────────────────────────────┘
                              │
                              │ supabase.rpc()
                              ▼
  ┌──────────────────────────────────────────────────────────────┐
  │                     SUPABASE (PostgreSQL)                    │
  │                                                              │
  │  ┌────────────────────────────────────────────────────────┐  │
  │  │  FUNCTION finalizar_pedido(...)                        │  │
  │  │                                                        │  │
  │  │  BEGIN TRANSACTION                                     │  │
  │  │    │                                                   │  │
  │  │    ├─ SELECT stock FROM products                       │  │
  │  │    │  WHERE id IN (...) FOR UPDATE  ← TRAVA as linhas  │  │
  │  │    │                                                   │  │
  │  │    ├─ Valida: cada item.qty <= product.stock?          │  │
  │  │    │  └─ Se NÃO → RAISE EXCEPTION com detalhes        │  │
  │  │    │                                                   │  │
  │  │    ├─ UPDATE products SET stock = stock - qty           │  │
  │  │    │                                                   │  │
  │  │    ├─ INSERT INTO orders (...)                         │  │
  │  │    │                                                   │  │
  │  │    └─ INSERT INTO order_items (...)                    │  │
  │  │                                                        │  │
  │  │  COMMIT                                                │  │
  │  └────────────────────────────────────────────────────────┘  │
  │                                                              │
  │  ┌────────────────────────────────────────────────────────┐  │
  │  │  TRIGGER auto_deactivate_product                       │  │
  │  │                                                        │  │
  │  │  AFTER UPDATE ON products                              │  │
  │  │    │                                                   │  │
  │  │    ├─ Se NEW.stock = 0 → UPDATE active = false         │  │
  │  │    └─ Se NEW.stock > 0 AND OLD.stock = 0               │  │
  │  │         → UPDATE active = true                         │  │
  │  └────────────────────────────────────────────────────────┘  │
  └──────────────────────────────────────────────────────────────┘
```

## Decisões de Design

### 1. Por que RPC em vez de lógica no client?

A validação de estoque **precisa ser atômica** (tudo ou nada). Se fizermos `SELECT stock` no client e depois `UPDATE`, outro cliente pode comprar entre as duas operações. A função PostgreSQL com `FOR UPDATE` garante que apenas um cliente por vez processe um produto.

### 2. Por que trigger em vez de lógica na RPC?

Separar a auto-desativação em um trigger garante que **qualquer** alteração de estoque (RPC, admin manual, futuras integrações) dispare a mesma lógica. Princípio de responsabilidade única.

### 3. Tratamento de pedidos parciais

Se o carrinho tem 3 produtos e apenas 1 está sem estoque, o pedido inteiro é **rejeitado**. Isso é mais simples e evita confusão. O cliente ajusta o carrinho e tenta novamente.

> **Alternativa descartada:** Aprovar itens parcialmente. Isso exigiria lógica complexa de recalcular total, split de pedidos, e geraria confusão na tela de confirmação.

## Detalhes Técnicos

### Função RPC: `finalizar_pedido`

```sql
CREATE OR REPLACE FUNCTION public.finalizar_pedido(
  p_user_id UUID,
  p_items JSONB,        -- [{"product_id": "uuid", "quantity": 1, "unit_price": 29.90}, ...]
  p_payment_method payment_method,
  p_delivery_type TEXT DEFAULT 'retirada',
  p_delivery_address TEXT DEFAULT '',
  p_needs_change TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_item JSONB;
  v_product RECORD;
  v_total DECIMAL(10,2) := 0;
  v_insufficient JSONB := '[]'::JSONB;
BEGIN
  -- 1. Validar estoque de todos os itens (com trava)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT id, name, stock, active INTO v_product
    FROM public.products
    WHERE id = (v_item->>'product_id')::UUID
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Produto não encontrado: %', v_item->>'product_id';
    END IF;

    IF v_product.stock < (v_item->>'quantity')::INTEGER THEN
      v_insufficient := v_insufficient || jsonb_build_object(
        'product_id', v_product.id,
        'name', v_product.name,
        'requested', (v_item->>'quantity')::INTEGER,
        'available', v_product.stock
      );
    END IF;
  END LOOP;

  -- 2. Se algum item tem estoque insuficiente, abortar tudo
  IF jsonb_array_length(v_insufficient) > 0 THEN
    RAISE EXCEPTION 'ESTOQUE_INSUFICIENTE:%', v_insufficient::TEXT;
  END IF;

  -- 3. Calcular total
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_total := v_total + ((v_item->>'unit_price')::DECIMAL * (v_item->>'quantity')::INTEGER);
  END LOOP;

  -- 4. Criar o pedido
  INSERT INTO public.orders (user_id, status, total, delivery_type, payment_method, delivery_address, needs_change)
  VALUES (p_user_id, 'confirmed', v_total, p_delivery_type, p_payment_method, p_delivery_address, p_needs_change)
  RETURNING id INTO v_order_id;

  -- 5. Criar itens e decrementar estoque
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (order_id, product_id, quantity, unit_price)
    VALUES (
      v_order_id,
      (v_item->>'product_id')::UUID,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'unit_price')::DECIMAL
    );

    UPDATE public.products
    SET stock = stock - (v_item->>'quantity')::INTEGER
    WHERE id = (v_item->>'product_id')::UUID;
  END LOOP;

  -- 6. Retornar sucesso
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'total', v_total
  );
END;
$$;
```

### Trigger: `auto_deactivate_product`

```sql
CREATE OR REPLACE FUNCTION public.handle_stock_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Desativar quando estoque chega a 0
  IF NEW.stock = 0 AND NEW.active = true THEN
    NEW.active := false;
  END IF;

  -- Reativar quando estoque volta a ser positivo (reposição)
  IF NEW.stock > 0 AND OLD.stock = 0 AND NEW.active = false THEN
    NEW.active := true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_deactivate_product
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_stock_change();
```

> **Nota:** Usamos `BEFORE UPDATE` (não `AFTER`) para poder modificar `NEW.active` na mesma operação, sem precisar de um UPDATE adicional (evita recursão).

### Alteração no App Cliente: `PaymentScreen.tsx`

A função `handleCreateOrder` será refatorada de:

```typescript
// ANTES (atual)
const { data: orderData } = await supabase
  .from('orders')
  .insert({ ... })
  .select()
  .single();
// ... insert order_items
```

Para:

```typescript
// DEPOIS (novo)
const items = cart.map(item => ({
  product_id: item.id,
  quantity: item.quantity,
  unit_price: item.price
}));

const { data, error } = await supabase.rpc('finalizar_pedido', {
  p_user_id: user?.id,
  p_items: items,
  p_payment_method: dbPaymentMethod,
  p_delivery_type: 'retirada',
  p_delivery_address: '',
  p_needs_change: ''
});

if (error) {
  if (error.message.includes('ESTOQUE_INSUFICIENTE')) {
    // Parsear detalhes dos produtos sem estoque
    const detalhes = JSON.parse(error.message.split(':').slice(1).join(':'));
    const msgs = detalhes.map((d: any) =>
      `• ${d.name}: pedido ${d.requested}, disponível ${d.available}`
    );
    Alert.alert(
      'Estoque Insuficiente',
      `Alguns produtos não têm estoque suficiente:\n\n${msgs.join('\n')}\n\nAjuste as quantidades no carrinho.`
    );
  } else {
    Alert.alert('Erro ao Fazer Pedido', error.message);
  }
  return;
}

const orderId = data.order_id;
await clearCart();
navigation.replace('PaymentConfirmScreen', { orderId });
```

### Fluxo de Dados: Sincronização SQLite ↔ Supabase

O carrinho continua 100% local (SQLite). A sincronização com Supabase acontece apenas no momento do checkout:

```
  SQLite (local)                    Supabase (remoto)
  ┌──────────────┐                  ┌──────────────────┐
  │  Tabela cart  │                 │  Tabela products  │
  │  - id         │ ──checkout──→   │  - stock          │
  │  - quantity   │                 │  - active          │
  │  - price      │                 │                    │
  └──────────────┘                  │  Tabela orders     │
        │                           │  Tabela order_items│
        │                           └──────────────────┘
        │
        └── Dados locais são "rascunho"
            Fonte da verdade = Supabase
```

**Não há necessidade de sincronização bidirecional** — o SQLite é apenas cache do carrinho, e a validação real acontece no servidor.

### UI/UX: Fluxo de Navegação

O fluxo de navegação **não muda**. A única diferença é o que acontece ao pressionar "Fazer Pedido!":

```
  CartScreen ──→ PaymentScreen ──→ "Fazer Pedido!"
                                        │
                              ┌─────────┼──────────┐
                              │                     │
                         Sucesso ✅            Erro ❌
                              │                     │
                    PaymentConfirmScreen    Alert.alert(
                                            "Estoque Insuficiente",
                                            detalhes por produto
                                           )
                                                │
                                        Volta pro carrinho
                                        pra ajustar qtd
```

### Módulos Expo Envolvidos

Nenhum módulo Expo adicional é necessário. Esta mudança é puramente de lógica de negócio (banco + chamada de API).

### Permissões

Nenhuma permissão adicional de sistema/hardware necessária.

### Configurações Supabase

A função RPC precisa ser criada com `SECURITY DEFINER` para poder operar nas tabelas com RLS habilitado. Isso é seguro porque a função já recebe o `user_id` como parâmetro e opera apenas nos dados permitidos.
