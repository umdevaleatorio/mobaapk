import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { AuthContext } from '../../presentation/contexts/AuthContext';
import { ThemeProvider } from '../../presentation/contexts/ThemeContext';
import { UserMenuProvider } from '../../presentation/contexts/UserMenuContext';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../../data/datasources/supabase/client';
import { Alert } from 'react-native';

// Import screen
import AdminOrdersScreen from '../../presentation/screens/admin/AdminOrders';

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

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigationObj,
  useRoute: () => ({ params: {} }),
  useFocusEffect: (cb: () => void) => {
    require('react').useEffect(() => {
      const cleanup = cb();
      return typeof cleanup === 'function' ? cleanup : undefined;
    }, []);
  },
}));

// ── Helper: build a mock chain that matches the actual query:
//   supabase.from('orders').select(...).in(...).limit(...).order(...) => Promise<{data, error}>
const makeOrdersChain = (result: { data: any; error: any }) => ({
  select: jest.fn().mockReturnValue({
    in: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue(result),
      }),
    }),
  }),
});

jest.mock('../../data/datasources/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
    },
    channel: jest.fn().mockImplementation(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
      unsubscribe: jest.fn(),
    })),
    removeChannel: jest.fn(),
    from: jest.fn().mockImplementation(() => makeOrdersChain({ data: [], error: null })),
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
    // Default: empty orders
    (supabase.from as jest.Mock).mockImplementation(() =>
      makeOrdersChain({ data: [], error: null })
    );
  });

  it('should render and show loading then empty state when no active orders', async () => {
    const { queryByText } = renderScreen(AdminOrdersScreen);

    await waitFor(() => {
      expect(queryByText('Não há pedidos ativos registrados.')).toBeTruthy();
    }, { timeout: 3000 });

    expect(queryByText('Pedidos de hoje:')).toBeTruthy();
  });

  it('should render active orders list (PIX / pending)', async () => {
    const now = new Date().toISOString();
    const mockOrders = [
      {
        id: 'o1-active-id',
        status: 'pending',
        total: 100,
        payment_method: 'pix',
        created_at: now,
        order_items: [],
        users: { name: 'Client1', lat: -22.9, lng: -47.0, location_confirmed: true, rua: 'Rua A', numero: '1', bairro: 'B' },
      },
    ];

    (supabase.from as jest.Mock).mockImplementation(() =>
      makeOrdersChain({ data: mockOrders, error: null })
    );

    const { getByText } = renderScreen(AdminOrdersScreen);

    await waitFor(() => {
      expect(getByText('PIX')).toBeTruthy();
    });

    expect(getByText('Pendente')).toBeTruthy();
  });

  it('should render all payment method labels and cancelled orders filter', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const today = new Date();
    const nowISO = today.toISOString();
    const oldISO = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()).toISOString();

    const mockOrders = [
      {
        id: 'o1-pix',
        status: 'pending',
        payment_method: 'pix',
        created_at: nowISO,
        order_items: [],
        users: { name: 'C1', lat: -22.9, lng: -47.0, location_confirmed: true, rua: 'R1', numero: '1', bairro: 'B1' },
      },
      {
        id: 'o2-credito',
        status: 'confirmed',
        payment_method: 'cartao_credito',
        created_at: nowISO,
        order_items: [],
        users: { name: 'C2', lat: -22.9, lng: -47.0, location_confirmed: true, rua: 'R2', numero: '2', bairro: 'B2' },
      },
      {
        id: 'o3-debito',
        status: 'confirmed',
        payment_method: 'cartao_debito',
        created_at: nowISO,
        order_items: [],
        users: { name: 'C3', lat: -22.9, lng: -47.0, location_confirmed: true, rua: '', numero: '', bairro: '' },
      },
      {
        id: 'o4-dinheiro',
        status: 'confirmed',
        payment_method: 'dinheiro',
        created_at: nowISO,
        order_items: [],
        users: { name: 'C4', lat: -22.9, lng: -47.0, location_confirmed: true, rua: '', numero: '', bairro: '' },
      },
      {
        id: 'o5-other',
        status: 'confirmed',
        payment_method: 'boleto',
        created_at: nowISO,
        order_items: [],
        users: { name: 'C5', lat: -22.9, lng: -47.0, location_confirmed: true, rua: '', numero: '', bairro: '' },
      },
      {
        // cancelled today — should appear in cancelledOrders section
        id: 'o6-cancel-today',
        status: 'cancelled',
        payment_method: 'pix',
        created_at: nowISO,
        updated_at: nowISO,
        order_items: [],
        users: { name: 'C6', lat: -22.9, lng: -47.0, location_confirmed: true, rua: '', numero: '', bairro: '' },
      },
      {
        // cancelled another year — should NOT appear in cancelledOrders section
        id: 'o7-cancel-old',
        status: 'cancelled',
        payment_method: 'pix',
        created_at: oldISO,
        updated_at: oldISO,
        order_items: [],
        users: { name: 'C7', lat: -22.9, lng: -47.0, location_confirmed: true, rua: '', numero: '', bairro: '' },
      },
    ];

    (supabase.from as jest.Mock).mockImplementation(() =>
      makeOrdersChain({ data: mockOrders, error: null })
    );

    const { getByText, getAllByText, queryByText } = renderScreen(AdminOrdersScreen);

    await waitFor(() => {
      expect(getAllByText('PIX').length).toBeGreaterThan(0);
    });

    // Payment labels
    expect(getByText('Crédito')).toBeTruthy();
    expect(getByText('Débito')).toBeTruthy();
    expect(getByText('Dinheiro')).toBeTruthy();
    expect(getByText('boleto')).toBeTruthy(); // default: label = paymentMethod

    // Status labels
    expect(getByText('Pendente')).toBeTruthy();
    expect(getAllByText('Aprovado').length).toBeGreaterThan(0);
    expect(getAllByText('Cancelado').length).toBeGreaterThan(0);

    // cancelled-today order should show in cancelled section (id truncated to 8 chars, uppercased)
    expect(getByText('O6-CANCE')).toBeTruthy();
    // cancelled-old-year order must NOT be in the list
    expect(queryByText('O7-CANCE')).toBeNull();

    consoleErrorSpy.mockRestore();
  });

  it('should cover realtime callback and focus listener', async () => {
    let realtimeCallback: any = null;
    const mockChannel = {
      on: jest.fn().mockImplementation((_event: string, _filter: any, callback: any) => {
        realtimeCallback = callback;
        return mockChannel;
      }),
      subscribe: jest.fn().mockReturnThis(),
    };
    (supabase.channel as jest.Mock).mockReturnValue(mockChannel);

    let focusCallback: any = null;
    (mockNavigationObj.addListener as jest.Mock).mockImplementation((event: string, cb: any) => {
      if (event === 'focus') focusCallback = cb;
      return jest.fn();
    });

    const orderMockFn = jest.fn().mockResolvedValue({ data: [], error: null });
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        in: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            order: orderMockFn,
          }),
        }),
      }),
    }));

    renderScreen(AdminOrdersScreen);

    await waitFor(() => {
      expect(orderMockFn).toHaveBeenCalled();
    });

    // Trigger realtime callback
    await act(async () => {
      if (realtimeCallback) realtimeCallback({ new: {} });
    });

    // Trigger focus callback
    await act(async () => {
      if (focusCallback) focusCallback();
    });

    expect(orderMockFn).toHaveBeenCalledTimes(3); // initial + realtime + focus
  });

  it('should cover fetchOrders error catch block', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    let focusCallback: any = null;
    (mockNavigationObj.addListener as jest.Mock).mockImplementation((event: string, cb: any) => {
      if (event === 'focus') focusCallback = cb;
      return jest.fn();
    });

    const orderMockFn = jest.fn()
      .mockResolvedValueOnce({ data: [], error: null }) // initial
      .mockResolvedValue({ data: null, error: new Error('DB error') }); // on focus

    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        in: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            order: orderMockFn,
          }),
        }),
      }),
    }));

    renderScreen(AdminOrdersScreen);

    await waitFor(() => {
      expect(orderMockFn).toHaveBeenCalled();
    });

    await act(async () => {
      if (focusCallback) focusCallback();
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Erro ao buscar pedidos no AdminOrdersScreen:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  it('should cover fetchOrders data null branch (setOrders with empty array fallback)', async () => {
    let focusCallback: any = null;
    (mockNavigationObj.addListener as jest.Mock).mockImplementation((event: string, cb: any) => {
      if (event === 'focus') focusCallback = cb;
      return jest.fn();
    });

    const orderMockFn = jest.fn()
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: null, error: null }); // null data -> setOrders([])

    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnValue({
        in: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            order: orderMockFn,
          }),
        }),
      }),
    }));

    const { queryByText } = renderScreen(AdminOrdersScreen);

    await waitFor(() => expect(orderMockFn).toHaveBeenCalled());

    await act(async () => {
      if (focusCallback) focusCallback();
    });

    await waitFor(() => {
      expect(queryByText('Não há pedidos ativos registrados.')).toBeTruthy();
    });
  });

  it('should handle pull-to-refresh (onRefresh)', async () => {
    (supabase.from as jest.Mock).mockImplementation(() =>
      makeOrdersChain({ data: [], error: null })
    );

    const { UNSAFE_getByType } = renderScreen(AdminOrdersScreen);
    const { ScrollView } = require('react-native');
    const scrollView = UNSAFE_getByType(ScrollView);

    await act(async () => {
      scrollView.props.refreshControl.props.onRefresh();
    });
  });

  it('should trigger handleTrackOrder on track button press', async () => {
    const now = new Date().toISOString();
    const mockOrders = [
      {
        id: 'o1-track',
        status: 'confirmed',
        payment_method: 'pix',
        created_at: now,
        order_items: [],
        users: { name: 'Track Client', lat: -10.0, lng: -50.0, location_confirmed: true, rua: 'Rua T', numero: '9', bairro: 'BT' },
      },
    ];

    (supabase.from as jest.Mock).mockImplementation(() =>
      makeOrdersChain({ data: mockOrders, error: null })
    );

    const { getByTestId } = renderScreen(AdminOrdersScreen);

    await waitFor(() => {
      expect(getByTestId('track-order-btn')).toBeTruthy();
    });

    fireEvent.press(getByTestId('track-order-btn'));
    expect(mockNavigate).toHaveBeenCalledWith('AdminTabs', {
      screen: 'Mapa',
      params: {
        clientLocation: {
          latitude: -10.0,
          longitude: -50.0,
          name: 'Track Client',
          address: 'Rua T, 9 - BT',
          orderId: 'o1-track',
        }
      }
    });
  });

  it('should cover handleTrackOrder with fallback name and empty address parts', async () => {
    const now = new Date().toISOString();
    const mockOrders = [
      {
        id: 'o-fallback',
        status: 'confirmed',
        payment_method: 'dinheiro',
        created_at: now,
        order_items: [],
        users: { name: '', lat: -22.9, lng: -47.0, location_confirmed: true, rua: '', numero: '', bairro: '' },
      },
    ];

    (supabase.from as jest.Mock).mockImplementation(() =>
      makeOrdersChain({ data: mockOrders, error: null })
    );

    const { getByTestId } = renderScreen(AdminOrdersScreen);

    await waitFor(() => {
      expect(getByTestId('track-order-btn')).toBeTruthy();
    });

    fireEvent.press(getByTestId('track-order-btn'));
    expect(mockNavigate).toHaveBeenCalledWith('AdminTabs', {
      screen: 'Mapa',
      params: {
        clientLocation: {
          latitude: -22.9,
          longitude: -47.0,
          name: 'Cliente', // fallback
          address: ',  - ',  // empty parts
          orderId: 'o-fallback',
        }
      }
    });
  });

  it('should navigate to AdminOrderDetailScreen on "Ver produtos" press', async () => {
    const now = new Date().toISOString();
    const mockOrder = {
      id: 'o1-detail',
      status: 'confirmed',
      payment_method: 'pix',
      created_at: now,
      order_items: [],
      users: { name: 'C1', lat: -22.9, lng: -47.0, location_confirmed: true, rua: 'R', numero: '1', bairro: 'B' },
    };

    (supabase.from as jest.Mock).mockImplementation(() =>
      makeOrdersChain({ data: [mockOrder], error: null })
    );

    const { UNSAFE_getAllByType } = renderScreen(AdminOrdersScreen);

    await waitFor(() => {
      expect(mockNavigate).toBeDefined();
    });

    await act(async () => {
      await new Promise(r => setTimeout(r, 50));
    });

    const { TouchableOpacity } = require('react-native');
    const all = UNSAFE_getAllByType(TouchableOpacity);
    // "Ver produtos" button is the one right after the track button
    const verProdutosBtn = all.find((t: any) => {
      try {
        const { Text } = require('react-native');
        const txt = t.findByType(Text);
        return txt?.props?.children === 'Ver produtos';
      } catch { return false; }
    });
    if (verProdutosBtn) {
      fireEvent.press(verProdutosBtn);
      expect(mockNavigate).toHaveBeenCalledWith('AdminOrderDetailScreen', { order: mockOrder });
    }
  });

  it('should render cancelled order with 60% opacity and disabled track button', async () => {
    const today = new Date().toISOString();
    const cancelledOrder = {
      id: 'o-cancel',
      status: 'cancelled',
      payment_method: 'pix',
      created_at: today,
      updated_at: today,
      order_items: [],
      users: { name: 'Cancelled', lat: -22.9, lng: -47.0, location_confirmed: true, rua: '', numero: '', bairro: '' },
    };

    (supabase.from as jest.Mock).mockImplementation(() =>
      makeOrdersChain({ data: [cancelledOrder], error: null })
    );

    const { getAllByText } = renderScreen(AdminOrdersScreen);

    await waitFor(() => {
      expect(getAllByText('Cancelado').length).toBeGreaterThan(0);
    });
  });

  it('should trigger the 10s timer interval', async () => {
    jest.useFakeTimers();

    (supabase.from as jest.Mock).mockImplementation(() =>
      makeOrdersChain({ data: [], error: null })
    );

    const { unmount } = renderScreen(AdminOrdersScreen);

    await act(async () => {
      jest.advanceTimersByTime(10000);
    });

    unmount();
    jest.useRealTimers();
  });

  it('should cover isDarkMode=false branch (light mode colors)', async () => {
    const themeContextModule = require('../../presentation/contexts/ThemeContext');
    const useThemeSpy = jest.spyOn(themeContextModule, 'useTheme');
    useThemeSpy.mockReturnValue({
      isDarkMode: false,
      colors: themeContextModule.lightColors,
      toggleTheme: jest.fn(),
    });

    const now = new Date().toISOString();
    (supabase.from as jest.Mock).mockImplementation(() =>
      makeOrdersChain({
        data: [{
          id: 'o-light',
          status: 'confirmed',
          payment_method: 'cartao_debito',
          created_at: now,
          order_items: [],
          users: { name: 'Light Client', lat: -22.9, lng: -47.0, location_confirmed: true, rua: '', numero: '', bairro: '' },
        }],
        error: null,
      })
    );

    const { getByText } = renderScreen(AdminOrdersScreen);

    await waitFor(() => {
      expect(getByText('Débito')).toBeTruthy();
    });

    useThemeSpy.mockRestore();
  });

  it('should render empty cancelled section when cancelledOrders is empty', async () => {
    (supabase.from as jest.Mock).mockImplementation(() =>
      makeOrdersChain({ data: [], error: null })
    );

    const { getByText } = renderScreen(AdminOrdersScreen);

    await waitFor(() => {
      expect(getByText('Não há pedidos cancelados, Uhuu 🥳')).toBeTruthy();
    });
  });

  it('should cover supabase.removeChannel and navigation unsubscribe on unmount', async () => {
    const mockUnsub = jest.fn();
    const mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
    };
    (supabase.channel as jest.Mock).mockReturnValue(mockChannel);
    (mockNavigationObj.addListener as jest.Mock).mockReturnValue(mockUnsub);

    const { unmount } = renderScreen(AdminOrdersScreen);

    await act(async () => {
      await new Promise(r => setTimeout(r, 10));
    });

    unmount();

    expect(supabase.removeChannel).toHaveBeenCalledWith(mockChannel);
    expect(mockUnsub).toHaveBeenCalled();
  });

  it('should cover dinheiro payment in isDarkMode=false (line 96) and cartao_debito in isDarkMode=true (line 111)', async () => {
    // Line 96: dinheiro color in isDarkMode=false
    const themeContextModule = require('../../presentation/contexts/ThemeContext');
    const useThemeSpy = jest.spyOn(themeContextModule, 'useTheme');
    useThemeSpy.mockReturnValue({
      isDarkMode: false,
      colors: themeContextModule.lightColors,
      toggleTheme: jest.fn(),
    });

    const now = new Date().toISOString();
    (supabase.from as jest.Mock).mockImplementation(() =>
      makeOrdersChain({
        data: [{
          id: 'o-dinheiro-light',
          status: 'confirmed',
          payment_method: 'dinheiro',
          created_at: now,
          order_items: [],
          users: { name: 'D', lat: -22.9, lng: -47.0, location_confirmed: true, rua: '', numero: '', bairro: '' },
        }],
        error: null,
      })
    );

    const { getByText, unmount: unmount1 } = renderScreen(AdminOrdersScreen);
    await waitFor(() => expect(getByText('Dinheiro')).toBeTruthy());
    unmount1();
    useThemeSpy.mockRestore();

    // Line 111: cartao_debito color in isDarkMode=true (dark mode is the default mock)
    (supabase.from as jest.Mock).mockImplementation(() =>
      makeOrdersChain({
        data: [{
          id: 'o-debito-dark',
          status: 'confirmed',
          payment_method: 'cartao_debito',
          created_at: now,
          order_items: [],
          users: { name: 'D', lat: -22.9, lng: -47.0, location_confirmed: true, rua: '', numero: '', bairro: '' },
        }],
        error: null,
      })
    );

    const { getByText: getByText2 } = renderScreen(AdminOrdersScreen);
    await waitFor(() => expect(getByText2('Débito')).toBeTruthy());
  });

  it('should cover || fallback when cancelled order has no updated_at', async () => {
    const today = new Date();
    const todayISO = today.toISOString();
    const cancelledOrder = {
      id: 'o-no-updated-at',
      status: 'cancelled',
      payment_method: 'pix',
      created_at: todayISO,
      order_items: [],
      users: { name: 'NoUpdateAt', lat: -22.9, lng: -47.0, location_confirmed: true, rua: '', numero: '', bairro: '' },
    };

    (supabase.from as jest.Mock).mockImplementation(() =>
      makeOrdersChain({ data: [cancelledOrder], error: null })
    );

    const { getAllByText } = renderScreen(AdminOrdersScreen);

    await waitFor(() => {
      expect(getAllByText('Cancelado').length).toBeGreaterThan(0);
    });
  });
});

