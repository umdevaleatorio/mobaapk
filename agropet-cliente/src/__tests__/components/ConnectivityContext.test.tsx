import React, { useContext } from 'react';
import { render, act } from '@testing-library/react-native';
import { Text, View } from 'react-native';
import { ConnectivityProvider, useConnectivity } from '../../presentation/contexts/ConnectivityContext';

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
}));

jest.mock('../../data/datasources/sqlite/database', () => ({
  initDB: jest.fn().mockResolvedValue({}),
}));

const mockSync = jest.fn();
jest.mock('../../data/datasources/sqlite/syncQueue', () => ({
  SyncQueueService: class {
    synchronize = mockSync;
  },
  ProductCacheService: class {},
  OrdersCacheService: class {},
}));

import NetInfo from '@react-native-community/netinfo';
const mockAddEventListener = NetInfo.addEventListener as jest.Mock;

function ConnectivityConsumer() {
  const { isOnline, connectionType, syncQueueService, productCacheService, ordersCacheService } = useConnectivity();
  return (
    <View>
      <Text testID="online-status">{isOnline ? 'online' : 'offline'}</Text>
      <Text testID="connection-type">{connectionType ?? 'unknown'}</Text>
      <Text testID="has-sync-queue">{syncQueueService ? 'yes' : 'no'}</Text>
      <Text testID="has-product-cache">{productCacheService ? 'yes' : 'no'}</Text>
      <Text testID="has-orders-cache">{ordersCacheService ? 'yes' : 'no'}</Text>
    </View>
  );
}

describe('ConnectivityContext', () => {
  let unsubscribeMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    unsubscribeMock = jest.fn();
    mockAddEventListener.mockReturnValue(unsubscribeMock);
  });

  it('should render with default values when no provider is used', () => {
    const { getByTestId } = render(
      <ConnectivityConsumer />
    );
    expect(getByTestId('online-status').props.children).toBe('online');
    expect(getByTestId('connection-type').props.children).toBe('unknown');
    expect(getByTestId('has-sync-queue').props.children).toBe('no');
    expect(getByTestId('has-product-cache').props.children).toBe('no');
    expect(getByTestId('has-orders-cache').props.children).toBe('no');
  });

  it('should initialize services and provide context values', async () => {
    const { getByTestId } = render(
      <ConnectivityProvider>
        <ConnectivityConsumer />
      </ConnectivityProvider>
    );

    await act(async () => {});

    const { initDB } = require('../../data/datasources/sqlite/database');
    expect(initDB).toHaveBeenCalled();
    expect(getByTestId('has-sync-queue').props.children).toBe('yes');
    expect(getByTestId('has-product-cache').props.children).toBe('yes');
    expect(getByTestId('has-orders-cache').props.children).toBe('yes');
    expect(getByTestId('connection-type').props.children).toBe('unknown');
  });

  function getListener(): (state: any) => void {
    // The useEffect re-runs after syncQueueService is set (second call)
    return mockAddEventListener.mock.calls[mockAddEventListener.mock.calls.length - 1][0];
  }

  it('should listen to NetInfo changes and update online status', async () => {
    render(
      <ConnectivityProvider>
        <ConnectivityConsumer />
      </ConnectivityProvider>
    );

    await act(async () => {});

    expect(mockAddEventListener).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should clean up NetInfo listener on unmount', async () => {
    const { unmount } = render(
      <ConnectivityProvider>
        <ConnectivityConsumer />
      </ConnectivityProvider>
    );

    await act(async () => {});

    unmount();

    expect(unsubscribeMock).toHaveBeenCalled();
  });

  it('should set offline state when isConnected is false', async () => {
    const { getByTestId } = render(
      <ConnectivityProvider>
        <ConnectivityConsumer />
      </ConnectivityProvider>
    );

    await act(async () => {});

    await act(async () => {
      getListener()({ isConnected: false, type: 'cellular' });
    });

    expect(getByTestId('online-status').props.children).toBe('offline');
    expect(getByTestId('connection-type').props.children).toBe('cellular');
  });

  it('should trigger sync when coming back online after being offline', async () => {
    render(
      <ConnectivityProvider>
        <ConnectivityConsumer />
      </ConnectivityProvider>
    );

    await act(async () => {});

    await act(async () => {
      getListener()({ isConnected: false, type: 'none' });
    });

    expect(mockSync).not.toHaveBeenCalled();

    await act(async () => {
      getListener()({ isConnected: true, type: 'wifi' });
    });

    expect(mockSync).toHaveBeenCalledWith(true);
  });

  it('should NOT trigger sync when staying online', async () => {
    render(
      <ConnectivityProvider>
        <ConnectivityConsumer />
      </ConnectivityProvider>
    );

    await act(async () => {});

    await act(async () => {
      getListener()({ isConnected: true, type: 'ethernet' });
    });

    expect(mockSync).not.toHaveBeenCalled();
  });

  it('should default isConnected to true when state.isConnected is null', async () => {
    const { getByTestId } = render(
      <ConnectivityProvider>
        <ConnectivityConsumer />
      </ConnectivityProvider>
    );

    await act(async () => {});

    await act(async () => {
      getListener()({ isConnected: null, type: null });
    });

    expect(getByTestId('online-status').props.children).toBe('online');
    expect(getByTestId('connection-type').props.children).toBe('unknown');
  });
});
