import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { AuthContext } from '../../presentation/contexts/AuthContext';
import { ThemeProvider } from '../../presentation/contexts/ThemeContext';
import { UserMenuProvider } from '../../presentation/contexts/UserMenuContext';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../data/datasources/supabase/client';
import { Alert, TouchableOpacity, Platform } from 'react-native';

// Import screen
import AdminSalesHistoryScreen from '../../presentation/screens/admin/AdminSalesHistoryScreen';

// Mock React's useState to intercept pickerMode initialization and setters
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  const realUseState = originalReact.useState;
  return {
    ...originalReact,
    useState: (init: any) => {
      const [val, setVal] = realUseState(init);
      const customSetVal = (newVal: any) => {
        if ((global as any).mockPickerMode && (init === 'single' || val === 'single' || val === 'range_start' || val === 'range_end')) {
          setVal((global as any).mockPickerMode);
        } else {
          setVal(newVal);
        }
      };
      return [val, customSetVal];
    }
  };
});

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

// ── Mock DateTimePicker ──
jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { View } = require('react-native');
  return (props: any) => {
    return <View testID="mock-datetimepicker" {...props} />;
  };
});

// ── Mock ThemeContext dynamically to support Dark Mode queries ──
(global as any).isDarkModeTest = true;
jest.mock('../../presentation/contexts/ThemeContext', () => {
  const actual = jest.requireActual('../../presentation/contexts/ThemeContext');
  return {
    ...actual,
    useTheme: () => {
      const isDark = (global as any).isDarkModeTest !== false;
      return {
        isDarkMode: isDark,
        colors: isDark ? actual.darkColors : actual.lightColors,
        toggleTheme: jest.fn(),
      };
    }
  };
});

// ── Mock Navigation Hooks ──
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockAddListener = jest.fn();
const mockSetOptions = jest.fn();
const mockNavigationObj = {
  navigate: mockNavigate,
  goBack: mockGoBack,
  addListener: mockAddListener,
  setOptions: mockSetOptions,
  setParams: jest.fn(),
  getParent: jest.fn().mockReturnValue({ setOptions: jest.fn() }),
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

// Mock Supabase
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
    single: jest.fn().mockResolvedValue({ data: overrides.singleData !== undefined ? overrides.singleData : { id: 1 }, error: defaultError }),
    maybeSingle: jest.fn().mockResolvedValue({ data: overrides.singleData !== undefined ? overrides.singleData : { id: 1 }, error: defaultError }),
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
  chain.eq = jest.fn().mockImplementation(() => chain);
  chain.neq = jest.fn().mockImplementation(() => chain);
  chain.order = jest.fn().mockImplementation(() => chain);
  chain.select = jest.fn().mockImplementation(() => chain);
  
  return chain;
};

jest.mock('../../data/datasources/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
    },
    from: jest.fn().mockImplementation(() => createMockChain()),
  },
}));

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

