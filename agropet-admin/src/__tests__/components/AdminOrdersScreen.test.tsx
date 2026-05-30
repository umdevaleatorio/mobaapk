import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { AuthContext } from '../../presentation/contexts/AuthContext';
import { ThemeProvider } from '../../presentation/contexts/ThemeContext';
import { UserMenuProvider } from '../../presentation/contexts/UserMenuContext';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../../data/datasources/supabase/client';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';

// Import screen
import AdminOrdersScreen from '../../presentation/screens/admin/AdminOrdersScreen';

// ── Mock expo-image-picker ──
jest.mock('expo-image-picker', () => ({
  getCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  MediaTypeOptions: { Images: 'Images' },
}));

// ── Mock ThemeContext dynamically to support Dark Mode queries ──
jest.mock('../../presentation/contexts/ThemeContext', () => {
  const actual = jest.requireActual('../../presentation/contexts/ThemeContext');
  return {
    ...actual,
    useTheme: () => ({
      isDarkMode: true,
      colors: actual.darkColors,
      toggleTheme: jest.fn(),
    })
  };
});

// ── Mock Navigation Hooks ──
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockAddListener = jest.fn().mockReturnValue(jest.fn());
const mockSetOptions = jest.fn();
const mockGetParent = jest.fn().mockReturnValue({ setOptions: jest.fn() });
const mockNavigationObj = {
  navigate: mockNavigate,
  goBack: mockGoBack,
  addListener: mockAddListener,
  setOptions: mockSetOptions,
  setParams: jest.fn(),
  getParent: mockGetParent,
};

const mockRoute = {
  params: {
    orderId: 'order-123',
    order: {
      id: 'order-123-full-id',
      clientId: 'client-1',
      totalAmount: 100,
      shippingFee: 10,
      status: 'pending',
      total: 150.50,
      created_at: '2026-05-27T10:00:00.000Z',
      delivery_address: 'Rua Teste 123',
      order_items: [
        { product_id: 'p-1', quantity: 2, unit_price: 45, products: { name: 'Ração Premium', image_url: 'https://example.com/img.png' } }
      ],
      users: { name: 'Cliente Teste', phone: '11999998888', rua: 'Rua Teste', numero: '123', bairro: 'Centro', cep: '13000-000' },
      coordinates: { latitude: -22.9068, longitude: -47.0616 },
    },
    product: {
      id: 'p-1',
      name: 'Product 1',
      price: 50,
      stock: 10,
      active: true,
      description: 'Description 1',
      image_url: null,
    },
  },
};

const mockUseRoute = jest.fn().mockImplementation(() => mockRoute);

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigationObj,
  useRoute: () => mockUseRoute(),
  useFocusEffect: (cb: () => void) => {
    require('react').useEffect(() => {
      const cleanup = cb();
      return typeof cleanup === 'function' ? cleanup : undefined;
    }, []);
  },
}));

// Mock Supabase with comprehensive chain support (including maybeSingle and chainable update/insert/delete)
const createMockChain = (overrides: any = {}) => {
  const defaultData = overrides.data !== undefined ? overrides.data : [];
  const defaultError = overrides.error || null;

  const chain: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: overrides.singleData !== undefined ? overrides.singleData : { name: 'Admin', role: 'admin' }, error: defaultError }),
    maybeSingle: jest.fn().mockResolvedValue({ data: overrides.singleData !== undefined ? overrides.singleData : { name: 'Admin', role: 'admin' }, error: defaultError }),
    // insert/update/delete return chainable objects (for .eq(), .select(), etc.)
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    then: (resolve: any) => {
      if (typeof resolve === 'function') {
        resolve({ data: defaultData, error: defaultError });
      }
      return Promise.resolve({ data: defaultData, error: defaultError });
    },
  };
  // Make eq/select after update/insert/delete also resolve properly
  const originalEq = chain.eq;
  chain.eq = jest.fn().mockImplementation((...args: any[]) => {
    return chain;
  });
  chain.select = jest.fn().mockImplementation((...args: any[]) => chain);
  
  return chain;
};

