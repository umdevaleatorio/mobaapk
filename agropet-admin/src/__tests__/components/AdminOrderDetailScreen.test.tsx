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

// Import screens
import AdminOrderDetailScreen from '../../presentation/screens/admin/AdminOrderDetail';

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
// AdminOrderDetailScreen
// ============================================================
describe('AdminOrderDetailScreen - Deep Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
  });

  it('should render pending order with products and client data', () => {
    const mockRoute = {
      params: {
        order: {
          id: 'order-abc12345',
          created_at: '2026-05-27T10:00:00.000Z',
          total: 150.50,
          status: 'pending',
          delivery_address: 'Rua Teste 123',
          order_items: [
            { product_id: 'p1', quantity: 3, unit_price: 50, products: { name: 'Ração', image_url: 'https://ex.com/img.png' } }
          ],
          users: { name: 'João', phone: '11999998888', rua: 'Rua A', numero: '10', bairro: 'Centro', cep: '13000-000' },
        },
      },
    };

    const { getByText } = renderScreen(AdminOrderDetailScreen, { route: mockRoute, navigation: { goBack: mockGoBack } });
    expect(getByText('N° do Pedido')).toBeTruthy();
    expect(getByText('Pendente')).toBeTruthy();
    expect(getByText('Ração')).toBeTruthy();
    expect(getByText('João')).toBeTruthy();
  });

  it('should render completed delivery order', () => {
    const mockRoute = {
      params: {
        order: {
          id: 'order-del12345',
          created_at: '2026-01-15T08:00:00.000Z',
          total: 200,
          status: 'completed',
          delivery_address: 'Rua B 456',
          order_items: [],
          users: { name: 'Maria', phone: '11888887777' },
        },
      },
    };

    const { getByText } = renderScreen(AdminOrderDetailScreen, { route: mockRoute, navigation: { goBack: mockGoBack } });
    expect(getByText('Entregue')).toBeTruthy();
    expect(getByText('Nenhum produto encontrado neste pedido.')).toBeTruthy();
  });

  it('should render cancelled order', () => {
    const mockRoute = {
      params: {
        order: {
          id: 'order-can12345',
          created_at: '2026-03-10T12:00:00.000Z',
          total: 0,
          status: 'cancelled',
          delivery_address: 'Rua C 789',
          order_items: [],
          users: {},
        },
      },
    };

    const { getByText } = renderScreen(AdminOrderDetailScreen, { route: mockRoute, navigation: { goBack: mockGoBack } });
    expect(getByText('Cancelado')).toBeTruthy();
  });

  it('should render physical PDV order (completed)', () => {
    const mockRoute = {
      params: {
        order: {
          id: 'order-pdv12345',
          created_at: '2026-05-01T14:00:00.000Z',
          total: 80,
          status: 'completed',
          delivery_address: 'Venda Física PDV',
          order_items: [
            { product_id: 'p2', quantity: 1, unit_price: 80, products: { name: 'Coleira', image_url: null } }
          ],
          users: {},
        },
      },
    };

    const { getByText } = renderScreen(AdminOrderDetailScreen, { route: mockRoute, navigation: { goBack: mockGoBack } });
    expect(getByText('Venda Física (Concluída)')).toBeTruthy();
    expect(getByText('Venda Presencial (Balcão)')).toBeTruthy();
    expect(getByText('Venda Física (PDV)')).toBeTruthy();
  });

  it('should render physical PDV order (cancelled)', () => {
    const mockRoute = {
      params: {
        order: {
          id: 'order-pdvc1234',
          created_at: '2026-05-01T14:00:00.000Z',
          total: 80,
          status: 'cancelled',
          delivery_address: 'Venda Física PDV',
          order_items: [],
          users: {},
        },
      },
    };

    const { getByText } = renderScreen(AdminOrderDetailScreen, { route: mockRoute, navigation: { goBack: mockGoBack } });
    expect(getByText('Venda Física (Cancelada)')).toBeTruthy();
  });

  it('should handle product with JSON array image_url', () => {
    const mockRoute = {
      params: {
        order: {
          id: 'order-img12345',
          created_at: '2026-05-27T10:00:00.000Z',
          total: 100,
          status: 'pending',
          delivery_address: 'Rua D',
          order_items: [
            { product_id: 'p3', quantity: 1, unit_price: 100, products: { name: 'Brinquedo', image_url: '["https://img1.com","https://img2.com"]' } }
          ],
          users: { name: 'Carlos' },
        },
      },
    };

    const { getByText } = renderScreen(AdminOrderDetailScreen, { route: mockRoute, navigation: { goBack: mockGoBack } });
    expect(getByText('Brinquedo')).toBeTruthy();
  });

  it('should handle product with invalid JSON image_url', () => {
    const mockRoute = {
      params: {
        order: {
          id: 'order-badjson12',
          created_at: '2026-05-27T10:00:00.000Z',
          total: 100,
          status: 'pending',
          delivery_address: 'Rua E',
          order_items: [
            { product_id: 'p4', quantity: 1, unit_price: 100, products: { name: 'Item', image_url: '[invalid json]' } }
          ],
          users: {},
        },
      },
    };

    const { getByText } = renderScreen(AdminOrderDetailScreen, { route: mockRoute, navigation: { goBack: mockGoBack } });
    expect(getByText('Item')).toBeTruthy();
  });

  it('should navigate back when Voltar button is pressed', () => {
    const mockRoute = {
      params: {
        order: {
          id: 'order-nav12345',
          created_at: '2026-05-27T10:00:00.000Z',
          total: 50,
          status: 'pending',
          delivery_address: 'Rua F',
          order_items: [],
          users: { name: 'Test' },
        },
      },
    };

    const { getByText } = renderScreen(AdminOrderDetailScreen, { route: mockRoute, navigation: { goBack: mockGoBack } });
    fireEvent.press(getByText('Voltar'));
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('should cover getFirstImageUrl null fallback branch using dynamic image_url getter', () => {
    let callCount = 0;
    const dynamicProduct = {
      name: 'Dynamic Image Product',
      get image_url() {
        callCount++;
        return callCount === 1 ? 'https://example.com/placeholder.png' : null;
      }
    };

    const mockRoute = {
      params: {
        order: {
          id: 'order-dynamic-123',
          created_at: '2026-05-27T10:00:00.000Z',
          total: 100,
          status: 'pending',
          delivery_address: 'Rua Dynamic',
          order_items: [
            { product_id: 'p-dyn', quantity: 1, unit_price: 100, products: dynamicProduct }
          ],
          users: {},
        },
      },
    };

    const { getByText } = renderScreen(AdminOrderDetailScreen, { route: mockRoute, navigation: { goBack: mockGoBack } });
    expect(getByText('Dynamic Image Product')).toBeTruthy();
  });
});
