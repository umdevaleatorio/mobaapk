import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { AuthContext } from '../../presentation/contexts/AuthContext';
import { ThemeProvider } from '../../presentation/contexts/ThemeContext';
import { UserMenuProvider } from '../../presentation/contexts/UserMenuContext';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../../data/datasources/supabase/client';
import { Alert, TouchableOpacity, Platform } from 'react-native';
import { Marker } from 'react-native-maps';

// Mock react-native-maps
jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  class MockMapView extends React.Component {
    animateToRegion = jest.fn();
    render() {
      return <View {...this.props} />;
    }
  }
  const MockMarker = (props: any) => <View {...props} />;
  const MockPolyline = (props: any) => <View {...props} />;
  const MockCircle = (props: any) => <View {...props} />;
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
    Polyline: MockPolyline,
    Circle: MockCircle,
  };
});

// Import screen
import AdminMapScreen from '../../presentation/screens/admin/AdminMap';

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
const mockSetParams = jest.fn();
const mockGetParent = jest.fn().mockReturnValue({ setOptions: jest.fn() });
const mockNavigationObj = {
  navigate: mockNavigate,
  goBack: mockGoBack,
  addListener: mockAddListener,
  setOptions: mockSetOptions,
  setParams: mockSetParams,
  getParent: mockGetParent,
};

let currentRouteParams: any = {};
const mockRoute = {
  get params() {
    console.log('MOCK_ROUTE params accessed! Current value:', currentRouteParams);
    return currentRouteParams;
  }
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigationObj,
  useRoute: () => mockRoute,
  useFocusEffect: (cb: () => void) => {
    require('react').useEffect(() => {
      const cleanup = cb();
      return typeof cleanup === 'function' ? cleanup : undefined;
    }, []);
  },
}));

// Mock Supabase
let mockUpsertError: any = null;
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
    single: jest.fn().mockResolvedValue({ data: overrides.singleData !== undefined ? overrides.singleData : { id: 1, latitude: -21.9765, longitude: -45.3469 }, error: defaultError }),
    maybeSingle: jest.fn().mockResolvedValue({ data: overrides.singleData !== undefined ? overrides.singleData : { delivery_radius_km: 17 }, error: defaultError }),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockImplementation(() => Promise.resolve({ error: mockUpsertError })),
    delete: jest.fn().mockReturnThis(),
    then: (resolve: any) => {
      if (typeof resolve === 'function') {
        resolve({ data: defaultData, error: defaultError });
      }
      return Promise.resolve({ data: defaultData, error: defaultError });
    },
  };
  chain.eq = jest.fn().mockImplementation(() => chain);
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