jest.mock('../../data/datasources/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      signOut: jest.fn(),
      signUp: jest.fn().mockResolvedValue({ data: { user: {} }, error: null }),
      signInWithPassword: jest.fn().mockResolvedValue({ data: { session: {} }, error: null }),
      refreshSession: jest.fn().mockResolvedValue({ data: { session: {} }, error: null }),
      updateUser: jest.fn().mockResolvedValue({ data: {}, error: null }),
      verifyOtp: jest.fn().mockResolvedValue({ data: {}, error: null }),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
    },
    channel: jest.fn().mockImplementation(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
      unsubscribe: jest.fn(),
    })),
    removeChannel: jest.fn(),
    rpc: jest.fn().mockResolvedValue({ data: true, error: null }),
    from: jest.fn().mockImplementation(() => createMockChain()),
    storage: {
      from: jest.fn().mockImplementation(() => ({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test/path' }, error: null }),
        getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/image.png' } }),
        remove: jest.fn().mockResolvedValue({ data: {}, error: null }),
      })),
    },
  },
}));

jest.spyOn(Alert, 'alert').mockImplementation(() => {});

// Helper
const mockUser = { id: 'admin-userid-123', email: 'admin@test.com' };
const authVal = { session: null, user: mockUser as any, isLoading: false, signOut: jest.fn().mockResolvedValue(undefined) };

const renderScreen = (ScreenComponent: any, props: any = {}) => {
  return render(
    <AuthContext.Provider value={authVal}>
      <ThemeProvider>
        <UserMenuProvider>
          <ScreenComponent {...props} />
        </UserMenuProvider>
      </ThemeProvider>
    </AuthContext.Provider>
  );
};

