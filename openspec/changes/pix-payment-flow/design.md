# Design: Fluxo de Pagamento PIX

## Banco de Dados

### Migration: `28. pix_payment_flow.sql`

#### 1. ALTER TYPE order_status
```sql
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'processing';
```

#### 2. ALTER TABLE store_settings
```sql
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS chave_pix TEXT DEFAULT '';
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS pix_merchant_name TEXT DEFAULT '';
```

#### 3. Tabela: `payment_transactions`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID PK | Identificador único |
| order_id | UUID FK → orders(id) | Pedido vinculado |
| payment_method | payment_method | Forma de pagamento |
| amount | DECIMAL(10,2) | Valor da transação |
| status | TEXT | 'pending', 'paid', 'failed' |
| gateway_tx_id | TEXT | ID externo (futuro gateway) |
| paid_at | TIMESTAMPTZ | Quando foi pago |
| created_at | TIMESTAMPTZ | Momento da criação |

#### 4. RPC: `get_pix_key()`
Retorna `{ chave_pix, pix_merchant_name }` da store_settings.

#### 5. RPC: `check_pix_status(p_order_id UUID)`
Retorna status atual da transação PIX.

#### 6. RPC: `confirm_pix_payment(p_order_id UUID)`
Marca transaction como `paid`, atualiza order status para `confirmed`.

#### 7. Atualizar `finalizar_pedido`
Se `payment_method = 'pix'`, criar order com status `'processing'` + `payment_transactions` com status `'pending'`.

## Frontend (Cliente)

### `usePaymentScreen.ts`
- Passar `payment_method` como route param para PaymentConfirmScreen

### `PaymentConfirmScreen.tsx`
- Se PIX: buscar chave PIX via `get_pix_key()`
- Exibir chave com botão "Copiar"
- Polling a cada 10s via `check_pix_status()`
- Botão "Já paguei" → chama `confirm_pix_payment()`
- Se confirmação: redirecionar para OrdersScreen
- Se não-PIX: tela atual inalterada

## Frontend (Admin)

### `useAdminSettingsRadius.ts`
- Adicionar campos `chave_pix` e `pix_merchant_name`
- Salvar via upsert em `store_settings`

### `AdminSettingsScreen.tsx`
- Novo campo de texto "Chave PIX" no formulário de configurações
