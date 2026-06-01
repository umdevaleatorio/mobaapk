# Proposta: Sincronização Offline

## Problema
Item #15 da auditoria: SyncQueueService e ProductCacheService existem mas nunca são usados. Sem detecção de conectividade, sem fallback offline para catálogo/pedidos, sem enfileiramento de operações offline.

## Solução
1. `@react-native-community/netinfo` para detectar conectividade
2. `ConnectivityContext` — provider que monitora online/offline e aciona sync automático
3. Completar `synchronize()` para UPDATE/DELETE + todas as tabelas
4. Cache offline de produtos (HomeScreen)
5. Cache offline de pedidos (OrdersScreen)
6. Enfileirar pedidos com falha (usePaymentScreen)

## Integrações
- Banco de dados (SQLite já existe)
- Conexão (NetInfo)
- Catálogo, Pedidos, Pagamento
