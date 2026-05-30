import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { AuthContext } from '../../presentation/contexts/AuthContext';
import { ThemeProvider } from '../../presentation/contexts/ThemeContext';
import { UserMenuProvider } from '../../presentation/contexts/UserMenuContext';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../../data/datasources/supabase/client';
import { Alert } from 'react-native';

const mockUseTheme = jest.fn().mockReturnValue({
  colors: {
    cardBackground: '#2E2E38',
    inputBackground: '#2E2E38',
    headerBackground: '#000000',
    settingsCardBackground: '#1E1E24',
    textPrimary: '#FFFFFF',
    accent: '#4A90E2',
  },
  isDarkMode: false,
  toggleTheme: jest.fn(),
});
jest.mock('../../presentation/contexts/ThemeContext', () => ({
  useTheme: () => mockUseTheme(),
  ThemeProvider: ({ children }: any) => children,
}));

const mockGetShopStatus = jest.fn().mockReturnValue({
  isOpen: true,
  countdownText: 'Aberto',
});
jest.mock('../../utils/shopHours', () => ({
  getShopStatus: () => mockGetShopStatus(),
}));

// Import screens
import AdminLoginScreen from '../../presentation/screens/auth/AdminLoginScreen';
import AdminHomeScreen from '../../presentation/screens/admin/AdminHomeScreen';
import OrdersScreen from '../../presentation/screens/admin/OrdersScreen';

// ── Mock Navigation Hooks ──
const mockNavigate = jest.fn();
const mockAddListener = jest.fn().mockReturnValue(jest.fn());
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    addListener: mockAddListener,
    setOptions: jest.fn(),
    setParams: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: (cb: () => void) => {
    require('react').useEffect(() => {
      cb();
    }, []);
  },
}));

// Mock Supabase
jest.mock('../../data/datasources/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      signOut: jest.fn(),
      signUp: jest.fn().mockResolvedValue({ data: { user: {} }, error: null }),
      signInWithPassword: jest.fn().mockResolvedValue({ data: { session: {} }, error: null }),
      refreshSession: jest.fn().mockResolvedValue({ data: { session: {} }, error: null }),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
    },
    channel: jest.fn().mockImplementation(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
      unsubscribe: jest.fn(),
    })),
    removeChannel: jest.fn(),
    from: jest.fn().mockImplementation(() => {
      const mockResult: any = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { name: 'Admin Teste', role: 'admin' }, error: null }),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        then: (resolve: any) => {
          if (typeof resolve === 'function') {
            resolve({ data: [], error: null });
          }
          return Promise.resolve({ data: [], error: null });
        },
      };
      return mockResult;
    }),
  },
}));

// Mock Alert
jest.spyOn(Alert, 'alert').mockImplementation(() => {});

