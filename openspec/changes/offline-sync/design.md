# Design: Sincronização Offline

## ConnectivityContext
- Provider que envolve a árvore de componentes
- Usa `@react-native-community/netinfo` `addEventListener`
- Expõe `isOnline`, `connectionType`
- Na transição offline→online: chama `syncQueueService.synchronize(true)`
- Singleton `syncQueueService` e `productCacheService` inicializados com SQLite

## syncQueue.synchronize()
- Suporta INSERT, UPDATE, DELETE em qualquer tabela
- Conflito: last-write-wins com timestamp
- Log de erros sem travar a fila

## HomeScreen (produtos)
- Online: fetch do Supabase + salva em `products_cache`
- Offline: fallback para `ProductCacheService.getCachedProducts()`

## OrdersScreen (pedidos)
- Online: fetch do Supabase + salva em `orders_cache`
- Offline: fallback para cache local

## usePaymentScreen (pagamento)
- Se `finalizar_pedido` falhar (offline/erro): enfileira no sync_queue
- Próxima sincronização processa o pedido
