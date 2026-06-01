# Design: Proteção IDOR em RPCs

## Migration: `29. idor_authorization.sql`

### 1. `finalizar_pedido` — Adicionar guarda de ownership
```sql
IF auth.uid() IS NULL THEN
  RAISE EXCEPTION 'NAO_AUTENTICADO';
END IF;
IF auth.uid() != p_user_id THEN
  RAISE EXCEPTION 'ACESSO_NEGADO';
END IF;
```

### 2. `confirm_pix_payment` — Adicionar guarda de ownership ou admin
```sql
IF NOT EXISTS (
  SELECT 1 FROM orders WHERE id = p_order_id AND user_id = auth.uid()
) AND NOT public.is_admin() THEN
  RAISE EXCEPTION 'ACESSO_NEGADO';
END IF;
```

### 3. `check_pix_status` — Adicionar guarda de ownership ou admin
```sql
IF NOT EXISTS (
  SELECT 1 FROM orders WHERE id = p_order_id AND user_id = auth.uid()
) AND NOT public.is_admin() THEN
  RAISE EXCEPTION 'ACESSO_NEGADO';
END IF;
```

### 4. `check_rate_limit` — Usar `auth.uid()` internamente
- Remover parâmetro `p_user_id`
- Usar `auth.uid()` no WHERE e INSERT

### 5. `SET search_path = public` em todas as SECURITY DEFINER functions
Protege contra search-path injection.

## Frontend

### `rateLimitService.ts`
- Remover `p_user_id` da chamada ao RPC