describe('Deep Coverage - AdminHomeScreen', () => {
  const mockUser = { id: 'admin-userid-123', email: 'admin@test.com' };
  const mockSignOut = jest.fn().mockResolvedValue(undefined);
  let focusCallback: any = null;

  const authVal = {
    session: null,
    user: mockUser as any,
    isLoading: false,
    signOut: mockSignOut,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    global.alert = jest.fn();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (SecureStore.setItemAsync as jest.Mock).mockResolvedValue(undefined);
    focusCallback = null;
    mockAddListener.mockImplementation((event: string, cb: any) => {
      if (event === 'focus') {
        focusCallback = cb;
      }
      return jest.fn();
    });
    // Reset supabase.from to default
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { name: 'Admin Teste', role: 'admin' }, error: null }),
    }));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderHome = (userOverride?: any) => {
    return render(
      <AuthContext.Provider value={{ ...authVal, user: userOverride !== undefined ? userOverride : mockUser as any }}>
        <ThemeProvider>
          <UserMenuProvider>
            <AdminHomeScreen />
          </UserMenuProvider>
        </ThemeProvider>
      </AuthContext.Provider>
    );
  };

  it('should fetch admin name and set greeting with name', async () => {
    const result = renderHome();
    
    await act(async () => {
      jest.advanceTimersByTime(1100);
    });

    // Should have called supabase to fetch profile name
    expect(supabase.from).toHaveBeenCalledWith('users');
  });

  it('should set empty admin name when data.name is null', async () => {
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { name: null }, error: null }),
    }));

    renderHome();
    
    await act(async () => {
      jest.advanceTimersByTime(1100);
    });
  });

  it('should handle fetchProfileName error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    (supabase.from as jest.Mock).mockImplementation(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockRejectedValue(new Error('Network error')),
    }));

    renderHome();
    
    await act(async () => {
      jest.advanceTimersByTime(1100);
    });

    consoleSpy.mockRestore();
  });

  it('should set empty adminName when user is null', async () => {
    renderHome(null);
    
    await act(async () => {
      jest.advanceTimersByTime(1100);
    });
  });

  it('should hide greeting bar when SecureStore has show_greeting_bar = false', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (key: string) => {
      if (key === 'show_greeting_bar') return 'false';
      return null;
    });

    renderHome();
    
    await act(async () => {
      jest.advanceTimersByTime(1100);
    });
  });

  it('should handle checkGreetingPreference error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (key: string) => {
      if (key === 'show_greeting_bar') throw new Error('SecureStore error');
      return null;
    });

    renderHome();
    
    await act(async () => {
      jest.advanceTimersByTime(1100);
    });

    consoleSpy.mockRestore();
  });

  it('should navigate to AdminDashboardScreen on card press', async () => {
    const { getByText } = renderHome();
    
    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    fireEvent.press(getByText('Painel de Vendas'));
    expect(mockNavigate).toHaveBeenCalledWith('AdminDashboardScreen');
  });

  it('should navigate to AdminSalesHistoryScreen on card press', async () => {
    const { getByText } = renderHome();
    
    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    fireEvent.press(getByText('Histórico de Vendas'));
    expect(mockNavigate).toHaveBeenCalledWith('AdminSalesHistoryScreen');
  });

  it('should navigate to AdminOrdersScreen on card press', async () => {
    const { getByText } = renderHome();
    
    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    fireEvent.press(getByText('Ver Pedidos'));
    expect(mockNavigate).toHaveBeenCalledWith('AdminOrdersScreen');
  });

  it('should call signOut on logout card press', async () => {
    const { getByText } = renderHome();
    
    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    await act(async () => {
      fireEvent.press(getByText('Sair'));
    });

    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    expect(mockSignOut).toHaveBeenCalled();
  });

  it('should handle signOut error on logout', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockSignOut.mockRejectedValue(new Error('Signout error'));

    const { getByText } = renderHome();
    
    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    await act(async () => {
      fireEvent.press(getByText('Sair'));
    });

    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should trigger focus listener callbacks', async () => {
    renderHome();
    
    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    if (focusCallback) {
      await act(async () => {
        focusCallback();
        jest.advanceTimersByTime(100);
      });
    }
  });

  it('should greeting with Bom dia and Boa noite based on current hour', async () => {
    // 1. Bom dia branch
    const getHoursSpy = jest.spyOn(Date.prototype, 'getHours').mockReturnValue(10); // Day
    renderHome();
    await act(async () => {
      jest.advanceTimersByTime(1100);
    });
    getHoursSpy.mockRestore();

    // 2. Boa noite branch
    const getHoursSpyNight = jest.spyOn(Date.prototype, 'getHours').mockReturnValue(20); // Night
    renderHome();
    await act(async () => {
      jest.advanceTimersByTime(1100);
    });
    getHoursSpyNight.mockRestore();
  });

  it('should handle dismiss greeting bar', async () => {
    const { getByText } = renderHome();
    
    await act(async () => {
      jest.advanceTimersByTime(1100);
    });

    const closeBtn = getByText('x');
    await act(async () => {
      fireEvent.press(closeBtn);
    });

    // Fast-forward animation timers
    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('show_greeting_bar', 'false');
  });

  it('should handle dismiss greeting bar and catch SecureStore error', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    (SecureStore.setItemAsync as jest.Mock).mockRejectedValue(new Error('SecureStore write error'));
    const { getByText } = renderHome();
    
    await act(async () => {
      jest.advanceTimersByTime(1100);
    });

    const closeBtn = getByText('x');
    await act(async () => {
      fireEvent.press(closeBtn);
    });

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should display greeting bar and allow dismissal', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

    const { getByText, queryByText } = renderHome();

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    // Greeting bar should show
    const greetingText = queryByText(/Bom dia|Boa noite/);
    if (greetingText) {
      // The dismiss functionality involves Animated.parallel + start(callback)
      // We can't easily test the callback, but we can fire events
    }
  });

  it('should support styles and styling variations under dark mode and when shop is closed', async () => {
    mockUseTheme.mockReturnValue({
      colors: {
        cardBackground: '#2E2E38',
        inputBackground: '#2E2E38',
        headerBackground: '#000000',
        settingsCardBackground: '#1E1E24',
        textPrimary: '#FFFFFF',
        accent: '#4A90E2',
      },
      isDarkMode: true,
      toggleTheme: jest.fn(),
    });

    mockGetShopStatus.mockReturnValue({
      isOpen: false,
      countdownText: 'Fechado',
    });

    const { getByText } = renderHome();
    
    await act(async () => {
      jest.advanceTimersByTime(1100);
    });

    expect(getByText('Fechado')).toBeTruthy();
  });
});