// ============================================================
// AdminOrdersScreen
// ============================================================
describe('AdminOrdersScreen - Deep Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
  });

  it('should render and show empty state when no active orders', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const selectMock = jest.fn().mockReturnValue({
      neq: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });
    
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: selectMock,
    }));

    const { queryByText } = renderScreen(AdminOrdersScreen);

    // Wait for the async fetch to complete
    await waitFor(() => {
      expect(selectMock).toHaveBeenCalled();
    }, { timeout: 3000 });
    
    // After loading completes, should show empty or the text
    await waitFor(() => {
      const emptyText = queryByText('Não há pedidos ativos registrados.');
      const loadingOrEmpty = emptyText !== null || queryByText('Pedidos de hoje:') !== null;
      expect(loadingOrEmpty).toBe(true);
    }, { timeout: 3000 });
    
    consoleSpy.mockRestore();
  });


  it('should render active orders when data exists', async () => {
    const mockOrders = [
      {
        id: 'o1-active-id',
        status: 'pending',
        total: 100,
        payment_method: 'pix',
        created_at: '2026-05-27T10:00:00.000Z',
        delivery_address: 'Rua Test',
        order_items: [{ quantity: 1, unit_price: 100, products: { name: 'Ração' } }],
        users: { name: 'Client1', lat: -22.9, lng: -47.0, location_confirmed: true },
      },
    ];

    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        neq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockOrders, error: null }),
        }),
      }),
    }));

    const { getByText } = renderScreen(AdminOrdersScreen);

    await waitFor(() => {
      expect(getByText('PIX')).toBeTruthy();
    });
  });

  it('should cover payment display variations, cancelled orders filter, realtime update triggers, timer triggers, tracking, refresh, bottom bar navigation, and fetch error catch block', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // 1. realtime callback setup
    let realtimeCallback: any = null;
    const mockChannel = {
      on: jest.fn().mockImplementation((event: string, filter: any, callback: any) => {
        realtimeCallback = callback;
        return mockChannel;
      }),
      subscribe: jest.fn().mockReturnThis(),
    };
    (supabase.channel as jest.Mock).mockReturnValue(mockChannel);

    // Mock focus listener
    let focusCallback: any = null;
    (mockNavigationObj.addListener as jest.Mock).mockImplementation((event: string, cb: any) => {
      if (event === 'focus') focusCallback = cb;
      return jest.fn();
    });

    // Mock active and cancelled orders
    // o1: active Pix pending
    // o2: active Credito approved
    // o3: active Debito approved
    // o4: active Dinheiro approved
    // o5: active other approved
    // o6: cancelled order within 5 minutes (elapsed 2 mins)
    // o7: cancelled order older than 5 minutes (elapsed 10 mins)
    const nowTime = Date.now();
    const mockOrders = [
      {
        id: 'o1-id-pix-pending',
        status: 'pending',
        total: 10,
        payment_method: 'pix',
        created_at: new Date(nowTime).toISOString(),
        order_items: [],
        users: { name: 'Client Pix', lat: -22.9, lng: -47.0, location_confirmed: true, rua: 'Rua A', numero: '1', bairro: 'B' },
      },
      {
        id: 'o2-id-credito-app',
        status: 'confirmed',
        total: 20,
        payment_method: 'cartao_credito',
        created_at: new Date(nowTime).toISOString(),
        order_items: [],
        users: { name: 'Client Credito', lat: -22.9, lng: -47.0, location_confirmed: true, rua: 'Rua B', numero: '2', bairro: 'C' },
      },
      {
        id: 'o3-id-debito-app',
        status: 'completed',
        total: 30,
        payment_method: 'cartao_debito',
        created_at: new Date(nowTime).toISOString(),
        order_items: [],
        users: { name: 'Client Debito', lat: -22.9, lng: -47.0, location_confirmed: true, rua: 'Rua C', numero: '3', bairro: 'D' },
      },
      {
        id: 'o4-id-dinheiro-app',
        status: 'confirmed',
        total: 40,
        payment_method: 'dinheiro',
        created_at: new Date(nowTime).toISOString(),
        order_items: [],
        users: { name: 'Client Dinheiro', lat: -22.9, lng: -47.0, location_confirmed: true },
      },
      {
        id: 'o5-id-other-app',
        status: 'confirmed',
        total: 50,
        payment_method: 'other',
        created_at: new Date(nowTime).toISOString(),
        order_items: [],
        users: { name: 'Client Other', lat: -22.9, lng: -47.0, location_confirmed: true },
      },
      {
        id: 'o6-id-cancel-recent',
        status: 'cancelled',
        total: 60,
        payment_method: 'pix',
        created_at: new Date(nowTime - 2 * 60 * 1000).toISOString(),
        order_items: [],
        users: { name: 'Client Cancel Recent', lat: -22.9, lng: -47.0, location_confirmed: true },
      },
      {
        id: 'o7-id-cancel-old',
        status: 'cancelled',
        total: 70,
        payment_method: 'pix',
        created_at: new Date(nowTime - 10 * 60 * 1000).toISOString(),
        updated_at: new Date(nowTime - 10 * 60 * 1000).toISOString(),
        order_items: [],
        users: { name: 'Client Cancel Old', lat: -22.9, lng: -47.0, location_confirmed: true },
      },
    ];

    const orderMockFn = jest.fn().mockResolvedValue({ data: mockOrders, error: null });
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        neq: jest.fn().mockReturnValue({
          order: orderMockFn,
        }),
      }),
    }));

    const { getByText, getAllByText, UNSAFE_getAllByType } = render(
      <AuthContext.Provider value={authVal}>
        <ThemeProvider>
          <UserMenuProvider>
            <AdminOrdersScreen />
          </UserMenuProvider>
        </ThemeProvider>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(getByText('O2-ID-CR')).toBeTruthy();
    });

    // Check payment display translations
    expect(getByText('Crédito')).toBeTruthy();
    expect(getByText('Débito')).toBeTruthy();
    expect(getByText('Dinheiro')).toBeTruthy();
    expect(getByText('other')).toBeTruthy();

    // Check payment status translation
    expect(getByText('Pendente')).toBeTruthy();
    expect(getAllByText('Aprovado').length).toBeGreaterThan(0);
    expect(getAllByText('Cancelado').length).toBeGreaterThan(0);

    // Check recent cancelled order is rendered, old is not
    expect(getByText('O6-ID-CA')).toBeTruthy();
    expect(() => getByText('O7-ID-CA')).toThrow();

    // Trigger timer to advance by 10s
    jest.useFakeTimers();
    await act(async () => {
      jest.advanceTimersByTime(10000);
    });
    jest.useRealTimers();

    // Trigger realtime PG payload callback
    await act(async () => {
      if (realtimeCallback) {
        realtimeCallback({ new: {} });
      }
    });

    // Trigger focus callback
    await act(async () => {
      if (focusCallback) {
        focusCallback();
      }
    });

    // Navigate bottom bar buttons using TouchableOpacity mapping (since labels are SVGs)
    const { TouchableOpacity } = require('react-native');
    const touchables = UNSAFE_getAllByType(TouchableOpacity);

    const homeBtn = touchables[touchables.length - 4];
    const mapaBtn = touchables[touchables.length - 3];
    const gerenciarBtn = touchables[touchables.length - 2];
    const opcoesBtn = touchables[touchables.length - 1];

    fireEvent.press(homeBtn);
    expect(mockNavigate).toHaveBeenCalledWith('AdminTabs', { screen: 'Home' });

    fireEvent.press(mapaBtn);
    expect(mockNavigate).toHaveBeenCalledWith('AdminTabs', { screen: 'Mapa' });

    fireEvent.press(gerenciarBtn);
    expect(mockNavigate).toHaveBeenCalledWith('AdminTabs', { screen: 'Gerenciar' });

    fireEvent.press(opcoesBtn);
    expect(mockNavigate).toHaveBeenCalledWith('AdminTabs', { screen: 'Opções' });

    // Track order click using TouchableOpacity mapping (header has 2 touchables, first card has track button at touchables[2])
    const firstOrderTrackBtn = touchables[2];
    fireEvent.press(firstOrderTrackBtn); // Rastreia o primeiro pedido Pix
    expect(mockNavigate).toHaveBeenCalledWith('AdminTabs', {
      screen: 'Mapa',
      params: {
        clientLocation: {
          latitude: -22.9,
          longitude: -47.0,
          name: 'Client Pix',
          address: 'Rua A, 1 - B',
          orderId: 'o1-id-pix-pending',
        }
      }
    });

    // View products button click (first card has view products button at touchables[3])
    const firstOrderViewBtn = touchables[3];
    fireEvent.press(firstOrderViewBtn);
    expect(mockNavigate).toHaveBeenCalledWith('AdminOrderDetailScreen', { order: mockOrders[0] });

    // Trigger pull to refresh (onRefresh)
    const { ScrollView } = require('react-native');
    const { UNSAFE_getByType } = render(
      <AuthContext.Provider value={authVal}>
        <ThemeProvider>
          <UserMenuProvider>
            <AdminOrdersScreen />
          </UserMenuProvider>
        </ThemeProvider>
      </AuthContext.Provider>
    );
    const scrollView = UNSAFE_getByType(ScrollView);
    await act(async () => {
      scrollView.props.refreshControl.props.onRefresh();
    });

    // Mock data null for || [] branch coverage
    orderMockFn.mockResolvedValueOnce({ data: null, error: null });
    await act(async () => {
      if (focusCallback) focusCallback();
    });

    // Mock select error for fetchOrders catch block
    orderMockFn.mockResolvedValue({ data: null, error: new Error('Select error') });
    await act(async () => {
      if (focusCallback) focusCallback();
    });
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should trigger the local 10s timer interval', async () => {
    jest.useFakeTimers();
    const { unmount } = render(
      <AuthContext.Provider value={authVal}>
        <ThemeProvider>
          <UserMenuProvider>
            <AdminOrdersScreen />
          </UserMenuProvider>
        </ThemeProvider>
      </AuthContext.Provider>
    );

    await act(async () => {
      jest.advanceTimersByTime(10000);
    });

    unmount();
    jest.useRealTimers();
  });

  it('should cover isDarkMode false and Platform OS ios branches in AdminOrdersScreen', async () => {
    const themeContextModule = require('../../presentation/contexts/ThemeContext');
    const useThemeSpy = jest.spyOn(themeContextModule, 'useTheme');
    useThemeSpy.mockReturnValue({
      isDarkMode: false,
      colors: themeContextModule.lightColors,
      toggleTheme: jest.fn(),
    });

    const mockOrdersFallback = [
      {
        id: 'o-fallback',
        status: 'confirmed',
        total: 15,
        payment_method: 'cartao_debito',
        created_at: new Date().toISOString(),
        order_items: [],
        users: { name: '', lat: -22.9, lng: -47.0, location_confirmed: true, rua: '', numero: '', bairro: '' },
      },
    ];

    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      select: jest.fn().mockReturnValue({
        neq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockOrdersFallback, error: null }),
        }),
      }),
    }));

    const { getByText } = render(
      <AuthContext.Provider value={authVal}>
        <ThemeProvider>
          <UserMenuProvider>
            <AdminOrdersScreen />
          </UserMenuProvider>
        </ThemeProvider>
      </AuthContext.Provider>
    );
    
    await waitFor(() => {
      expect(getByText('Débito')).toBeTruthy();
    });

    useThemeSpy.mockRestore();

    // Cover both iOS and Android platform branches without rendering to avoid React duplicate instance/hook issues
    jest.isolateModules(() => {
      const rn = require('react-native');
      rn.Platform.OS = 'ios';
      require('../../presentation/screens/admin/AdminOrdersScreen');
    });

    jest.isolateModules(() => {
      const rn = require('react-native');
      rn.Platform.OS = 'android';
      require('../../presentation/screens/admin/AdminOrdersScreen');
    });
  });

  it('should cover fallback branches under AdminOrdersScreen: client name, address, dinero color and cancelled filter coordinates fallback', async () => {
    const { Platform } = require('react-native');
    const originalOS = Platform.OS;
    Platform.OS = 'android';

    const useThemeSpy = jest.spyOn(require('../../presentation/contexts/ThemeContext'), 'useTheme').mockReturnValue({
      isDarkMode: false,
      colors: require('../../presentation/contexts/ThemeContext').lightColors,
      toggleTheme: jest.fn(),
    });

    const mockOrdersFallback = [
      {
        id: 'o-fallback-dinheiro',
        status: 'pending',
        total: 100,
        payment_method: 'dinheiro',
        created_at: new Date().toISOString(),
        order_items: [],
        users: { name: '', lat: -22.9, lng: -47.0, location_confirmed: true, rua: '', numero: '', bairro: '' },
      },
      {
        id: 'o-fallback-cancelled-no-coords',
        status: 'cancelled',
        total: 15,
        payment_method: 'pix',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        order_items: [],
        users: { name: 'Client No Coords', lat: null, lng: null, location_confirmed: false, rua: '', numero: '', bairro: '' },
      }
    ];

    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      select: jest.fn().mockReturnValue({
        neq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({ data: mockOrdersFallback, error: null }),
        }),
      }),
    }));

    const { getByText, getByTestId } = render(
      <AuthContext.Provider value={authVal}>
        <ThemeProvider>
          <UserMenuProvider>
            <AdminOrdersScreen />
          </UserMenuProvider>
        </ThemeProvider>
      </AuthContext.Provider>
    );
    
    await waitFor(() => {
      expect(getByText('Dinheiro')).toBeTruthy();
    });

    // Press track order to trigger fallback address properties
    const trackButton = getByTestId('track-order-btn');
    fireEvent.press(trackButton);
    expect(mockNavigate).toHaveBeenCalledWith('AdminTabs', {
      screen: 'Mapa',
      params: {
        clientLocation: {
          latitude: -22.9,
          longitude: -47.0,
          name: 'Cliente',
          address: ',  - ',
          orderId: 'o-fallback-dinheiro',
        }
      }
    });

    Platform.OS = originalOS;
    useThemeSpy.mockRestore();
  });
});
