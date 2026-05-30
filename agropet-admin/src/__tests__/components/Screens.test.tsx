import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { AuthContext } from '../../presentation/contexts/AuthContext';
import { ThemeProvider } from '../../presentation/contexts/ThemeContext';
import { UserMenuProvider } from '../../presentation/contexts/UserMenuContext';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../../data/datasources/supabase/client';
import { Alert } from 'react-native';

// Import screens
import AdminLoginScreen from '../../presentation/screens/auth/AdminLoginScreen';
import AdminHomeScreen from '../../presentation/screens/admin/AdminHomeScreen';
import AdminMapScreen from '../../presentation/screens/admin/AdminMapScreen';
import AdminOrderDetailScreen from '../../presentation/screens/admin/AdminOrderDetailScreen';
import AdminOrdersScreen from '../../presentation/screens/admin/AdminOrdersScreen';
import AdminProfileScreen from '../../presentation/screens/admin/AdminProfileScreen';
import AdminSettingsScreen from '../../presentation/screens/admin/AdminSettingsScreen';
import OrdersScreen from '../../presentation/screens/admin/OrdersScreen';
import ProductCreateScreen from '../../presentation/screens/admin/ProductCreateScreen';
import ProductEditScreen from '../../presentation/screens/admin/ProductEditScreen';
import AdminConsultSalesScreen from '../../presentation/screens/admin/AdminConsultSalesScreen';

