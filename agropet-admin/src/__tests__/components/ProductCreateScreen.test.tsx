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
import ManageProductsScreen from '../../presentation/screens/admin/ManageProducts';
import ProductCreateScreen from '../../presentation/screens/admin/ProductCreate';

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
// ManageProductsScreen
// ============================================================
describe('ManageProductsScreen - Deep Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    const mockProducts = [
      { id: 'p1', name: 'Ração Premium', price: 120, stock: 50, active: true, image_url: 'https://img.com/p1.png', description: 'Desc' },
      { id: 'p2', name: 'Coleira', price: 45, stock: 0, active: false, image_url: null, description: 'Desc 2' },
    ];
    (supabase.from as jest.Mock).mockImplementation(() => {
      const ch = createMockChain({ data: mockProducts });
      ch.order = jest.fn().mockResolvedValue({ data: mockProducts, error: null });
      return ch;
    });
  });

  it('should render and display products', async () => {
    const { getByText } = renderScreen(ManageProductsScreen);

    await waitFor(() => {
      expect(getByText('Ração Premium')).toBeTruthy();
    });
  });
});

// ============================================================
// ProductCreateScreen
// ============================================================
describe('ProductCreateScreen - Deep Coverage', () => {
  let focusCallback: any = null;
  let useThemeSpy: any;

  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    (supabase.from as jest.Mock).mockImplementation(() => createMockChain());
    
    const themeContextModule = require('../../presentation/contexts/ThemeContext');
    useThemeSpy = jest.spyOn(themeContextModule, 'useTheme').mockReturnValue({
      isDarkMode: true,
      colors: themeContextModule.darkColors,
      toggleTheme: jest.fn(),
    });

    // Mock focus listener
    (mockNavigationObj.addListener as jest.Mock).mockImplementation((event: string, cb: any) => {
      if (event === 'focus') focusCallback = cb;
      return jest.fn();
    });
  });

  afterEach(() => {
    if (useThemeSpy) useThemeSpy.mockRestore();
  });

  it('should cover focus listener form state reset, search text navigate, and category tag clicks', async () => {
    const { getByText, UNSAFE_getAllByType, getByTestId } = renderScreen(ProductCreateScreen);

    // 1. Trigger focus listener to reset form
    await act(async () => {
      if (focusCallback) focusCallback();
    });

    // 2. Trigger search text navigate (covers line 166-167)
    const { TextInput } = require('react-native');
    const inputs = UNSAFE_getAllByType(TextInput);
    const searchInput = inputs.find(i => i.props.placeholder === 'Pesquisar...');
    if (searchInput) {
      await act(async () => {
        fireEvent.changeText(searchInput, 'Ração');
      });
      const searchBtn = getByTestId('header-search-icon-btn');
      await act(async () => {
        fireEvent.press(searchBtn);
      });
      expect(mockNavigate).toHaveBeenCalledWith('Gerenciar', { searchText: 'Ração' });
    }

    // 3. Click category tags
    fireEvent.press(getByText('Pesca'));
    expect(mockNavigate).toHaveBeenCalledWith('Gerenciar', { categories: ['Pesca'] });

    fireEvent.press(getByText('Sementes'));
    expect(mockNavigate).toHaveBeenCalledWith('Gerenciar', { categories: ['Sementes'] });
  });

  it('should handle photo options, camera, gallery permissions denied and granted flows', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByText, UNSAFE_getAllByType } = renderScreen(ProductCreateScreen);

    // 1. Open photo picker modal
    fireEvent.press(getByText('Enviar foto'));

    // Cancel selection using the Cancel option (closes modal)
    fireEvent.press(getByText('Cancelar'));

    // Reopen and close via overlay click to cover Line 446
    fireEvent.press(getByText('Enviar foto'));
    const { TouchableOpacity } = require('react-native');
    const overlay = UNSAFE_getAllByType(TouchableOpacity).find(t => {
      const style = t.props.style;
      return style && (style.justifyContent === 'flex-end' || (Array.isArray(style) && style.some(s => s && s.justifyContent === 'flex-end')));
    });
    if (overlay) {
      await act(async () => {
        fireEvent.press(overlay);
      });
    }

    // Reopen and call onRequestClose on the Modal component
    fireEvent.press(getByText('Enviar foto'));
    const { Modal } = require('react-native');
    const modals = UNSAFE_getAllByType(Modal);
    if (modals.length > 0) {
      await act(async () => {
        modals[0].props.onRequestClose();
      });
    }

    // Open again to continue flow
    fireEvent.press(getByText('Enviar foto'));

    // 2. Trigger Camera permission denied
    const cameraPermSpy = jest.spyOn(ImagePicker, 'requestCameraPermissionsAsync');
    cameraPermSpy.mockResolvedValueOnce({ status: 'denied', granted: false } as any);
    await act(async () => {
      fireEvent.press(getByText('Tirar Foto'));
    });
    expect(alertSpy).toHaveBeenCalledWith('Permissão necessária', 'Você precisa permitir o acesso à câmera para tirar uma foto.');

    // 3. Trigger Camera permission granted & photo captured
    cameraPermSpy.mockResolvedValueOnce({ status: 'granted', granted: true } as any);
    const cameraLaunchSpy = jest.spyOn(ImagePicker, 'launchCameraAsync');
    cameraLaunchSpy.mockResolvedValueOnce({ canceled: false, assets: [{ uri: 'ph-camera-uri', base64: 'camBase64' }] } as any);
    
    fireEvent.press(getByText('Enviar foto'));
    await act(async () => {
      fireEvent.press(getByText('Tirar Foto'));
    });

    // 4. Trigger Gallery permission denied
    fireEvent.press(getByText('Adicionar foto'));
    const galleryPermSpy = jest.spyOn(ImagePicker, 'requestMediaLibraryPermissionsAsync');
    galleryPermSpy.mockResolvedValueOnce({ status: 'denied', granted: false } as any);
    await act(async () => {
      fireEvent.press(getByText('Escolher da Galeria'));
    });
    expect(alertSpy).toHaveBeenCalledWith('Permissão necessária', 'Você precisa permitir o acesso à galeria para selecionar uma foto.');

    // 5. Trigger Gallery permission granted & photo selected
    galleryPermSpy.mockResolvedValueOnce({ status: 'granted', granted: true } as any);
    const galleryLaunchSpy = jest.spyOn(ImagePicker, 'launchImageLibraryAsync');
    galleryLaunchSpy.mockResolvedValueOnce({ canceled: false, assets: [{ uri: 'ph-gallery-uri', base64: 'galBase64' }] } as any);
    
    fireEvent.press(getByText('Adicionar foto'));
    await act(async () => {
      fireEvent.press(getByText('Escolher da Galeria'));
    });

    // 6. Test photo removal
    fireEvent.press(getByText('Remover atual'));

    alertSpy.mockRestore();
  });

  it('should cover validation alerts, database insertion error, and success save navigations', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByTestId, UNSAFE_getAllByType, getByText } = renderScreen(ProductCreateScreen);

    // 1. Validation alert: empty fields
    const saveBtn = getByTestId('register-product-btn');
    await act(async () => {
      fireEvent.press(saveBtn);
    });
    expect(alertSpy).toHaveBeenCalledWith('Atenção', 'Por favor, preencha todos os campos do formulário.');

    // Populate text inputs
    fireEvent.changeText(getByTestId('product-name-input'), 'Ração Premium Super');
    fireEvent.changeText(getByTestId('product-description-input'), 'Alta qualidade');
    fireEvent.changeText(getByTestId('product-price-input'), '150.00');
    fireEvent.changeText(getByTestId('product-quantity-input'), '50');

    // 2. Validation alert: empty category
    await act(async () => {
      fireEvent.press(saveBtn);
    });
    expect(alertSpy).toHaveBeenCalledWith('Atenção', 'Por favor, selecione uma categoria.');

    // Click category tag to select category
    fireEvent.press(getByText('Ração'));

    // 3. Database error insertion path
    (supabase.from as jest.Mock).mockImplementationOnce(() => createMockChain({ error: new Error('Insert query error') }));
    await act(async () => {
      fireEvent.press(saveBtn);
    });
    expect(alertSpy).toHaveBeenCalledWith('Erro', 'Não foi possível registrar o produto.');

    // 4. Database success insertion path
    await act(async () => {
      fireEvent.press(saveBtn);
    });
    expect(alertSpy).toHaveBeenLastCalledWith('Sucesso', 'Produto registrado com sucesso!', expect.any(Array));

    // Execute onPress on success confirmation button
    const lastCall = alertSpy.mock.calls[alertSpy.mock.calls.length - 1];
    const buttons = lastCall && lastCall[2] ? lastCall[2] : [];
    const okBtn = buttons.find((b: any) => b.text === 'OK');
    if (okBtn && typeof okBtn.onPress === 'function') {
      okBtn.onPress();
    }
    expect(mockNavigate).toHaveBeenCalledWith('Gerenciar');

    alertSpy.mockRestore();
  });

  it('should cover photo sliding chevron index controls', async () => {
    const { getByText, UNSAFE_getAllByType } = renderScreen(ProductCreateScreen);

    // Inject multiple photos directly to state by simulating picker
    const galleryPermSpy = jest.spyOn(ImagePicker, 'requestMediaLibraryPermissionsAsync');
    const galleryLaunchSpy = jest.spyOn(ImagePicker, 'launchImageLibraryAsync');
    
    // Add photo 1
    galleryPermSpy.mockResolvedValueOnce({ status: 'granted', granted: true } as any);
    galleryLaunchSpy.mockResolvedValueOnce({ canceled: false, assets: [{ uri: 'ph-1', base64: 'base64-1' }] } as any);
    fireEvent.press(getByText('Enviar foto'));
    await act(async () => {
      fireEvent.press(getByText('Escolher da Galeria'));
    });

    // Add photo 2
    galleryPermSpy.mockResolvedValueOnce({ status: 'granted', granted: true } as any);
    galleryLaunchSpy.mockResolvedValueOnce({ canceled: false, assets: [{ uri: 'ph-2', base64: 'base64-2' }] } as any);
    fireEvent.press(getByText('Adicionar foto'));
    await act(async () => {
      fireEvent.press(getByText('Escolher da Galeria'));
    });

    // We now have 2 photos. Find and press chevron control Touchables!
    const { TouchableOpacity } = require('react-native');
    let touchables = UNSAFE_getAllByType(TouchableOpacity);
    const chevrons = touchables.filter(t => {
      try {
        const feather = t.findByType(Feather);
        return feather.props.name === 'chevron-left' || feather.props.name === 'chevron-right';
      } catch (_) {
        return false;
      }
    });

    // Right chevron is at index 1 in the rendered chevrons list
    // Click right chevron to change currentPhotoIndex from 0 to 1
    if (chevrons.length > 1) {
      await act(async () => {
        fireEvent.press(chevrons[1]); // right chevron
      });
      // Click left chevron to change currentPhotoIndex from 1 to 0
      await act(async () => {
        fireEvent.press(chevrons[0]); // left chevron
      });
    }

    // Now check adjacent previews. Adjacent previews are TouchableOpacity buttons containing Image.
    const { Image } = require('react-native');
    const imagePreviews = UNSAFE_getAllByType(TouchableOpacity).filter(t => {
      try {
        return t.findByType(Image) !== null;
      } catch (_) {
        return false;
      }
    });

    if (imagePreviews.length > 0) {
      // Click right preview to go to index 1
      await act(async () => {
        fireEvent.press(imagePreviews[0]);
      });
    }

    // At currentPhotoIndex = 1, only left preview is visible
    touchables = UNSAFE_getAllByType(TouchableOpacity);
    const newImagePreviews = touchables.filter(t => {
      try {
        return t.findByType(Image) !== null;
      } catch (_) {
        return false;
      }
    });
    if (newImagePreviews.length > 0) {
      // Click left preview to go back to index 0
      await act(async () => {
        fireEvent.press(newImagePreviews[0]);
      });
    }
  });

  it('should cover light mode theme styles and empty base64 image registration branches in ProductCreateScreen', async () => {
    const useThemeSpy = jest.spyOn(require('../../presentation/contexts/ThemeContext'), 'useTheme').mockReturnValue({
      isDarkMode: false,
      colors: require('../../presentation/contexts/ThemeContext').lightColors,
      toggleTheme: jest.fn(),
    });

    const { getByText, getByTestId, UNSAFE_getAllByType } = renderScreen(ProductCreateScreen);

    // 1. Trigger photo selection with no base64 string
    const galleryLaunchSpy = jest.spyOn(ImagePicker, 'launchImageLibraryAsync');
    galleryLaunchSpy.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'ph-gallery-no-b64-uri', base64: undefined }]
    } as any);

    fireEvent.press(getByTestId('enviar-foto-btn'));
    await act(async () => {
      fireEvent.press(getByText('Escolher da Galeria'));
    });

    // 2. Register the product to trigger mapping logic without base64
    await act(async () => {
      fireEvent.changeText(getByTestId('product-name-input'), 'Ração Light');
      fireEvent.changeText(getByTestId('product-description-input'), 'Saborosa');
      fireEvent.changeText(getByTestId('product-price-input'), '89,90');
      fireEvent.changeText(getByTestId('product-quantity-input'), '25');
    });

    // Select category and click salvar
    fireEvent.press(getByText('Pesca'));
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const insertSpy = jest.fn().mockResolvedValue({ data: {}, error: null });
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      insert: insertSpy
    }));

    await act(async () => {
      fireEvent.press(getByTestId('register-product-btn'));
    });
    
    expect(insertSpy).toHaveBeenCalledWith([
      expect.objectContaining({
        name: 'Ração Light',
        image_url: JSON.stringify(['ph-gallery-no-b64-uri']),
      })
    ]);

    galleryLaunchSpy.mockRestore();
    alertSpy.mockRestore();
    useThemeSpy.mockRestore();
  });

  it('should cover fallback branches for empty assets/null assets in camera/gallery and base64 ternary in image mapping', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByText, getByTestId } = renderScreen(ProductCreateScreen);

    const cameraPermSpy = jest.spyOn(ImagePicker, 'requestCameraPermissionsAsync');
    const cameraLaunchSpy = jest.spyOn(ImagePicker, 'launchCameraAsync');
    const galleryPermSpy = jest.spyOn(ImagePicker, 'requestMediaLibraryPermissionsAsync');
    const galleryLaunchSpy = jest.spyOn(ImagePicker, 'launchImageLibraryAsync');

    // 0. Camera returns canceled: false but no base64 (covers line 87 falsy branch)
    cameraPermSpy.mockResolvedValueOnce({ status: 'granted', granted: true } as any);
    cameraLaunchSpy.mockResolvedValueOnce({ canceled: false, assets: [{ uri: 'ph-camera-no-b64', base64: undefined }] } as any);
    fireEvent.press(getByText('Enviar foto'));
    await act(async () => {
      fireEvent.press(getByText('Tirar Foto'));
    });
    fireEvent.press(getByText('Remover atual'));

    // 1. Camera returns canceled: false but null assets
    cameraPermSpy.mockResolvedValueOnce({ status: 'granted', granted: true } as any);
    cameraLaunchSpy.mockResolvedValueOnce({ canceled: false, assets: null } as any);
    fireEvent.press(getByText('Enviar foto'));
    await act(async () => {
      fireEvent.press(getByText('Tirar Foto'));
    });

    // 2. Camera returns canceled: false but empty assets
    cameraPermSpy.mockResolvedValueOnce({ status: 'granted', granted: true } as any);
    cameraLaunchSpy.mockResolvedValueOnce({ canceled: false, assets: [] } as any);
    fireEvent.press(getByText('Enviar foto'));
    await act(async () => {
      fireEvent.press(getByText('Tirar Foto'));
    });

    // 3. Gallery returns canceled: false but null assets
    galleryPermSpy.mockResolvedValueOnce({ status: 'granted', granted: true } as any);
    galleryLaunchSpy.mockResolvedValueOnce({ canceled: false, assets: null } as any);
    fireEvent.press(getByText('Enviar foto'));
    await act(async () => {
      fireEvent.press(getByText('Escolher da Galeria'));
    });

    // 4. Gallery returns canceled: false but empty assets
    galleryPermSpy.mockResolvedValueOnce({ status: 'granted', granted: true } as any);
    galleryLaunchSpy.mockResolvedValueOnce({ canceled: false, assets: [] } as any);
    fireEvent.press(getByText('Enviar foto'));
    await act(async () => {
      fireEvent.press(getByText('Escolher da Galeria'));
    });

    // 5. Add a photo with a valid base64 value
    galleryPermSpy.mockResolvedValueOnce({ status: 'granted', granted: true } as any);
    galleryLaunchSpy.mockResolvedValueOnce({ canceled: false, assets: [{ uri: 'ph-base64', base64: 'valid-base64-string' }] } as any);
    fireEvent.press(getByText('Enviar foto'));
    await act(async () => {
      fireEvent.press(getByText('Escolher da Galeria'));
    });

    // Fill form and submit to cover line 131 mapping (truthy branch of base64 check)
    await act(async () => {
      fireEvent.changeText(getByTestId('product-name-input'), 'Produto Base64');
      fireEvent.changeText(getByTestId('product-description-input'), 'Desc');
      fireEvent.changeText(getByTestId('product-price-input'), '10.00');
      fireEvent.changeText(getByTestId('product-quantity-input'), '5');
    });

    fireEvent.press(getByText('Ração'));

    const insertSpy = jest.fn().mockResolvedValue({ data: {}, error: null });
    (supabase.from as jest.Mock).mockImplementationOnce(() => ({
      insert: insertSpy
    }));

    await act(async () => {
      fireEvent.press(getByTestId('register-product-btn'));
    });

    expect(insertSpy).toHaveBeenCalledWith([
      expect.objectContaining({
        name: 'Produto Base64',
        image_url: JSON.stringify(['data:image/jpeg;base64,valid-base64-string']),
      })
    ]);

    cameraPermSpy.mockRestore();
    cameraLaunchSpy.mockRestore();
    galleryPermSpy.mockRestore();
    galleryLaunchSpy.mockRestore();
    alertSpy.mockRestore();
  });
});
