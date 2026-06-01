# Proposta: Latência e CDN

## Problema
Item #2 da auditoria: assets estáticos (imagens dos produtos) são carregados sem cache, sem CDN, e sem otimização. Cada vez que um usuário abre o catálogo ou lista de pedidos, as imagens são baixadas da rede do zero — mesmo em visitas repetidas. Não há cache em disco, não há transformação de imagem, e as funções de parsing de URL estão duplicadas em 9 arquivos.

## Solução
Três camadas de otimização:

1. **expo-image:** Substituir `Image` do `react-native` por `Image` do `expo-image` com `cachePolicy="disk"` — cache automático em disco reduz latência em visitas repetidas
2. **Utils centralizados:** Unificar `getFirstImageUrl`/`getAllImageUrls` em `src/utils/imageUtils.ts` (elimina 9 duplicações)
3. **CDN-ready:** Utilitário `getOptimizedImageUrl()` para aplicar transformações (formato WebP, resize) quando o Supabase Storage for adotado

## Integrações
- expo-image (SDK 54)
- Sem alteração de banco de dados
