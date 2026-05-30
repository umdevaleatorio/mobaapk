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
import AdminProfileScreen from '../../presentation/screens/admin/AdminProfileScreen';

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
// AdminProfileScreen
// ============================================================
describe('AdminProfileScreen - Deep Coverage', () => {
  let alertSpy: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (supabase.from as jest.Mock).mockImplementation(() => createMockChain({
      singleData: { name: 'Admin User', username: 'adminuser', email: 'admin@test.com', phone: '11999998888', role: 'admin', rua: 'Rua A', bairro: 'Bairro B', cep: '37480-000', numero: '10' }
    }));

    const ImagePicker = require('expo-image-picker');
    ImagePicker.requestCameraPermissionsAsync.mockResolvedValue({ status: 'granted', granted: true });
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValue({ status: 'granted', granted: true });
    ImagePicker.launchCameraAsync.mockResolvedValue({ canceled: true, assets: [] });
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({ canceled: true, assets: [] });
  });

  afterEach(() => {
    alertSpy.mockRestore();
    jest.useRealTimers();
  });

  it('should render profile screen and trigger name debounced updates', async () => {
    const { getByPlaceholderText } = renderScreen(AdminProfileScreen, {
      navigation: { addListener: jest.fn().mockReturnValue(jest.fn()), navigate: jest.fn() },
    });

    const nameInput = getByPlaceholderText('Digite o seu nome aqui...');
    await act(async () => {
      fireEvent.changeText(nameInput, 'Admin New Name');
    });

    // Advance debounce timers
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    expect(supabase.from).toHaveBeenCalledWith('users');
  });

  it('should handle photo picker camera and gallery selections', async () => {
    const { getByText } = renderScreen(AdminProfileScreen, {
      navigation: { addListener: jest.fn().mockReturnValue(jest.fn()), navigate: jest.fn() },
    });

    const cameraPermSpy = jest.spyOn(ImagePicker, 'requestCameraPermissionsAsync').mockResolvedValue({ status: 'granted', granted: true } as any);
    const cameraLaunchSpy = jest.spyOn(ImagePicker, 'launchCameraAsync').mockResolvedValue({ canceled: false, assets: [{ uri: 'avatar-cam-uri' }] } as any);

    fireEvent.press(getByText('Alterar foto'));
    await act(async () => {
      fireEvent.press(getByText('Tirar Foto'));
    });

    expect(cameraLaunchSpy).toHaveBeenCalled();
    cameraPermSpy.mockRestore();
    cameraLaunchSpy.mockRestore();
  });

  it('should handle username modal workflows including validation, suggestions, RPC, and saving to database', async () => {
    const selectEmptyUsernameSpy = jest.spyOn(supabase, 'from').mockImplementation(() => createMockChain({
      singleData: { name: 'Admin User', username: '', email: 'admin@test.com', phone: '11999998888', role: 'admin', rua: 'Rua A', bairro: 'Bairro B', cep: '37480-000', numero: '10' }
    }));
    const rpcSpy = jest.spyOn(supabase, 'rpc').mockResolvedValue({ data: true, error: null } as any);
    const { getByText, getByPlaceholderText } = renderScreen(AdminProfileScreen, {
      navigation: { addListener: jest.fn().mockReturnValue(jest.fn()), navigate: jest.fn() },
    });

    await act(async () => {
      jest.advanceTimersByTime(200);
    });

    // 1. Open username modal
    fireEvent.press(getByText('Definir nome de usuário...'));

    // 2. Type short username (goes to idle)
    const input = getByPlaceholderText('Ex: usuario123');
    await act(async () => {
      fireEvent.changeText(input, 'ab');
    });

    // 3. Type invalid format username (goes to invalid_format)
    await act(async () => {
      fireEvent.changeText(input, 'invalid@user!');
    });

    // 4. Type a valid duplicate username (rpc returns true/taken)
    await act(async () => {
      fireEvent.changeText(input, 'takenuser');
    });
    await act(async () => {
      jest.advanceTimersByTime(600);
    });
    expect(rpcSpy).toHaveBeenCalled();

    // 5. Select a suggestion from suggestion badge
    const sugText = getByText('takenuser_721');
    fireEvent.press(sugText);

    // 6. Test duplicate username update error (code 23505)
    rpcSpy.mockResolvedValueOnce({ data: false, error: null } as any);
    await act(async () => {
      jest.advanceTimersByTime(600);
    });
    const updateSpy = jest.spyOn(supabase, 'from').mockImplementation(() => createMockChain({
      error: { code: '23505', message: 'duplicate key' }
    }));
    await act(async () => {
      fireEvent.press(getByText('Confirmar'));
    });
    // Trigger alert confirming save
    const confirmHandler = alertSpy.mock.calls[0][2][1].onPress;
    await act(async () => {
      await confirmHandler();
    });
    expect(alertSpy).toHaveBeenCalledWith('Erro', 'Este nome de usuário já está sendo usado, por favor escolha outro.');
    updateSpy.mockRestore();

    // 7. Test general update error
    const updateErrorSpy = jest.spyOn(supabase, 'from').mockImplementation(() => createMockChain({
      error: { code: '500', message: 'DB error' }
    }));
    await act(async () => {
      await confirmHandler();
    });
    expect(alertSpy).toHaveBeenCalledWith('Erro', 'Não foi possível salvar o nome de usuário.');
    updateErrorSpy.mockRestore();

    // 8. Test success path
    const updateSuccessSpy = jest.spyOn(supabase, 'from').mockImplementation(() => createMockChain());
    await act(async () => {
      await confirmHandler();
    });
    updateSuccessSpy.mockRestore();
    rpcSpy.mockRestore();
    selectEmptyUsernameSpy.mockRestore();
  });

  it('should handle phone modal workflows: cadastrar, validar, alterar, and cancel flows', async () => {
    const { getByText, getByPlaceholderText } = renderScreen(AdminProfileScreen, {
      navigation: { addListener: jest.fn().mockReturnValue(jest.fn()), navigate: jest.fn() },
    });

    // 1. Cadastrar phone
    fireEvent.press(getByText('Cadastrar'));
    const phoneInput = getByPlaceholderText('+55 (11) 99999-9999');
    fireEvent.changeText(phoneInput, '11999992222');
    
    // Confirm goes to validating
    await act(async () => {
      fireEvent.press(getByText('Confirmar'));
    });

    // We are now in validating. VerifyOtp/Confirm will save
    const updateSpy = jest.spyOn(supabase, 'from').mockImplementation(() => createMockChain());
    await act(async () => {
      fireEvent.press(getByText('Confirmar'));
    });
    expect(updateSpy).toHaveBeenCalled();
    updateSpy.mockRestore();
  });

  it('should handle email modal workflows: change same email, duplicate check, validation OTP correct and error flows', async () => {
    const { getByText, getByPlaceholderText, getAllByText } = renderScreen(AdminProfileScreen, {
      navigation: { addListener: jest.fn().mockReturnValue(jest.fn()), navigate: jest.fn() },
    });

    // 1. Open email modal
    fireEvent.press(getAllByText('Alterar')[0]);

    // 2. Type same email (causes same email error)
    const emailIn = getByPlaceholderText('novo@email.com');
    await act(async () => {
      fireEvent.changeText(emailIn, 'admin@test.com');
      fireEvent.press(getByText('Confirmar'));
    });

    // 3. Type duplicate email from another account (causes duplicate email error)
    const selectSpy = jest.spyOn(supabase, 'from').mockImplementation(() => createMockChain({
      singleData: { id: 'other-user-id' }
    }));
    await act(async () => {
      fireEvent.changeText(emailIn, 'other@test.com');
      fireEvent.press(getByText('Confirmar'));
    });
    selectSpy.mockRestore();

    // 4. Type a new valid email and trigger auth verification error
    const selectEmptySpy = jest.spyOn(supabase, 'from').mockImplementation(() => createMockChain({
      singleData: null
    }));
    const authUpdateSpy = jest.spyOn(supabase.auth, 'updateUser').mockResolvedValue({ data: {}, error: { message: 'auth error' } } as any);
    await act(async () => {
      fireEvent.changeText(emailIn, 'newemail@test.com');
      fireEvent.press(getByText('Confirmar'));
    });
    authUpdateSpy.mockRestore();

    // 5. Type a new valid email and trigger auth verification success (enters OTP validate mode)
    const authUpdateSuccessSpy = jest.spyOn(supabase.auth, 'updateUser').mockResolvedValue({ data: {}, error: null } as any);
    await act(async () => {
      fireEvent.press(getByText('Confirmar'));
    });
    authUpdateSuccessSpy.mockRestore();

    // 6. OTP verification failure (wrong token)
    const verifyOtpErrorSpy = jest.spyOn(supabase.auth, 'verifyOtp').mockResolvedValue({ data: {}, error: { message: 'Invalid OTP' } } as any);
    const otpInput = getByPlaceholderText('Código de 6 dígitos...');
    await act(async () => {
      fireEvent.changeText(otpInput, '123456');
      fireEvent.press(getByText('Confirmar'));
    });
    verifyOtpErrorSpy.mockRestore();

    // 7. OTP verification success
    const verifyOtpSuccessSpy = jest.spyOn(supabase.auth, 'verifyOtp').mockResolvedValue({ data: {}, error: null } as any);
    await act(async () => {
      fireEvent.press(getByText('Confirmar'));
    });
    verifyOtpSuccessSpy.mockRestore();
    selectEmptySpy.mockRestore();
  });

  it('should handle address confirmation alert lookups, cancellation, fallback coordinates saving, and map navigation', async () => {
    // 1. Mock empty response for geocoding search (to trigger Coordinates not found Alert)
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      json: jest.fn().mockResolvedValue([])
    } as any);

    mockNavigate.mockClear();
    const { getByText } = renderScreen(AdminProfileScreen, {
      navigation: { addListener: jest.fn().mockReturnValue(jest.fn()), navigate: mockNavigate },
    });

    await act(async () => {
      jest.advanceTimersByTime(200);
    });

    // Trigger handleSendAddress
    await act(async () => {
      fireEvent.press(getByText('Enviar'));
    });

    // Expect alert to have been called with "Endereço não localizado"
    expect(alertSpy).toHaveBeenCalledWith(
      'Endereço não localizado',
      'Não conseguimos encontrar as coordenadas exatas deste endereço no mapa. Deseja salvar mesmo assim?',
      expect.any(Array)
    );

    // Cancel geocoding save
    const cancelHandler = alertSpy.mock.calls[0][2][0].onPress;
    if (cancelHandler) await act(async () => { await cancelHandler(); });

    // Salvar mesmo assim
    const saveAnywayHandler = alertSpy.mock.calls[0][2][1].onPress;
    const updateSpy = jest.spyOn(supabase, 'from').mockImplementation(() => createMockChain({
      error: new Error('Save error')
    }));
    await act(async () => {
      await saveAnywayHandler();
    });
    expect(alertSpy).toHaveBeenCalledWith('Erro', 'Não foi possível salvar o endereço.');
    updateSpy.mockRestore();

    // Success save path with coordinates - Ver no Mapa navigation
    const updateSuccessSpy = jest.spyOn(supabase, 'from').mockImplementation(() => createMockChain());
    fetchSpy.mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue([
        { lat: '-22.0', lon: '-45.0' }
      ])
    } as any);
    await act(async () => {
      fireEvent.press(getByText('Enviar'));
    });
    
    // Expect success alert and click "Ver no Mapa"
    expect(alertSpy).toHaveBeenCalledWith(
      'Endereço da Loja Enviado!',
      expect.any(String),
      expect.any(Array)
    );
    const verNoMapaHandler = alertSpy.mock.calls[2][2][0].onPress;
    await act(async () => {
      await verNoMapaHandler();
    });
    expect(mockNavigate).toHaveBeenCalledWith('AdminTabs', { screen: 'Mapa' });

    updateSuccessSpy.mockRestore();
    fetchSpy.mockRestore();
  });

  it('should handle manual address coordinate lookups and autocomplete selections', async () => {
    let nullRefIndex = 0;
    const nullRefs: any[] = [];

    const originalUseRef = React.useRef;
    const useRefSpy = jest.spyOn(React, 'useRef').mockImplementation((init) => {
      if (init === null) {
        if (!nullRefs[nullRefIndex]) {
          nullRefs[nullRefIndex] = {
            _current: null,
            get current() {
              return this._current;
            },
            set current(val) {
              if (val && typeof val === 'object') {
                val.isFocused = () => true;
                val.focus = () => {};
              }
              this._current = val;
            }
          };
        }
        const ref = nullRefs[nullRefIndex];
        nullRefIndex++;
        return ref;
      }
      return originalUseRef(init);
    });

    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      text: jest.fn().mockResolvedValue(JSON.stringify([
        { display_name: 'Rua Principal, Lambari, MG', lat: '-21.975', lon: '-45.345', address: { road: 'Rua Principal' } }
      ]))
    } as any);

    try {
      const ProfileWrapper = (props: any) => {
        nullRefIndex = 0;
        return <AdminProfileScreen {...props} />;
      };

      const { getByText, getByPlaceholderText } = renderScreen(ProfileWrapper, {
        navigation: { addListener: jest.fn().mockReturnValue(jest.fn()), navigate: jest.fn() },
      });

      const ruaInput = getByPlaceholderText('Digite sua rua...');
      (ruaInput as any).isFocused = jest.fn().mockReturnValue(true);

      // Focus and change text to trigger autocomplete suggestions
      fireEvent(ruaInput, 'focus');
      await act(async () => {
        fireEvent.changeText(ruaInput, 'Rua Principal');
      });

      await act(async () => {
        jest.advanceTimersByTime(500);
      });

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalled();
      });

      // Select recommendation
      const recommendation = getByText('Rua Principal, Lambari, MG');
      await act(async () => {
        fireEvent.press(recommendation);
      });

      // Click Enviar Address to trigger Geocoding lookup
      await act(async () => {
        fireEvent.press(getByText('Enviar'));
      });
    } finally {
      fetchSpy.mockRestore();
      useRefSpy.mockRestore();
    }
  });

  it('should cover all remaining edge cases, Address validation errors, modal cancellations, and Nominatim errors', async () => {
    // Mock profile to return empty username
    const profileSpy = jest.spyOn(supabase, 'from').mockImplementation(() => createMockChain({
      singleData: { name: 'Admin User', username: '', email: 'admin@test.com', phone: '11999998888', role: 'admin', rua: 'Rua A', bairro: 'Bairro B', cep: '37480-000', numero: '10' }
    }));

    // 1. Photo loading with SecureStore avatar presence and avatar_url old cleanup path
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('stored-avatar-uri');
    const updateAuthUserSpy = jest.spyOn(supabase.auth, 'updateUser').mockResolvedValue({ data: {}, error: null } as any);
    
    // Set user metadata to trigger old cleanup
    const authValWithAvatar = {
      session: null,
      user: { ...mockUser, user_metadata: { avatar_url: 'old-avatar' } } as any,
      isLoading: false,
      signOut: jest.fn().mockResolvedValue(undefined)
    };

    const renderScreenWithCustomAuth = (ScreenComponent: any) => {
      return render(
        <AuthContext.Provider value={authValWithAvatar}>
          <ThemeProvider>
            <UserMenuProvider>
              <ScreenComponent />
            </UserMenuProvider>
          </ThemeProvider>
        </AuthContext.Provider>
      );
    };

    const { getByText, getByPlaceholderText, getAllByText } = renderScreenWithCustomAuth(AdminProfileScreen);
    await act(async () => {
      jest.advanceTimersByTime(200);
    });

    expect(updateAuthUserSpy).toHaveBeenCalled();
    updateAuthUserSpy.mockRestore();

    // 2. Open Username Modal and click Cancelar
    fireEvent.press(getByText('Definir nome de usuário...'));
    fireEvent.press(getByText('Cancelar'));

    // 3. Open Telefone Modal and click Cancelar
    fireEvent.press(getAllByText('Alterar')[0]); // Alterar phone
    // Cancel button inside Phone Modal
    const phoneCancel = getAllByText('Cancelar')[getAllByText('Cancelar').length - 1];
    fireEvent.press(phoneCancel);

    // 4. Open Email Modal and click Cancelar
    fireEvent.press(getAllByText('Alterar')[1]); // Alterar email
    const emailCancel = getAllByText('Cancelar')[getAllByText('Cancelar').length - 1];
    fireEvent.press(emailCancel);

    // 5. Trigger triggerAddressError by Enviar an empty address
    // Clear address inputs
    const ruaInput = getByPlaceholderText('Digite sua rua...');
    const bairroInput = getByPlaceholderText('Digite seu bairro...');
    fireEvent.changeText(ruaInput, '');
    fireEvent.changeText(bairroInput, '');

    await act(async () => {
      fireEvent.press(getByText('Enviar'));
    });

    // Advance timers by 8 seconds to run triggerAddressError fade timeout
    await act(async () => {
      jest.advanceTimersByTime(8500);
    });

    // 6. Test Nominatim search fallback when first query has no results
    // We mock Nominatim first search empty, second search fallback resolves
    const fetchSpy = jest.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue([]) // First Nominatim search empty
      } as any)
      .mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue([
          { lat: '-21.9750', lon: '-45.3450' } // Fallback query returns coordinate
        ])
      } as any);

    // Fill valid address fields to bypass validation
    fireEvent.changeText(ruaInput, 'Rua Nova');
    fireEvent.changeText(bairroInput, 'Bairro Novo');
    const cepInput = getByPlaceholderText('00000-000');
    const numInput = getByPlaceholderText('N°');
    fireEvent.changeText(cepInput, '37480-000');
    fireEvent.changeText(numInput, '150');

    await act(async () => {
      fireEvent.press(getByText('Enviar'));
    });

    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    fetchSpy.mockRestore();

    // 7. Nominatim fetch rejection / error catch path
    const fetchCrashSpy = jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Nominatim crash'));
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await act(async () => {
      fireEvent.press(getByText('✓ Enviado'));
    });

    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    expect(consoleSpy).toHaveBeenCalledWith('Erro ao buscar coordenadas no Enviar', expect.any(Error));
    consoleSpy.mockRestore();
    fetchCrashSpy.mockRestore();
    profileSpy.mockRestore();
  });

  it('should cover image picker modal options, photo view closing, address ref focus Alterar clicks, and onSubmitEditing triggers', async () => {
    // Mock image picker launch results to return a valid photo uri
    const imagePickerModule = require('expo-image-picker');
    imagePickerModule.launchCameraAsync.mockResolvedValueOnce({ canceled: false, assets: [{ uri: 'camera-photo-uri', base64: 'b64' }] });
    imagePickerModule.launchImageLibraryAsync.mockResolvedValueOnce({ canceled: false, assets: [{ uri: 'gallery-photo-uri', base64: 'b64' }] });

    const { getByText, getByPlaceholderText, getAllByText, queryByText } = renderScreen(AdminProfileScreen);
    await act(async () => {
      jest.advanceTimersByTime(200);
    });

    // 1. Address ref focus Alterar clicks and onSubmitEditing
    const alterars = getAllByText('Alterar');
    // Rua Alterar link
    fireEvent.press(alterars[0]);
    // Bairro Alterar link
    fireEvent.press(alterars[2] || alterars[0]);
    // CEP Alterar link
    fireEvent.press(alterars[3] || alterars[1]);
    // N° Alterar link
    fireEvent.press(alterars[4] || alterars[2]);

    // Trigger onSubmitEditing when empty
    const ruaInput = getByPlaceholderText('Digite sua rua...');
    const cepInput = getByPlaceholderText('00000-000');
    const numInput = getByPlaceholderText('N°');
    fireEvent.changeText(ruaInput, '');
    fireEvent(ruaInput, 'submitEditing');
    fireEvent.changeText(cepInput, '');
    fireEvent(cepInput, 'submitEditing');
    fireEvent.changeText(numInput, '');
    fireEvent(numInput, 'submitEditing');

    // 2. Image Picker Modal options
    const alterarFotoBtn = getByText('Alterar foto');

    // 2a. Cancel options modal
    fireEvent.press(alterarFotoBtn);
    fireEvent.press(getAllByText('Cancelar')[0]);

    // 2b. Tirar Foto (Camera)
    fireEvent.press(alterarFotoBtn);
    await act(async () => {
      fireEvent.press(getByText('Tirar Foto'));
    });

    // 2c. Click again and select Ver Foto / close view photo modal
    fireEvent.press(alterarFotoBtn);
    await act(async () => {
      fireEvent.press(getByText('Ver foto'));
    });

    // Press close button on View Photo modal
    // It has style closeViewPhotoBtn
    // Let's find touchable opacity and press it
    const closeBtn = getByText('x');
    fireEvent.press(closeBtn);

    // 2d. Escolher da Galeria (Gallery)
    fireEvent.press(alterarFotoBtn);
    await act(async () => {
      fireEvent.press(getByText('Escolher da Galeria'));
    });

    // 2e. Remover Foto (Delete)
    fireEvent.press(alterarFotoBtn);
    await act(async () => {
      fireEvent.press(getByText('Remover Foto'));
    });
  });

  it('should cover edge cases and special branches like permission denied, loading error, username validation errors, and modal clicks', async () => {
    // 1. Camera / Gallery Permission Denied
    const imagePickerModule = require('expo-image-picker');
    imagePickerModule.requestCameraPermissionsAsync.mockResolvedValueOnce({ status: 'denied', granted: false });
    imagePickerModule.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({ status: 'denied', granted: false });

    // Mock new email and profile fetch error/lat-lng
    const customUser = { ...mockUser, new_email: 'newemail@test.com' };
    const customAuthVal = { session: null, user: customUser as any, isLoading: false, signOut: jest.fn().mockResolvedValue(undefined) };
    
    // DB mock returning error and resolved lat/lng
    const originalFrom = supabase.from;
    const fromSpy = jest.spyOn(supabase, 'from').mockImplementation((table) => {
      if (table === 'users') {
        return createMockChain({
          singleData: { name: 'Admin', username: 'admin', email: 'admin@test.com', phone: '11999998888', role: 'admin', rua: 'Rua A', bairro: 'Bairro B', cep: '37480-000', numero: '10', lat: -22.0, lng: -45.0, location_confirmed: false }
        });
      }
      return createMockChain();
    });

    const { getByText, getAllByText } = render(
      <AuthContext.Provider value={customAuthVal}>
        <ThemeProvider>
          <UserMenuProvider>
            <AdminProfileScreen />
          </UserMenuProvider>
        </ThemeProvider>
      </AuthContext.Provider>
    );

    await act(async () => {
      await Promise.resolve();
      jest.advanceTimersByTime(250);
    });

    // Click Alterar foto to trigger permission denied paths
    const alterarFotoBtn = getByText('Alterar foto');
    
    fireEvent.press(alterarFotoBtn);
    await act(async () => {
      fireEvent.press(getByText('Tirar Foto'));
    });

    fireEvent.press(alterarFotoBtn);
    await act(async () => {
      fireEvent.press(getByText('Escolher da Galeria'));
    });

    // Click Validar phone and Validar email safely
    const validars = getAllByText('Validar');
    if (validars.length > 0) {
      fireEvent.press(validars[0]);
    }
    if (validars.length > 1) {
      fireEvent.press(validars[1]);
    }

    // Cleanup
    fromSpy.mockRestore();
  });
});

