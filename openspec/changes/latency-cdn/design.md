# Design: Latência e CDN

## Utilitário: `src/utils/imageUtils.ts`

### Funções

```typescript
// Centraliza o parsing de image_url (JSON array ou string única)
function getFirstImageUrl(url: string | null | undefined): string | null

// Retorna todas as URLs de um produto
function getAllImageUrls(url: string | null | undefined): string[]

// Aplica transformações CDN (Supabase Storage image transformations)
function getOptimizedImageUrl(url: string | null | undefined, options?: {
  width?: number;
  height?: number;
  format?: 'webp' | 'avif';
}): string | null

// Cache key para expo-image
function getImageSource(url: string | null | undefined, options?: {
  width?: number;
  height?: number;
}): { uri: string; cacheKey?: string }
```

### Cache policy
- `cachePolicy: 'disk'` — imagens persistidas em disco após primeiro download
- `contentFit: 'cover'` — consistente com layout atual

## Componentes alterados

### agropet-cliente (5 arquivos)
| Arquivo | Mudança |
|---------|---------|
| `CartScreen.tsx` | `Image` → `Image` (expo-image), importa `getFirstImageUrl` do utils |
| `HomeScreen.tsx` | `Animated.Image` → `Image` (expo-image com animação), importa `getAllImageUrls` do utils |
| `OrderCard.tsx` | `Image` → `Image` (expo-image), recebe URL já parseada |
| `OrderDetailScreen.tsx` | `Image` → `Image` (expo-image), importa `getFirstImageUrl` do utils |
| `ProductDetailScreen.tsx` | `Image` → `Image` (expo-image), importa parsers do utils |

### agropet-admin (5 arquivos)
| Arquivo | Mudança |
|---------|---------|
| `CheckoutModal.tsx` | `Image` → `Image` (expo-image), importa `getFirstImageUrl` do utils |
| `PDVSection.tsx` | `Image` → `Image` (expo-image), importa `getFirstImageUrl` do utils |
| `AdminOrderDetailScreen.tsx` | `Image` → `Image` (expo-image), importa `getFirstImageUrl` do utils |
| `AdminSalesHistoryScreen.tsx` | `Image` → `Image` (expo-image), importa `getFirstImageUrl` do utils |
| `ProductCard.tsx` | `Image` → `Image` (expo-image), importa `getFirstImageUrl` do utils |

### Hooks limpos (9 arquivos)
- Remover definições inline de `getFirstImageUrl`/`getAllImageUrls` onde não são mais usadas internamente
- Manter exports de compatibilidade quando outros arquivos importam desses hooks

## Flag: reuse artifact
- `latency-cdn`