// ── Mock Navigation Hooks ──
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    addListener: jest.fn().mockReturnValue(jest.fn()),
    setOptions: jest.fn(),
    setParams: jest.fn(),
  }),
  useRoute: () => ({
    params: {
      orderId: 'order-123',
      order: {
        id: 'order-123',
        clientId: 'client-1',
        totalAmount: 100,
        shippingFee: 10,
        status: 'pending',
        items: [{ productId: 'p-1', name: 'Product 1', quantity: 2, unitPrice: 45 }],
        deliveryAddress: 'Main St 123',
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
    from: jest.fn().mockImplementation((table: string) => {
      const mockResult = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
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

describe('Unified Admin Screens Tests', () => {
  const mockUser = { id: 'admin-userid-123', email: 'admin@test.com' };
  const authVal = { session: null, user: mockUser as any, isLoading: false, signOut: async () => {} };

  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
  });

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

  it('should render AdminLoginScreen and trigger submission', async () => {
    const { getByPlaceholderText, getByTestId } = render(
      <AuthContext.Provider value={{ session: null, user: null, isLoading: false, signOut: async () => {} }}>
        <ThemeProvider>
          <AdminLoginScreen />
        </ThemeProvider>
      </AuthContext.Provider>
    );

    const emailInput = getByPlaceholderText('Digite o código de adm...');
    const passwordInput = getByPlaceholderText('Digite sua senha...');
    const submitBtn = getByTestId('admin-login-submit-btn');

    fireEvent.changeText(emailInput, 'admin@test.com');
    fireEvent.changeText(passwordInput, 'password123');
    
    await act(async () => {
      fireEvent.press(submitBtn);
    });

    expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
  });

  it('should render AdminHomeScreen and handle drawer options', () => {
    const { getByText } = renderScreen(AdminHomeScreen);
    expect(getByText('Ver Pedidos')).toBeTruthy();
    expect(getByText('Histórico de Vendas')).toBeTruthy();
  });

  it('should render AdminMapScreen safely', () => {
    const { toJSON } = renderScreen(AdminMapScreen);
    expect(toJSON()).toBeTruthy();
  });

  it('should render AdminOrderDetailScreen safely with standard pending order', () => {
    const mockRoute = {
      params: {
        order: {
          id: 'order-123',
          created_at: '2026-05-27T00:00:00.000Z',
          total: 100,
          status: 'pending',
          delivery_address: 'Rua A, 123',
          order_items: null, // Covers order_items || [] fallback
          users: { name: 'John Doe', phone: '1234567', rua: 'Rua A', numero: '123', bairro: 'Bairro B', cep: '13000-000' }
        }
      }
    };
    const { getByText } = renderScreen(AdminOrderDetailScreen, { route: mockRoute });
    expect(getByText('Nº do Pedido')).toBeTruthy();
    expect(getByText('Pendente')).toBeTruthy();
  });

  it('should render AdminOrderDetailScreen under dark theme and supportCompleted state with null fallbacks', () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('true');
    const mockRoute = {
      params: {
        order: {
          id: 'order-completed-123',
          created_at: '2026-05-27T00:00:00.000Z',
          total: null, // Covers total || 0 fallback
          status: 'completed',
          delivery_address: 'Rua B, 456',
          order_items: [
            { quantity: 1, unit_price: 15.00, products: { name: 'Cat Toy', image_url: '["https://example.com/cat.jpg"]' } },
            { quantity: 2, unit_price: 20.00, products: { name: 'No URL Product', image_url: null } } // Covers !url branch
          ],
          users: null // Covers users || {} fallback
        }
      }
    };
    const { getByText } = renderScreen(AdminOrderDetailScreen, { route: mockRoute });
    expect(getByText('Entregue')).toBeTruthy();
  });

  it('should render AdminOrderDetailScreen with cancelled order and various image url array variations', () => {
    const mockRoute = {
      params: {
        order: {
          id: 'order-cancelled-123',
          created_at: '2026-05-27T00:00:00.000Z',
          total: 30.00,
          status: 'cancelled',
          delivery_address: 'Rua C, 789',
          order_items: [
            { quantity: 3, unit_price: 10.00, products: { name: 'Bird Food', image_url: '[invalid' } },
            { quantity: 1, unit_price: 5.00, products: { name: 'Dog Toy', image_url: '[]' } }, // Covers parsed length === 0
            { quantity: 1, unit_price: 8.00, products: { name: 'Regular Url', image_url: 'https://example.com/dog.jpg' } } // Covers regular string
          ],
          users: { name: 'Bob Smith', phone: '9999999', rua: 'Rua C', numero: '789', bairro: 'Bairro D', cep: '15000-000' }
        }
      }
    };
    const { getByText } = renderScreen(AdminOrderDetailScreen, { route: mockRoute });
    expect(getByText('Cancelado')).toBeTruthy();
  });

  it('should render AdminOrderDetailScreen with completed and cancelled physical PDV sales', () => {
    const mockRouteCompleted = {
      params: {
        order: {
          id: 'order-pdv-1',
          created_at: '2026-05-27T00:00:00.000Z',
          total: 50.00,
          status: 'completed',
          delivery_address: 'Venda Física PDV',
          order_items: [],
          users: {}
        }
      }
    };
    const { getByText, rerender } = renderScreen(AdminOrderDetailScreen, { route: mockRouteCompleted });
    expect(getByText('Venda Física (Concluída)')).toBeTruthy();

    const mockRouteCancelled = {
      params: {
        order: {
          id: 'order-pdv-2',
          created_at: '2026-05-27T00:00:00.000Z',
          total: 50.00,
          status: 'cancelled',
          delivery_address: 'Venda Física PDV',
          order_items: [],
          users: {}
        }
      }
    };
    rerender(
      <AuthContext.Provider value={authVal}>
        <ThemeProvider>
          <UserMenuProvider>
            <AdminOrderDetailScreen route={mockRouteCancelled} />
          </UserMenuProvider>
        </ThemeProvider>
      </AuthContext.Provider>
    );
    expect(getByText('Venda Física (Cancelada)')).toBeTruthy();
  });

  it('should render AdminOrderDetailScreen empty state under light theme', () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    const mockRoute = {
      params: {
        order: {
          id: 'order-empty-1',
          created_at: '2026-05-27T00:00:00.000Z',
          total: 10.00,
          status: 'pending',
          order_items: [], // Triggers empty items list render path (124-133)
          users: {}
        }
      }
    };
    const { getByText } = renderScreen(AdminOrderDetailScreen, { route: mockRoute });
    expect(getByText('Nenhum produto encontrado neste pedido.')).toBeTruthy();
  });

  it('should render AdminOrderDetailScreen empty state under dark theme', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('true');
    const mockRoute = {
      params: {
        order: {
          id: 'order-empty-2',
          created_at: '2026-05-27T00:00:00.000Z',
          total: 10.00,
          status: 'pending',
          order_items: [],
          users: {}
        }
      }
    };
    const { getByText } = render(
      <AuthContext.Provider value={authVal}>
        <ThemeProvider>
          <UserMenuProvider>
            <AdminOrderDetailScreen route={mockRoute} />
          </UserMenuProvider>
        </ThemeProvider>
      </AuthContext.Provider>
    );
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(getByText('Nenhum produto encontrado neste pedido.')).toBeTruthy();
  });

  it('should render AdminOrderDetailScreen and cover null name and null image array fallbacks', () => {
    const mockRouteWithFallbacks = {
      params: {
        order: {
          id: 'order-fallbacks-1',
          created_at: '2026-05-27T00:00:00.000Z',
          total: 20.00,
          status: 'pending',
          order_items: [
            {
              quantity: null, // Covers quantity || 1 fallback
              unit_price: null, // Covers unit_price || 0 fallback
              products: null // Covers item.products || {} fallback (line 132)
            },
            {
              quantity: null,
              unit_price: null,
              products: {
                name: null, // Covers name || 'Produto' fallback
                image_url: '[null]' // Covers getFirstImageUrl() || '' fallback
              }
            }
          ],
          users: {}
        }
      }
    };
    const { getAllByText } = renderScreen(AdminOrderDetailScreen, { route: mockRouteWithFallbacks });
    expect(getAllByText('Produto').length).toBe(2);
  });

  it('should render AdminOrdersScreen safely', () => {
    const { toJSON } = renderScreen(AdminOrdersScreen);
    expect(toJSON()).toBeTruthy();
  });

  it('should render AdminProfileScreen and handle updates', async () => {
    jest.useFakeTimers();
    const mockNav = {
      addListener: jest.fn().mockReturnValue(jest.fn()),
      navigate: jest.fn(),
    };
    const { getByPlaceholderText } = renderScreen(AdminProfileScreen, { navigation: mockNav });
    
    const nameInput = getByPlaceholderText('Digite o seu nome aqui...');
    
    await act(async () => {
      fireEvent.changeText(nameInput, 'Admin User');
      jest.advanceTimersByTime(1000);
    });
    jest.useRealTimers();
  });

  it('should render AdminSettingsScreen and allow editing values', async () => {
    const mockNav = {
      addListener: jest.fn().mockReturnValue(jest.fn()),
      navigate: jest.fn(),
    };
    const { getByTestId } = renderScreen(AdminSettingsScreen, { navigation: mockNav });

    const editBtn = getByTestId('edit-radius-btn');
    await act(async () => {
      fireEvent.press(editBtn);
    });

    const radiusInput = getByTestId('radius-input');
    fireEvent.changeText(radiusInput, '25');

    await act(async () => {
      fireEvent.press(editBtn);
    });
  });

  it('should render OrdersScreen safely', () => {
    const mockNav = {
      addListener: jest.fn().mockReturnValue(jest.fn()),
    };
    const { toJSON } = renderScreen(OrdersScreen, { navigation: mockNav });
    expect(toJSON()).toBeTruthy();
  });

  it('should render ProductCreateScreen and submit new product', async () => {
    const { getByTestId, UNSAFE_getAllByType } = renderScreen(ProductCreateScreen);
    const { TextInput } = require('react-native');
    const inputs = UNSAFE_getAllByType(TextInput);

    const nameInput = inputs[0];
    const priceInput = inputs[2];
    const stockInput = inputs[3];

    fireEvent.changeText(nameInput, 'Ração Seca');
    fireEvent.changeText(priceInput, '120.00');
    fireEvent.changeText(stockInput, '30');

    const saveBtn = getByTestId('register-product-btn');
    await act(async () => {
      fireEvent.press(saveBtn);
    });
  });

  it('should render ProductEditScreen and submit changes', async () => {
    const { getByTestId, UNSAFE_getAllByType } = renderScreen(ProductEditScreen);
    const { TextInput } = require('react-native');
    const inputs = UNSAFE_getAllByType(TextInput);

    const nameInput = inputs[0];
    fireEvent.changeText(nameInput, 'Ração Alterada');

    const saveBtn = getByTestId('save-product-btn');
    await act(async () => {
      fireEvent.press(saveBtn);
    });
  });

  it('should render AdminConsultSalesScreen safely', () => {
    const { getByText } = renderScreen(AdminConsultSalesScreen);
    expect(getByText('Filtrar vendas')).toBeTruthy();
  });
});