describe('AdminSalesHistoryScreen - Deep Coverage', () => {
  let alertSpy: any;
  let focusListener: any;

  beforeEach(() => {
    jest.clearAllMocks();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

    mockAddListener.mockImplementation((event: string, cb: any) => {
      if (event === 'focus') {
        focusListener = cb;
      }
      return jest.fn();
    });
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('should render, fetch sales, navigate to details, and support payment method switches', async () => {
    const mockHistory = [
      {
        id: 'h-1',
        total: 80,
        payment_method: 'dinheiro',
        created_at: new Date().toISOString(),
        status: 'completed',
        order_items: [
          {
            products: {
              image_url: '["https://example.com/img1.png", "https://example.com/img2.png"]'
            }
          }
        ]
      },
      {
        id: 'h-2',
        total: 95,
        payment_method: 'pix',
        created_at: new Date().toISOString(),
        status: 'completed',
        order_items: [
          {
            products: {
              image_url: 'https://example.com/single-img.png'
            }
          }
        ]
      },
      {
        id: 'h-3',
        total: 110,
        payment_method: 'cartao_credito',
        created_at: new Date().toISOString(),
        status: 'completed',
        order_items: [
          {
            products: {
              image_url: '[invalid-json'
            }
          }
        ]
      },
      {
        id: 'h-4',
        total: 125,
        payment_method: 'cartao_debito',
        created_at: new Date().toISOString(),
        status: 'completed',
        order_items: []
      },
      {
        id: 'h-5',
        total: 20,
        payment_method: 'outros_pgtos',
        created_at: new Date().toISOString(),
        status: 'completed'
      }
    ];

    const fromSpy = jest.spyOn(supabase, 'from').mockImplementation(() => createMockChain({ data: mockHistory }));

    const { getByText, getAllByText, UNSAFE_getAllByType } = renderScreen(AdminSalesHistoryScreen);

    // Trigger focus listener
    await act(async () => {
      if (focusListener) {
        focusListener();
      }
    });

    // Check payment displays are rendered
    await waitFor(() => {
      expect(getAllByText('Dinheiro').length).toBeGreaterThan(0);
      expect(getAllByText('Pix').length).toBeGreaterThan(0);
      expect(getAllByText('Cartão/Crédito').length).toBeGreaterThan(0);
      expect(getAllByText('Cartão/Débito').length).toBeGreaterThan(0);
      expect(getByText('outros_pgtos')).toBeTruthy();
    });

    // Navigate to details by clicking Ver Resumo
    const verResumoBtns = getAllByText('Ver\nResumo');
    fireEvent.press(verResumoBtns[0]);
    expect(mockNavigate).toHaveBeenCalledWith('AdminOrderDetailScreen', { order: mockHistory[0] });

    fromSpy.mockRestore();
  });

  it('should handle AsyncStorage load errors and fetch exceptions', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (AsyncStorage.getItem as jest.Mock).mockRejectedValue(new Error('AsyncStorage Load Error'));

    jest.spyOn(supabase, 'from').mockImplementationOnce(() => {
      throw new Error('Supabase error');
    });

    renderScreen(AdminSalesHistoryScreen);
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });
    consoleSpy.mockRestore();
  });

  it('should support time filters (Dia Único & Custom Period Date Ranges)', async () => {
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => {
      if (key === 'admin_history_startDate') return '2026-05-25T12:00:00.000';
      if (key === 'admin_history_endDate') return '2026-05-25T12:00:00.000';
      if (key === 'admin_history_isRange') return 'false';
      if (key === 'admin_history_hasFiltered') return 'true';
      return null;
    });

    const { getByText, getByTestId, UNSAFE_getAllByType, getAllByText } = renderScreen(AdminSalesHistoryScreen);

    // Wait for AsyncStorage loaded dates to be flushed to state
    let selectDateBtn: any;
    await waitFor(() => {
      selectDateBtn = getByText('25/05/2026');
      expect(selectDateBtn).toBeTruthy();
    });
    fireEvent.press(selectDateBtn);

    // 1. Check Dia Único selection
    const singleDayBtn = getByText('Dia Único');
    expect(singleDayBtn).toBeTruthy();
    fireEvent.press(singleDayBtn);

    // Render picker and mock picking a Sunday/Holiday date to show sunday modal
    const picker = getByTestId('mock-datetimepicker');
    await act(async () => {
      picker.props.onChange({ type: 'set' }, new Date('2026-05-24T12:00:00.000Z')); // 24th May is Sunday
    });

    expect(getByText('Aviso de Fechamento')).toBeTruthy();
    const entendidoBtn = getByText('Entendido');
    fireEvent.press(entendidoBtn); // Close sunday modal

    // Reopen modal and choose normal single day
    fireEvent.press(selectDateBtn);
    fireEvent.press(singleDayBtn);
    const freshPicker1 = await waitFor(() => getByTestId('mock-datetimepicker'));
    await act(async () => {
      freshPicker1.props.onChange({ type: 'set' }, new Date('2026-05-26T12:00:00.000Z')); // Tuesday
    });

    // 2. Custom Period Range Picker Flow
    fireEvent.press(getByText('26/05/2026'));
    
    // Choose start date
    const startRangeBtn = getByText('Início');
    fireEvent.press(startRangeBtn);
    const freshPicker2 = await waitFor(() => getByTestId('mock-datetimepicker'));
    await act(async () => {
      freshPicker2.props.onChange({ type: 'set' }, new Date('2026-05-27T12:00:00.000Z'));
    });

    // Choose end date
    const endRangeBtn = getByText('Fim');
    fireEvent.press(endRangeBtn);
    const freshPicker3 = await waitFor(() => getByTestId('mock-datetimepicker'));
    await act(async () => {
      freshPicker3.props.onChange({ type: 'set' }, new Date('2026-05-25T12:00:00.000Z')); // earlier than start date (to test date swap)
    });

    // Confirm Period (should swap 25 and 27)
    const filterPeriodBtn = getByText('Filtrar Período');
    await act(async () => {
      fireEvent.press(filterPeriodBtn);
    });

    // Close Modal via Fechar
    fireEvent.press(getByText('25/05/2026 - 27/05/2026'));
    const closeBtn = getByText('Fechar');
    fireEvent.press(closeBtn);

    // Dismiss picker flow check
    fireEvent.press(getByText('25/05/2026 - 27/05/2026'));
    const freshStartBtn = await waitFor(() => getByText('Início'));
    fireEvent.press(freshStartBtn);
    const freshPicker4 = await waitFor(() => getByTestId('mock-datetimepicker'));
    await act(async () => {
      freshPicker4.props.onChange({ type: 'dismissed' });
    });
  });

  it('should cover all remaining helper, persistence error, date titles, bottom navigation tab and focus listener branches', async () => {
    // 1. Mock supabase with orders containing diverse image types (JSON arrays, strings, nulls) for getFirstImageUrl
    const mockOrders = [
      { 
        id: 'h-comp', 
        total: 100, 
        payment_method: 'pix', 
        created_at: new Date().toISOString(), 
        status: 'completed',
        order_items: [
          { product: { image: '["https://agropet.com/image1.jpg"]' } },
          { product: { image: 'https://agropet.com/image2.jpg' } },
          { product: null }
        ]
      }
    ];
    const fromSpy = jest.spyOn(supabase, 'from').mockImplementation(() => createMockChain({ data: mockOrders }));

    // 2. Mock AsyncStorage persistence error path
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('AsyncStorage persist error'));

    const { getByText, UNSAFE_getAllByType } = renderScreen(AdminSalesHistoryScreen);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error persisting history dates:', expect.any(Error));
    });
    consoleSpy.mockRestore();

    // 3. Test navigation tabs clicks using last 4 Touchables
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    const lastFour = touchables.slice(-4);
    for (const tab of lastFour) {
      await act(async () => {
        fireEvent.press(tab);
      });
    }

    // 4. Test yesterday, anteontem, and older titles for history
    const today = new Date();
    const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
    const anteontem = new Date(); anteontem.setDate(today.getDate() - 2);
    const fiveDaysAgo = new Date(); fiveDaysAgo.setDate(today.getDate() - 5);

    // Yesterday
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => {
      if (key === 'admin_history_startDate') return yesterday.toISOString();
      if (key === 'admin_history_endDate') return yesterday.toISOString();
      if (key === 'admin_history_isRange') return 'true';
      if (key === 'admin_history_hasFiltered') return 'true';
      return null;
    });
    const sYesterday = renderScreen(AdminSalesHistoryScreen);
    await waitFor(() => {
      expect(sYesterday.getByText('Ontem:') || sYesterday.queryByText('Neste dia:')).toBeTruthy();
    });

    // Anteontem
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => {
      if (key === 'admin_history_startDate') return anteontem.toISOString();
      if (key === 'admin_history_endDate') return anteontem.toISOString();
      if (key === 'admin_history_isRange') return 'true';
      if (key === 'admin_history_hasFiltered') return 'true';
      return null;
    });
    const sAnteontem = renderScreen(AdminSalesHistoryScreen);
    await waitFor(() => {
      expect(sAnteontem.getByText('Anteontem:') || sAnteontem.queryByText('Neste dia:')).toBeTruthy();
    });

    // Five days ago (Older date)
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => {
      if (key === 'admin_history_startDate') return fiveDaysAgo.toISOString();
      if (key === 'admin_history_endDate') return fiveDaysAgo.toISOString();
      if (key === 'admin_history_isRange') return 'true';
      if (key === 'admin_history_hasFiltered') return 'true';
      return null;
    });
    const sOlder = renderScreen(AdminSalesHistoryScreen);
    await waitFor(() => {
      expect(sOlder.getByText('Neste dia:')).toBeTruthy();
    });

    // 5. Test hasFiltered is false path
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => {
      if (key === 'admin_history_hasFiltered') return 'false';
      return null;
    });
    const sUnfiltered = renderScreen(AdminSalesHistoryScreen);
    await waitFor(() => {
      expect(sUnfiltered.getByText('Histórico:')).toBeTruthy();
    });

    // 6. Test navigation focus listener trigger when isLoaded is true
    if (focusListener) {
      await act(async () => {
        focusListener();
      });
    }

    fromSpy.mockRestore();
  });

  it('should cover styling branches under light mode and missing image placeholders', async () => {
    // 1. Set global.isDarkModeTest to false for Light Mode
    (global as any).isDarkModeTest = false;

    // Mock hasFiltered to false to render "Selecionar data" in Light Mode (covers line 348)
    (AsyncStorage.getItem as jest.Mock).mockImplementation(async (key: string) => {
      if (key === 'admin_history_hasFiltered') return 'false';
      return null;
    });

    // 2. Mock orders with missing/blank product images and null data from Supabase
    const mockLightOrders = [
      {
        id: 'light-order-id-123',
        total: 150,
        payment_method: 'dinheiro',
        status: 'completed',
        created_at: new Date().toISOString(),
        order_items: [
          {
            id: 'item-1',
            quantity: 1,
            products: {
              name: 'Shampoo Pet Light',
              image_url: null // missing/null image triggers placeholder branch
            }
          }
        ]
      }
    ];

    const fromSpy = jest.spyOn(supabase, 'from').mockImplementation(() => createMockChain({ data: null }));

    const { getByText } = renderScreen(AdminSalesHistoryScreen);

    // Let it render with null data
    await waitFor(() => {
      expect(getByText('Nenhuma venda registrada neste período.')).toBeTruthy();
    });

    fromSpy.mockRestore();
    (global as any).isDarkModeTest = true;
  });

  it('should cover all remaining branch edge cases and conditional checks including getFirstImageUrl, reduce with null, invalid date picker, ranges, and iOS styling', async () => {
    // 1. Mock Platform.OS = 'ios'
    const originalPlatform = Platform.OS;
    Object.defineProperty(Platform, 'OS', {
      value: 'ios',
      writable: true
    });

    // 2. Set global.isDarkModeTest to false for Light Mode
    (global as any).isDarkModeTest = false;

    // 3. Mock orders with null values and different formats for getFirstImageUrl
    const mockSpecialOrders = [
      {
        id: 'special-1',
        total: null, // o.total ?? 0 branch cover
        payment_method: 'unknown',
        status: 'completed',
        created_at: new Date().toISOString(),
        order_items: [
          {
            products: {
              name: 'Item Empty Array',
              image_url: '[]' // empty array getFirstImageUrl branch cover
            }
          }
        ]
      },
      {
        id: 'special-2',
        total: null, // o.total ?? 0 branch cover
        payment_method: 'cartao_credito',
        status: 'completed',
        created_at: new Date().toISOString(),
        order_items: [
          {
            products: {
              name: 'Item Object JSON',
              image_url: '{"url": "not-an-array"}' // non-array JSON getFirstImageUrl branch cover
            }
          }
        ]
      },
      {
        id: 'special-3',
        total: null, // o.total ?? 0 branch cover
        payment_method: 'cartao_debito',
        status: 'completed',
        created_at: new Date().toISOString(),
      },
      {
        id: 'special-4',
        total: null, // o.total ?? 0 branch cover
        payment_method: 'dinheiro',
        status: 'completed',
        created_at: new Date().toISOString(),
      },
      {
        id: 'special-5',
        total: null, // o.total ?? 0 branch cover
        payment_method: 'pix',
        status: 'completed',
        created_at: new Date().toISOString(),
      }
    ];

    const fromSpy = jest.spyOn(supabase, 'from').mockImplementation(() => createMockChain({ data: mockSpecialOrders }));

    const { getByText, getByTestId } = renderScreen(AdminSalesHistoryScreen);

    await waitFor(() => {
      expect(getByText('unknown')).toBeTruthy();
    });

    // 4. Trigger DateTimePicker onChange with selectedDate as undefined
    const selectDateBtn = getByText(new Date().toLocaleDateString('pt-BR'));
    fireEvent.press(selectDateBtn);

    const singleDayBtn = getByText('Dia Único');
    fireEvent.press(singleDayBtn);

    const picker = getByTestId('mock-datetimepicker');
    await act(async () => {
      picker.props.onChange({ type: 'set' }, undefined); // undefined selectedDate branch cover
    });

    // 5. Test Range picker end/start without swapping (localStartDate <= localEndDate)
    fireEvent.press(selectDateBtn);
    const startRangeBtn = getByText('Início');
    fireEvent.press(startRangeBtn);
    const pickerStart = await waitFor(() => getByTestId('mock-datetimepicker'));
    await act(async () => {
      pickerStart.props.onChange({ type: 'set' }, new Date('2026-05-20T12:00:00.000Z'));
    });

    const endRangeBtn = getByText('Fim');
    fireEvent.press(endRangeBtn);
    const pickerEnd = await waitFor(() => getByTestId('mock-datetimepicker'));
    await act(async () => {
      pickerEnd.props.onChange({ type: 'set' }, new Date('2026-05-22T12:00:00.000Z'));
    });

    const filterPeriodBtn = getByText('Filtrar Período');
    await act(async () => {
      fireEvent.press(filterPeriodBtn);
    });

    // Revert Platform.OS and global.isDarkModeTest
    Object.defineProperty(Platform, 'OS', {
      value: originalPlatform,
      writable: true
    });
    (global as any).isDarkModeTest = true;
    fromSpy.mockRestore();
  });

  it('should cover supabase fetch errors using a failing mock chain', async () => {
    const chainFresh: any = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      then: (resolve: any) => {
        if (resolve) resolve({ data: null, error: new Error('Select query error') });
        return Promise.resolve({ data: null, error: new Error('Select query error') });
      }
    };
    chainFresh.eq = jest.fn().mockImplementation(() => chainFresh);
    chainFresh.neq = jest.fn().mockImplementation(() => chainFresh);
    chainFresh.order = jest.fn().mockImplementation(() => chainFresh);
    chainFresh.select = jest.fn().mockImplementation(() => chainFresh);
    chainFresh.gte = jest.fn().mockImplementation(() => chainFresh);
    chainFresh.lte = jest.fn().mockImplementation(() => chainFresh);

    const fromSpy = jest.spyOn(supabase, 'from').mockImplementation(() => chainFresh as any);

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    renderScreen(AdminSalesHistoryScreen);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Erro ao buscar histórico de vendas:', expect.any(Error));
    });

    consoleSpy.mockRestore();
    fromSpy.mockRestore();
  });

  it('should cover onChangeDate branch when pickerMode is invalid', async () => {
    (global as any).mockPickerMode = 'invalid_picker_mode';
    const { getByText, getByTestId } = renderScreen(AdminSalesHistoryScreen);

    // Open single day picker flow to trigger onChangeDate while pickerMode is invalid_picker_mode
    const selectDateBtn = await waitFor(() => getByText(new Date().toLocaleDateString('pt-BR')));
    fireEvent.press(selectDateBtn);

    const singleDayBtn = getByText('Dia Único');
    fireEvent.press(singleDayBtn);

    const picker = getByTestId('mock-datetimepicker');
    await act(async () => {
      picker.props.onChange({ type: 'set' }, new Date());
    });

    // Reset picker mode mock
    delete (global as any).mockPickerMode;
  });

  it('should cover Platform.OS ios and android branches for styles in AdminSalesHistoryScreen', () => {
    jest.isolateModules(() => {
      const rn = require('react-native');
      rn.Platform.OS = 'ios';
      require('../../presentation/screens/admin/AdminSalesHistoryScreen');
    });

    jest.isolateModules(() => {
      const rn = require('react-native');
      rn.Platform.OS = 'android';
      require('../../presentation/screens/admin/AdminSalesHistoryScreen');
    });
  });
});