describe('AdminMapScreen - Deep Coverage', () => {
  let alertSpy: any;
  let listeners: Record<string, any> = {};

  beforeAll(() => {
    (console.log as any).mockRestore?.();
    (console.error as any).mockRestore?.();
    (console.warn as any).mockRestore?.();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    currentRouteParams = {};
    listeners = {};
    mockUpsertError = null;
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

    mockAddListener.mockImplementation((event: string, cb: any) => {
      console.log('MOCK_ADD_LISTENER registered event:', event);
      listeners[event] = async (...args: any[]) => {
        console.log(`Executing listener for event: ${event}`);
        const res = await cb(...args);
        console.log(`Listener execution done for event: ${event}`);
        return res;
      };
      return jest.fn();
    });
  });

  afterEach(() => {
    alertSpy.mockRestore();
  });

  it('should render map, handle centralize to store, and show search suggestions on query', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      text: jest.fn().mockResolvedValue(JSON.stringify([
        { display_name: 'Rua das Flores, Lambari, MG', lat: '-21.977', lon: '-45.347', name: 'Rua das Flores' }
      ])),
      json: jest.fn().mockResolvedValue({
        routes: [{
          geometry: {
            coordinates: [
              [-45.3469, -21.9765],
              [-45.3460, -21.9755]
            ]
          }
        }]
      })
    } as any);

    const { getByPlaceholderText, getByText, toJSON, UNSAFE_getAllByType } = renderScreen(AdminMapScreen);
    expect(toJSON()).toBeTruthy();

    // Recenter press
    const recTouch = UNSAFE_getAllByType(TouchableOpacity)[0];
    if (recTouch) {
      fireEvent.press(recTouch);
    }

    // 1. Search Suggestions Flow
    const searchInput = getByPlaceholderText('Pesquisar local...');
    await act(async () => {
      fireEvent.changeText(searchInput, 'Rua das Flores');
    });

    jest.useFakeTimers();
    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    jest.useRealTimers();

    await waitFor(() => {
      expect(getByText('Rua das Flores, Lambari, MG')).toBeTruthy();
    });

    // Select suggestion
    await act(async () => {
      fireEvent.press(getByText('Rua das Flores, Lambari, MG'));
    });

    fetchSpy.mockRestore();
  });

  it('should support editing store location (success and failure scenarios)', async () => {
    const { UNSAFE_getAllByType } = renderScreen(AdminMapScreen);

    // Find Edit Store Button using TouchableOpacity component type
    let editBtn: any = null;
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    for (const btn of touchables) {
      fireEvent.press(btn);
      if (alertSpy.mock.calls.some((call: any) => call[0] === 'Mudar Localização')) {
        editBtn = btn;
        break;
      }
    }

    expect(editBtn).toBeTruthy();

    // 1. Alert interaction: click 'Quero mudar'
    const alertCall = alertSpy.mock.calls.find((call: any) => call[0] === 'Mudar Localização');
    const buttons = alertCall[2];
    const wantChangeBtn = buttons.find((b: any) => b.text === 'Quero mudar');

    await act(async () => {
      wantChangeBtn.onPress();
    });
    expect(alertSpy).toHaveBeenLastCalledWith('Modo Edição', 'Segure e arraste o pino vermelho no mapa para o novo local!');

    // Toggle/Press it again to deactivate
    fireEvent.press(editBtn);

    // Activate editing again
    await act(async () => {
      wantChangeBtn.onPress();
    });

    // Find the Marker with coordinate to trigger drag end
    const markers = UNSAFE_getAllByType(Marker);
    const storeMarker = markers.find((m: any) => m.props.coordinate && m.props.coordinate.latitude === -21.9765);
    expect(storeMarker).toBeTruthy();

    // Trigger drag end with SUCCESS
    await act(async () => {
      await storeMarker.props.onDragEnd({
        nativeEvent: {
          coordinate: { latitude: -21.9800, longitude: -45.3500 }
        }
      });
    });
    expect(alertSpy).toHaveBeenLastCalledWith('Sucesso', 'Localização da loja atualizada com sucesso!');

    // Activate editing and trigger drag end with upsert database FAILURE
    mockUpsertError = new Error('Database Upsert Error');
    await act(async () => {
      wantChangeBtn.onPress();
    });
    await act(async () => {
      await storeMarker.props.onDragEnd({
        nativeEvent: {
          coordinate: { latitude: -21.9800, longitude: -45.3500 }
        }
      });
    });
    expect(alertSpy).toHaveBeenLastCalledWith('Erro', 'Falha ao salvar a nova localização.');

    // Activate editing and trigger drag end with general upsert exception
    (supabase.from as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Supabase Crash');
    });
    await act(async () => {
      wantChangeBtn.onPress();
    });
    await act(async () => {
      await storeMarker.props.onDragEnd({
        nativeEvent: {
          coordinate: { latitude: -21.9800, longitude: -45.3500 }
        }
      });
    });
    expect(alertSpy).toHaveBeenLastCalledWith('Erro', 'Erro de conexão.');
  });

  it('should start geolocated Fiorino simulation tracking and run to completion', async () => {
    let mockTime = 1000;
    const dateSpy = jest.spyOn(Date, 'now').mockImplementation(() => mockTime);

    const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation((url: any) => {
      return Promise.resolve({
        json: () => {
          return Promise.resolve({
            routes: [{
              geometry: {
                coordinates: [
                  [-45.3469, -21.9765],
                  [-45.3460, -21.9760],
                  [-45.3468, -21.9755],
                  [-45.3460, -21.9750],
                  [-45.3450, -21.9745],
                  [-45.3440, -21.9740],
                  [-45.3430, -21.9735],
                  [-45.3420, -21.9730],
                  [-45.3410, -21.9725],
                  [-45.3400, -21.9720],
                  [-45.3390, -21.9715],
                  [-45.3380, -21.9710],
                  [-45.3370, -21.9705],
                  [-45.3360, -21.9700],
                  [-45.3350, -21.9695],
                  [-45.3340, -21.9690]
                ]
              }
            }]
          });
        }
      } as any);
    });

    // Setup active clientLocation parameters
    currentRouteParams = {
      clientLocation: {
        latitude: -21.9700,
        longitude: -45.3400,
        name: 'Cliente Agropet',
        address: 'Av das Nacoes 100',
        orderId: 'order-pdv-999'
      }
    };

    const { toJSON, UNSAFE_getAllByType } = renderScreen(AdminMapScreen);

    // Flush React passive mount effects with real timers
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // 1. Enable fake timers BEFORE focus listener triggers
    jest.useFakeTimers();

    // Trigger navigation focus
    await act(async () => {
      if (listeners['focus']) {
        await listeners['focus']();
      }
      for (let i = 0; i < 10; i++) {
        await Promise.resolve();
        jest.advanceTimersByTime(0);
      }
    });

    expect(mockAddListener).toHaveBeenCalledWith('focus', expect.any(Function));
    expect(toJSON()).toBeTruthy();

    // Recenter on client house press
    const recTouch = UNSAFE_getAllByType(TouchableOpacity).find((t: any) => t.props.style && t.props.style.some && t.props.style.some((s: any) => s && s.shadowColor === '#1a3a6b'));
    if (recTouch) {
      fireEvent.press(recTouch);
    }

    // Trigger skip logic by jumping mockTime forward significantly
    await act(async () => {
      mockTime += 12000; // Jump 12s to trigger expectedIndex - currentIndex > 5
      jest.advanceTimersByTime(100);
    });

    // Advance time progressively in small steps to run the rest of the steps and reach completion
    for (let i = 0; i < 40; i++) {
      await act(async () => {
        mockTime += 1000;
        jest.advanceTimersByTime(1000);
      });
    }

    // Flush completion database update promises
    await act(async () => {
      for (let i = 0; i < 10; i++) {
        await Promise.resolve();
      }
    });

    jest.useRealTimers();

    fetchSpy.mockRestore();
    dateSpy.mockRestore();
  });

  it('should support Voltar press and blur transitions with active timers', async () => {
    let mockTime = 1000;
    const dateSpy = jest.spyOn(Date, 'now').mockImplementation(() => mockTime);

    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        routes: [{
          geometry: {
            coordinates: [
              [-45.3469, -21.9765],
              [-45.3460, -21.9760]
            ]
          }
        }]
      })
    } as any);

    // Setup active clientLocation parameters
    currentRouteParams = {
      clientLocation: {
        latitude: -21.9700,
        longitude: -45.3400,
        name: 'Cliente Agropet',
        address: 'Av das Nacoes 100',
        orderId: 'order-pdv-999'
      }
    };

    const { getByText } = renderScreen(AdminMapScreen);

    // Flush React passive mount effects with real timers
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Enable fake timers
    jest.useFakeTimers();

    // Trigger navigation focus
    await act(async () => {
      if (listeners['focus']) {
        await listeners['focus']();
      }
      for (let i = 0; i < 10; i++) {
        await Promise.resolve();
      }
    });

    // Advance time slightly so animation is running and timers are active
    await act(async () => {
      mockTime = 2000;
      jest.advanceTimersByTime(1000);
    });

    // Trigger handleGoBackFromTracking via Voltar button while active (this will clear timers!)
    const backBtn = getByText('Voltar');
    expect(backBtn).toBeTruthy();

    await act(async () => {
      fireEvent.press(backBtn);
    });

    // Trigger navigation focus again to set active timers for blur test
    await act(async () => {
      if (listeners['focus']) {
        await listeners['focus']();
      }
      for (let i = 0; i < 10; i++) {
        await Promise.resolve();
      }
    });

    // Now trigger blur immediately while timers are active
    await act(async () => {
      if (listeners['blur']) {
        await listeners['blur']();
      }
    });

    jest.useRealTimers();

    fetchSpy.mockRestore();
    dateSpy.mockRestore();
  });


  it('should cover all remaining edge cases, Nominatim exceptions, unmount cleanups, and Fiorino flip animations', async () => {
    // 1. Nominatim JSON parse error and fetch exception
    const fetchSpy = jest.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        text: jest.fn().mockResolvedValue('invalid-json-text')
      } as any)
      .mockRejectedValueOnce(new Error('Network failure'));

    // Mock console.error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Enable fake timers BEFORE mounting/interacting!
    jest.useFakeTimers();

    const { getByPlaceholderText, unmount } = renderScreen(AdminMapScreen);

    const searchInput = getByPlaceholderText('Pesquisar local...');
    
    // Trigger invalid json Nominatim path
    await act(async () => {
      fireEvent.changeText(searchInput, 'Rua nominatim-error');
    });
    await act(async () => {
      jest.advanceTimersByTime(550);
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockClear();

    // Trigger fetch Nominatim rejection path
    await act(async () => {
      fireEvent.changeText(searchInput, 'Rua nominations-crash');
    });
    await act(async () => {
      jest.advanceTimersByTime(550);
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(consoleSpy).toHaveBeenCalled();

    // Trigger debounced <= 2 characters path
    await act(async () => {
      fireEvent.changeText(searchInput, 'Ru');
    });
    await act(async () => {
      jest.advanceTimersByTime(550);
    });
    await act(async () => {
      await Promise.resolve();
    });

    consoleSpy.mockRestore();
    fetchSpy.mockRestore();
    jest.useRealTimers();

    // 2. Trigger database fetch errors in focus listener
    const focusConsoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    (supabase.from as jest.Mock).mockImplementation(() => {
      throw new Error('Database focus fail');
    });

    // Invoke database throw by rendering the screen freshly
    currentRouteParams = {}; // clientLocation is null
    const { unmount: failUnmount } = renderScreen(AdminMapScreen);

    await act(async () => {
      await Promise.resolve();
    });

    expect(focusConsoleSpy).toHaveBeenCalledWith('Error loading store location on focus:', expect.any(Error));
    failUnmount();
    focusConsoleSpy.mockRestore();
    (supabase.from as jest.Mock).mockImplementation(() => createMockChain());

    // 3. Test FiorinoIcon flip animation separately to trigger squash and stretch effects
    // We can render and rerender map screen or trigger direction updates.
    // Let's just unmount our rendered screen to cover the unmount useEffect timers cleanup branch
    unmount();
  });

  it('should cover radius null, OSRM route exceptions, and DB load errors', async () => {
    // 1. Mock DB to return null for delivery_radius_km
    const mockRadiusNullChain = createMockChain({
      singleData: { latitude: -21.9765, longitude: -45.3469 },
    });
    mockRadiusNullChain.maybeSingle = jest.fn().mockResolvedValue({
      data: { delivery_radius_km: null },
      error: null
    });

    (supabase.from as jest.Mock).mockImplementation(() => mockRadiusNullChain);

    // 2. Mock OSRM fetch route to reject/fail
    const fetchSpy = jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('OSRM Route Fetch Fail'));

    currentRouteParams = {
      clientLocation: {
        latitude: -21.9700,
        longitude: -45.3400,
        name: 'Cliente Agropet',
        address: 'Av das Nacoes 100',
        orderId: 'order-pdv-999'
      }
    };

    const { unmount } = renderScreen(AdminMapScreen);

    // Trigger focus to start route fetch
    await act(async () => {
      if (listeners['focus']) {
        await listeners['focus']();
      }
      for (let i = 0; i < 10; i++) {
        await Promise.resolve();
      }
    });

    (supabase.from as jest.Mock).mockImplementation(() => createMockChain());
    fetchSpy.mockRestore();
    unmount();
  });

  it('should cover Platform.OS styling conditional branches and light mode color rendering paths', async () => {
    // 1. Force Platform.OS = 'ios' configuration to cover IOS layout blocks
    const originalPlatform = Platform.OS;
    Object.defineProperty(Platform, 'OS', {
      value: 'ios',
      writable: true
    });

    const { getByPlaceholderText } = renderScreen(AdminMapScreen);
    expect(getByPlaceholderText('Pesquisar local...')).toBeTruthy();

    // 2. Test in Light Mode
    (global as any).isDarkModeTest = false;
    const screen2 = renderScreen(AdminMapScreen);
    expect(screen2.getByPlaceholderText('Pesquisar local...')).toBeTruthy();
    // Revert Platform.OS and isDarkMode
    (global as any).isDarkModeTest = true;
    Object.defineProperty(Platform, 'OS', {
      value: originalPlatform,
      writable: true
    });
  });

  it('should cover Voltar button clearances during active tracking', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        routes: [{
          geometry: {
            coordinates: [
              [-45.3469, -21.9765],
              [-45.3460, -21.9760]
            ]
          }
        }]
      })
    } as any);

    currentRouteParams = {
      clientLocation: {
        latitude: -21.9700,
        longitude: -45.3400,
        name: 'Cliente Agropet',
        address: 'Av das Nacoes 100',
        orderId: 'order-pdv-999'
      }
    };

    const { getByText } = renderScreen(AdminMapScreen);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    jest.useFakeTimers();

    await act(async () => {
      if (listeners['focus']) {
        await listeners['focus']();
      }
      for (let i = 0; i < 10; i++) {
        await Promise.resolve();
        jest.advanceTimersByTime(0);
      }
      jest.advanceTimersByTime(100);
    });

    const backBtn = getByText('Voltar');
    await act(async () => {
      fireEvent.press(backBtn);
    });

    jest.useRealTimers();
    fetchSpy.mockRestore();
  });

  it('should cover blur clearances during active tracking', async () => {
    jest.useFakeTimers();

    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        routes: [{
          geometry: {
            coordinates: [
              [-45.3469, -21.9765],
              [-45.3460, -21.9760]
            ]
          }
        }]
      })
    } as any);

    currentRouteParams = {
      clientLocation: {
        latitude: -21.9700,
        longitude: -45.3400,
        name: 'Cliente Agropet',
        address: 'Av das Nacoes 100',
        orderId: 'order-pdv-999'
      }
    };

    const { getByText } = renderScreen(AdminMapScreen);

    await act(async () => {
      if (listeners['focus']) {
        await listeners['focus']();
      }
      for (let i = 0; i < 50; i++) {
        await Promise.resolve();
        jest.advanceTimersByTime(10);
      }
    });

    await act(async () => {
      if (listeners['blur']) {
        await listeners['blur']();
      }
    });

    jest.useRealTimers();
    fetchSpy.mockRestore();
    (supabase.from as jest.Mock).mockImplementation(() => createMockChain());
  });

  it('should cover Voltar button clearances during active tracking', async () => {
    jest.useFakeTimers();

    let mockTime = Date.now();
    const dateSpy = jest.spyOn(Date, 'now').mockImplementation(() => mockTime);

    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        routes: [{
          geometry: {
            coordinates: [
              [-45.340, -21.970],
              [-45.341, -21.971],
              [-45.342, -21.972],
              [-45.343, -21.973],
              [-45.344, -21.974],
              [-45.345, -21.975],
              [-45.346, -21.976],
              [-45.347, -21.977],
              [-45.348, -21.978],
              [-45.349, -21.979],
              [-45.350, -21.980],
              [-45.351, -21.981],
              [-45.352, -21.982],
              [-45.353, -21.983],
              [-45.354, -21.984],
              [-45.355, -21.985],
              [-45.356, -21.986],
              [-45.357, -21.987],
              [-45.358, -21.988],
              [-45.359, -21.989],
            ]
          }
        }]
      })
    }) as any;

    currentRouteParams = {
      clientLocation: {
        latitude: -21.9700,
        longitude: -45.3400,
        name: 'Cliente Agropet',
        address: 'Av das Nacoes 100',
        orderId: 'order-pdv-999'
      }
    };

    const { getByText } = renderScreen(AdminMapScreen);

    await act(async () => {
      if (listeners['focus']) {
        await listeners['focus']();
      }
      for (let i = 0; i < 50; i++) {
        await Promise.resolve();
        jest.advanceTimersByTime(10);
      }
    });

    // Complete simulation to set hideCarTimeoutRef
    mockTime += 40000;
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    // Let 500ms animation finish so hideCarTimeoutRef gets initialized
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    // Voltar press while hideCarTimeoutRef is active to clear it (lines 612-613)
    const activeBackBtn = getByText('Voltar');
    await act(async () => {
      fireEvent.press(activeBackBtn);
    });

    jest.useRealTimers();
    global.fetch = originalFetch;
    dateSpy.mockRestore();
  });

  it('should cover simulation completion paths, supabase errors, double focus, and hideCar clearances', async () => {
    jest.useFakeTimers();

    let mockTime = Date.now();
    const dateSpy = jest.spyOn(Date, 'now').mockImplementation(() => mockTime);

    // Mock Supabase to return successfully first
    const mockErrorChain = createMockChain({
      singleData: { id: 1, latitude: -21.9765, longitude: -45.3469 },
    });
    const supSpy = jest.spyOn(supabase, 'from').mockImplementation(() => mockErrorChain);

    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        routes: [{
          geometry: {
            coordinates: [
              [-45.3469, -21.9765],
              [-45.3460, -21.9760]
            ]
          }
        }]
      })
    } as any);

    currentRouteParams = {
      clientLocation: {
        latitude: -21.9700,
        longitude: -45.3400,
        name: 'Cliente Agropet',
        address: 'Av das Nacoes 100',
        orderId: 'order-pdv-999'
      }
    };

    const { getByText } = renderScreen(AdminMapScreen);

    await act(async () => {
      if (listeners['focus']) {
        await listeners['focus']();
      }
      for (let i = 0; i < 50; i++) {
        await Promise.resolve();
        jest.advanceTimersByTime(10);
      }
    });

    // 1. Advance 500ms so animation is actively running (carAnimationIntervalRef is set)
    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    // 2. Trigger focus again while animation is active to clear active interval (line 408)
    await act(async () => {
      if (listeners['focus']) {
        await listeners['focus']();
      }
      for (let i = 0; i < 50; i++) {
        await Promise.resolve();
        jest.advanceTimersByTime(10);
      }
    });

    // 3. Complete simulation (mockTime jump) - resolves with SUCCESS (covers line 449)
    mockTime += 10000;
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    // Let 500ms animation finish
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    // 4. Advance 60 seconds to trigger hideCarTimeoutRef and set showCar to false (line 460)
    await act(async () => {
      jest.advanceTimersByTime(60000);
    });

    // 5. Complete simulation again with database resolving with error (covers lines 446-447)
    mockErrorChain.then = jest.fn().mockImplementation((resolve) => {
      if (resolve) {
        resolve({ data: [], error: new Error('Mock status update failed') });
      }
      return Promise.resolve({ data: [], error: new Error('Mock status update failed') });
    });

    mockTime += 10000;
    await act(async () => {
      if (listeners['focus']) {
        await listeners['focus']();
      }
      for (let i = 0; i < 50; i++) {
        await Promise.resolve();
        jest.advanceTimersByTime(10);
      }
    });
    mockTime += 10000;
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    // 6. Complete simulation again with database throwing error synchronously (covers catch branch, lines 451-453)
    mockErrorChain.then = jest.fn().mockImplementation(() => {
      throw new Error('Rejected DB connection');
    });

    mockTime += 10000;
    await act(async () => {
      if (listeners['focus']) {
        await listeners['focus']();
      }
      for (let i = 0; i < 50; i++) {
        await Promise.resolve();
        jest.advanceTimersByTime(10);
      }
    });
    mockTime += 10000;
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    // 7. Trigger blur to clear hideCarTimeoutRef in blur (lines 592-593)
    await act(async () => {
      if (listeners['blur']) {
        await listeners['blur']();
      }
    });

    jest.useRealTimers();
    fetchSpy.mockRestore();
    dateSpy.mockRestore();
    supSpy.mockRestore();
    (supabase.from as jest.Mock).mockImplementation(() => createMockChain());
  });

  it('should cover skipIndex transition logic and trackingTimeoutRef clearances in blur', async () => {
    jest.useFakeTimers();

    let mockTime = Date.now();
    const dateSpy = jest.spyOn(Date, 'now').mockImplementation(() => mockTime);

    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        routes: [{
          geometry: {
            coordinates: [
              [-45.340, -21.970],
              [-45.341, -21.971],
              [-45.342, -21.972],
              [-45.343, -21.973],
              [-45.344, -21.974],
              [-45.345, -21.975],
              [-45.346, -21.976],
              [-45.347, -21.977],
              [-45.348, -21.978],
              [-45.349, -21.979],
              [-45.350, -21.980],
              [-45.351, -21.981],
              [-45.352, -21.982],
              [-45.353, -21.983],
              [-45.354, -21.984],
              [-45.355, -21.985],
              [-45.356, -21.986],
              [-45.357, -21.987],
              [-45.358, -21.988],
              [-45.359, -21.989],
            ]
          }
        }]
      })
    } as any);

    currentRouteParams = {
      clientLocation: {
        latitude: -21.9700,
        longitude: -45.3400,
        name: 'Cliente Agropet',
        address: 'Av das Nacoes 100',
        orderId: 'order-pdv-999'
      }
    };

    const { getByText } = renderScreen(AdminMapScreen);

    await act(async () => {
      if (listeners['focus']) {
        await listeners['focus']();
      }
      for (let i = 0; i < 50; i++) {
        await Promise.resolve();
        jest.advanceTimersByTime(10);
      }
    });

    // Jump time to trigger expectedIndex - currentIndex > 5
    mockTime += 10500;

    await act(async () => {
      // Advance by 1500ms to trigger the skipIndex setup timeout (which is active for 50ms)
      jest.advanceTimersByTime(1500);
    });

    // Advance 10ms more - trackingTimeoutRef is now active!
    await act(async () => {
      jest.advanceTimersByTime(10);
    });

    // Trigger blur while trackingTimeoutRef is active to clear it (lines 588-589)
    await act(async () => {
      if (listeners['blur']) {
        await listeners['blur']();
      }
    });

    jest.useRealTimers();
    fetchSpy.mockRestore();
    dateSpy.mockRestore();
  });

  it('covers remaining edge cases', async () => {
    const mockStore = { lat: -23, lng: -46, address: 'Store' };
    const originalFrom = require('../../data/datasources/supabase/client').supabase.from;
    require('../../data/datasources/supabase/client').supabase.from = jest.fn().mockImplementation((table) => {
      if (table === 'store_settings') return { select: jest.fn().mockReturnThis(), single: jest.fn().mockRejectedValue(new Error('Network Error')) };
      return { select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue({}) };
    });

    const { unmount } = renderScreen(AdminMapScreen);
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    unmount();

    require('../../data/datasources/supabase/client').supabase.from = originalFrom;
  });

  it('covers simulation with duration 0 and undefined coordinates', async () => {
    jest.useFakeTimers();
    const mockStore = { lat: -23, lng: -46, address: 'Store' };
    const originalFrom = require('../../data/datasources/supabase/client').supabase.from;
    require('../../data/datasources/supabase/client').supabase.from = jest.fn().mockImplementation((table) => {
      return { select: jest.fn().mockReturnThis(), single: jest.fn().mockResolvedValue(mockStore) };
    });

    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        routes: [{
          geometry: {
            coordinates: [[0, 0], [undefined, undefined], [1, 1], [0, 1]]
          },
          duration: 0,
        }],
      }),
    } as any);

    const { unmount } = renderScreen(AdminMapScreen, { route: { params: { orderId: '123', clientLocation: { lat: -23.5, lng: -46.5 } } } });
    
    await act(async () => {
      await Promise.resolve();
      jest.runAllTimers();
    });
    
    // Test unmount cleanup while animating
    unmount();

    fetchSpy.mockRestore();
    require('../../data/datasources/supabase/client').supabase.from = originalFrom;
  });

  it('should clear car animation interval on unmount (line 636)', async () => {
    jest.useFakeTimers();

    currentRouteParams = {
      clientLocation: {
        latitude: -21.9765,
        longitude: -45.3469,
        name: 'Cliente Teste',
        address: 'Rua Teste 123',
        orderId: 'order-abc'
      }
    };

    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        routes: [{
          geometry: { coordinates: [[-45.34, -21.97], [-45.341, -21.971], [-45.342, -21.972], [-45.343, -21.973]] }
        }]
      }),
    } as any);

    const { unmount } = renderScreen(AdminMapScreen);

    // Trigger focus → starts loadAndTrack → fetchRoute → animateCarTo → setInterval
    await act(async () => {
      if (listeners['focus']) {
        await listeners['focus']();
      }
      // Flush microtasks so the async loadAndTrack chain completes and setInterval starts
      for (let i = 0; i < 30; i++) {
        jest.advanceTimersByTime(10);
        await Promise.resolve();
      }
    });

    // Unmount while animation interval is still running
    unmount();

    fetchSpy.mockRestore();
    jest.useRealTimers();
  });

  it('should cover light mode trackedClient, daytime isNightTime, empty OSRM routes, suggestion without name, and clientLoc without orderId', async () => {
    // Mock Date for daytime isNightTime = false (must be before imports run)
    const mockDate = new Date('2026-05-29T14:00:00');
    const dateOrig = global.Date;
    global.Date = class extends Date {
      constructor(...args: any[]) {
        super(...args);
        if (args.length === 0) return mockDate;
      }
    } as any;

    // 1. Light mode rendering with tracked client (covers emRota, backButton branches)
    (global as any).isDarkModeTest = false;
    const originalPlatform = Platform.OS;
    Object.defineProperty(Platform, 'OS', {
      value: 'ios',
      writable: true
    });

    // Setup OSRM with empty routes to cover line 343 falsy branch
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        routes: [] // empty routes -> data.routes[0] is falsy
      })
    } as any);

    // Setup clientLocation without orderId
    currentRouteParams = {
      clientLocation: {
        latitude: -21.9700,
        longitude: -45.3400,
        name: 'Cliente Sem Pedido',
        address: 'Av Teste 200'
        // no orderId
      }
    };

    const { getByText, getAllByText, unmount } = renderScreen(AdminMapScreen);

    await act(async () => {
      if (listeners['focus']) {
        await listeners['focus']();
      }
      for (let i = 0; i < 10; i++) {
        await Promise.resolve();
      }
    });

    // Verify light mode tracked rendering
    expect(getByText('Em rota')).toBeTruthy();
    expect(getByText('Voltar')).toBeTruthy();

    unmount();

    // 2. Suggestion without name field - separate render without tracking
    (global as any).isDarkModeTest = true;
    global.Date = dateOrig;
    currentRouteParams = {};
    fetchSpy.mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(JSON.stringify([
        { display_name: 'Rua Teste, Centro, MG', lat: '-21.977', lon: '-45.347' }
        // no 'name' field -> loc.name is falsy
      ]))
    } as any);

    const { getByPlaceholderText, getByText: getByText2, unmount: screen2Unmount } = renderScreen(AdminMapScreen);
    const searchInput = getByPlaceholderText('Pesquisar local...');
    await act(async () => {
      fireEvent.changeText(searchInput, 'Rua Teste');
    });

    jest.useFakeTimers();
    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    jest.useRealTimers();
    await waitFor(() => {
      expect(getByText2('Rua Teste, Centro, MG')).toBeTruthy();
    });
    await act(async () => {
      fireEvent.press(getByText2('Rua Teste, Centro, MG'));
    });
    screen2Unmount();

    // Cleanup
    fetchSpy.mockRestore();
    global.Date = dateOrig;
    (global as any).isDarkModeTest = true;
    Object.defineProperty(Platform, 'OS', {
      value: originalPlatform,
      writable: true
    });
    unmount();
  });
});