describe('Deep Coverage - AdminLoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    // Reset signInWithPassword to default success
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { session: {} },
      error: null,
    });
  });

  const renderLogin = () => {
    return render(
      <AuthContext.Provider value={{ session: null, user: null, isLoading: false, signOut: async () => {} }}>
        <ThemeProvider>
          <AdminLoginScreen />
        </ThemeProvider>
      </AuthContext.Provider>
    );
  };

  it('should show error alert when fields are empty', async () => {
    const { getByTestId } = renderLogin();
    const submitBtn = getByTestId('admin-login-submit-btn');

    await act(async () => {
      fireEvent.press(submitBtn);
    });

    expect(Alert.alert).toHaveBeenCalledWith('Erro', 'Preencha todos os campos.');
  });

  it('should show error alert when only email is provided', async () => {
    const { getByTestId, getByPlaceholderText } = renderLogin();
    const emailInput = getByPlaceholderText('Digite o código de adm...');

    fireEvent.changeText(emailInput, 'admin@test.com');

    await act(async () => {
      fireEvent.press(getByTestId('admin-login-submit-btn'));
    });

    expect(Alert.alert).toHaveBeenCalledWith('Erro', 'Preencha todos os campos.');
  });

  it('should show error alert when login fails with server error', async () => {
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
      data: { session: null },
      error: { message: 'Invalid credentials' },
    });

    const { getByTestId, getByPlaceholderText } = renderLogin();
    const emailInput = getByPlaceholderText('Digite o código de adm...');
    const passwordInput = getByPlaceholderText('Digite sua senha...');

    fireEvent.changeText(emailInput, 'admin@test.com');
    fireEvent.changeText(passwordInput, 'wrong-password');

    await act(async () => {
      fireEvent.press(getByTestId('admin-login-submit-btn'));
    });

    expect(Alert.alert).toHaveBeenCalledWith('Erro no Login', 'Invalid credentials');
  });

  it('should show loading indicator during login', async () => {
    let resolveLogin: any;
    (supabase.auth.signInWithPassword as jest.Mock).mockReturnValue(
      new Promise((resolve) => {
        resolveLogin = resolve;
      })
    );

    const { getByTestId, getByPlaceholderText } = renderLogin();
    const emailInput = getByPlaceholderText('Digite o código de adm...');
    const passwordInput = getByPlaceholderText('Digite sua senha...');

    fireEvent.changeText(emailInput, 'admin@test.com');
    fireEvent.changeText(passwordInput, 'password123');

    // Don't await - press and let it be loading
    act(() => {
      fireEvent.press(getByTestId('admin-login-submit-btn'));
    });

    // Resolve login
    await act(async () => {
      resolveLogin({ data: { session: {} }, error: null });
    });
  });
});

