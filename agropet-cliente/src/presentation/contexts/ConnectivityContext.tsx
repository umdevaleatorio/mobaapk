import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { initDB } from '../../data/datasources/sqlite/database';
import { SyncQueueService, ProductCacheService, OrdersCacheService } from '../../data/datasources/sqlite/syncQueue';

interface ConnectivityContextType {
  isOnline: boolean;
  connectionType: string | null;
  syncQueueService: SyncQueueService | null;
  productCacheService: ProductCacheService | null;
  ordersCacheService: OrdersCacheService | null;
}

const ConnectivityContext = createContext<ConnectivityContextType>({
  isOnline: true,
  connectionType: null,
  syncQueueService: null,
  productCacheService: null,
  ordersCacheService: null,
});

export function useConnectivity() {
  return useContext(ConnectivityContext);
}

export function ConnectivityProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [connectionType, setConnectionType] = useState<string | null>(null);
  const [syncQueueService, setSyncQueueService] = useState<SyncQueueService | null>(null);
  const [productCacheService, setProductCacheService] = useState<ProductCacheService | null>(null);
  const [ordersCacheService, setOrdersCacheService] = useState<OrdersCacheService | null>(null);
  const wasOffline = useRef(false);

  useEffect(() => {
    const setup = async () => {
      const db = await initDB();
      setSyncQueueService(new SyncQueueService(db));
      setProductCacheService(new ProductCacheService(db));
      setOrdersCacheService(new OrdersCacheService(db));
    };
    setup();
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected ?? true;
      setIsOnline(online);
      setConnectionType(state.type ?? null);

      if (wasOffline.current && online && syncQueueService) {
        syncQueueService.synchronize(true);
      }
      wasOffline.current = !online;
    });

    return () => unsubscribe();
  }, [syncQueueService]);

  return (
      <ConnectivityContext.Provider value={{ isOnline, connectionType, syncQueueService, productCacheService, ordersCacheService }}>
      {children}
    </ConnectivityContext.Provider>
  );
}