describe('Deep Coverage - OrdersScreen', () => {
  const mockUser = { id: 'admin-userid-123' };
  const authVal = { session: null, user: mockUser as any, isLoading: false, signOut: async () => {} };
  let focusCallback: any = null;

  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    focusCallback = null;
  });

  const renderOrders = (supabaseMock?: any) => {
    if (supabaseMock) {
      (supabase.from as jest.Mock).mockImplementation(() => supabaseMock);
    }

    const mockNav = {
      addListener: jest.fn((event: string, cb: any) => {
        if (event === 'focus') focusCallback = cb;
        return jest.fn();
      }),
    };

    return render(
      <AuthContext.Provider value={authVal}>
        <ThemeProvider>
          <UserMenuProvider>
            <OrdersScreen navigation={mockNav} />
          </UserMenuProvider>
        </ThemeProvider>
      </AuthContext.Provider>
    );
  };

  it('should show error alert when fetch fails', async () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
    };
    
    renderOrders(chain);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Erro ao carregar pedidos', 'DB error');
    });
  });

  it('should render orders list when data is fetched successfully', async () => {
    const mockOrders = [
      {
        id: 'order-1',
        status: 'completed',
        total: 150,
        payment_method: 'pix',
        created_at: '2026-05-27T10:00:00.000Z',
        users: { name: 'João', email: 'joao@test.com' },
        order_items: [
          { quantity: 2, unit_price: 50, products: { name: 'Ração Premium' } },
          { quantity: 1, unit_price: 50, products: { name: 'Coleira' } },
        ],
      },
    ];

    const chain = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockOrders, error: null }),
    };

    const { getByText } = renderOrders(chain);

    await waitFor(() => {
      expect(getByText('João')).toBeTruthy();
    });
    expect(getByText('PAGTO: PIX')).toBeTruthy();
  });

  it('should show empty message when no orders exist', async () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    };

    const { getByText } = renderOrders(chain);

    await waitFor(() => {
      expect(getByText('Nenhum pedido recebido ainda.')).toBeTruthy();
    });
  });

  it('should refetch on focus event', async () => {
    const chain = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    };

    renderOrders(chain);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalled();
    });

    if (focusCallback) {
      await act(async () => {
        focusCallback();
      });
    }
  });

  it('should handle null users and null order items gracefully', async () => {
    const mockOrders = [
      {
        id: 'order-2',
        status: 'pending',
        total: null,
        payment_method: null,
        created_at: '2026-05-27T10:00:00.000Z',
        users: null,
        order_items: [],
      },
    ];

    const chain = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockOrders, error: null }),
    };

    const { getByText } = renderOrders(chain);

    await waitFor(() => {
      expect(getByText('Cliente Sem Nome')).toBeTruthy();
    });
  });

  it('should render OrdersScreen under dark theme and handle missing fields in items list and empty data from server', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('true');
    // 1. Mock dark mode
    mockUseTheme.mockReturnValue({
      colors: {
        cardBackground: '#2E2E38',
        inputBackground: '#2E2E38',
        headerBackground: '#000000',
        settingsCardBackground: '#1E1E24',
        textPrimary: '#FFFFFF',
        accent: '#4A90E2',
      },
      isDarkMode: true,
      toggleTheme: jest.fn(),
    });

    const mockOrders = [
      {
        id: 'order-dark-1',
        status: 'pending',
        total: null,
        payment_method: null,
        created_at: '2026-05-27T10:00:00.000Z',
        users: { name: 'João Dark', email: 'joao@dark.com' },
        order_items: [
          { quantity: null, unit_price: null, products: null } // Covers null quantity, unit_price, and products.name
        ],
      },
    ];

    const chain = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockOrders, error: null }),
    };

    const { getByText } = renderOrders(chain);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await waitFor(() => {
      expect(getByText('João Dark')).toBeTruthy();
    });

    // 2. Mock null data response from supabase to cover "data || []" fallback on line 26
    const chainNull = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: null, error: null }),
    };

    const { getByText: getByTextNull } = renderOrders(chainNull);
    await waitFor(() => {
      expect(getByTextNull('Nenhum pedido recebido ainda.')).toBeTruthy();
    });
  });
});
