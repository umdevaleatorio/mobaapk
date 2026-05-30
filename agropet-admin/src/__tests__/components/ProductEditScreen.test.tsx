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
import ProductEditScreen from '../../presentation/screens/admin/ProductEditScreen';

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
// ProductEditScreen
// ============================================================
describe('ProductEditScreen - Deep Coverage', () => {
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

  it('should cover route params parsing, search text navigate, and focus resets', async () => {
    const { getByText, UNSAFE_getAllByType, getByTestId } = renderScreen(ProductEditScreen);

    // 1. Trigger focus listener
    await act(async () => {
      if (focusCallback) focusCallback();
    });

    // 2. Trigger search text navigate (covers line 207-208)
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

    // 3. Press category pill
    fireEvent.press(getByText('Pesca'));
    expect(mockNavigate).toHaveBeenCalledWith('Gerenciar', { categories: ['Pesca'] });
  });

  it('should cover dynamic image URL formats in ProductEditScreen', async () => {
    // 1. Array of images JSON string (covers line 37-44)
    mockUseRoute.mockReturnValueOnce({
      params: {
        product: {
          id: 'p-1',
          name: 'Product 1',
          price: 50,
          stock: 10,
          active: true,
          description: 'Description',
          image_url: '["https://example.com/img1.png", "https://example.com/img2.png"]',
        }
      }
    });
    let result = renderScreen(ProductEditScreen);
    expect(result.getByText('Adicionar foto')).toBeTruthy();

    // 2. Single image string
    mockUseRoute.mockReturnValueOnce({
      params: {
        product: {
          id: 'p-1',
          name: 'Product 1',
          price: 50,
          stock: 10,
          active: true,
          description: 'Description',
          image_url: 'https://example.com/single.png',
        }
      }
    });
    result = renderScreen(ProductEditScreen);
    expect(result.getByText('Adicionar foto')).toBeTruthy();

    // 3. Invalid JSON string
    mockUseRoute.mockReturnValueOnce({
      params: {
        product: {
          id: 'p-1',
          name: 'Product 1',
          price: 50,
          stock: 10,
          active: true,
          description: 'Description',
          image_url: '[invalid_json',
        }
      }
    });
    result = renderScreen(ProductEditScreen);
    expect(result.getByText('Adicionar foto')).toBeTruthy();

    // 4. Empty array JSON (covers Array.isArray true + length > 0 false branch on line 41)
    mockUseRoute.mockReturnValueOnce({
      params: {
        product: {
          id: 'p-1',
          name: 'Product 1',
          price: 50,
          stock: 10,
          active: true,
          description: 'Description',
          image_url: '[]',
        }
      }
    });
    result = renderScreen(ProductEditScreen);
    expect(result.getByText('Adicionar foto')).toBeTruthy();
  });

  it('should handle photo options, camera, gallery permissions denied and granted flows in ProductEditScreen', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByText, UNSAFE_getAllByType } = renderScreen(ProductEditScreen);

    // 1. Open photo picker modal (since mock image_url is null, it renders "Trocar foto")
    fireEvent.press(getByText('Trocar foto'));

    // Cancel selection using the Cancel option (closes modal)
    fireEvent.press(getByText('Cancelar'));

    // Reopen and close via overlay click to cover Line 527
    fireEvent.press(getByText('Trocar foto'));
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
    fireEvent.press(getByText('Trocar foto'));
    const { Modal } = require('react-native');
    const modals = UNSAFE_getAllByType(Modal);
    if (modals.length > 0) {
      await act(async () => {
        modals[0].props.onRequestClose();
      });
    }

    // Open again to continue flow
    fireEvent.press(getByText('Trocar foto'));

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
    
    fireEvent.press(getByText('Trocar foto'));
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

    // 7. Camera with canceled=false and assets undefined (covers result.assets falsy branch on lines 122-125)
    const edgeCameraSpy = jest.spyOn(ImagePicker, 'launchCameraAsync');
    edgeCameraSpy.mockResolvedValueOnce({ canceled: false } as any);
    fireEvent.press(getByText('Adicionar foto'));
    await act(async () => {
      fireEvent.press(getByText('Tirar Foto'));
    });

    // 8. Camera with canceled=false and assets=[] (covers result.assets.length > 0 false branch)
    edgeCameraSpy.mockResolvedValueOnce({ canceled: false, assets: [] } as any);
    fireEvent.press(getByText('Adicionar foto'));
    await act(async () => {
      fireEvent.press(getByText('Tirar Foto'));
    });

    // 9. Gallery with canceled=false and assets undefined (covers line 148)
    const edgeGallerySpy = jest.spyOn(ImagePicker, 'launchImageLibraryAsync');
    edgeGallerySpy.mockResolvedValueOnce({ canceled: false } as any);
    fireEvent.press(getByText('Adicionar foto'));
    await act(async () => {
      fireEvent.press(getByText('Escolher da Galeria'));
    });

    // 10. Gallery with canceled=false and assets=[]
    edgeGallerySpy.mockResolvedValueOnce({ canceled: false, assets: [] } as any);
    fireEvent.press(getByText('Adicionar foto'));
    await act(async () => {
      fireEvent.press(getByText('Escolher da Galeria'));
    });

    edgeCameraSpy.mockRestore();
    edgeGallerySpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('should handle no product ID error in ProductEditScreen', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockUseRoute.mockReturnValueOnce({
      params: {
        product: {
          name: 'Product Without ID',
          price: 50,
          stock: 10,
        }
      }
    });

    const { getByTestId } = renderScreen(ProductEditScreen);
    const saveBtn = getByTestId('save-product-btn');
    await act(async () => {
      fireEvent.press(saveBtn);
    });
    expect(alertSpy).toHaveBeenCalledWith('Erro', 'Nenhum produto selecionado para edição.');
    alertSpy.mockRestore();
  });

  it('should handle edit mode editable toggles and focus clicks on name, desc, price, and quantity', async () => {
    const { UNSAFE_getAllByType } = renderScreen(ProductEditScreen);
    const { TouchableOpacity } = require('react-native');
    const touchables = UNSAFE_getAllByType(TouchableOpacity);

    // Edit icons are rendered on the card. Let's find and press them reliably by style property (right: 15)
    const editButtons = touchables.filter(t => {
      const style = t.props.style;
      return style && (style.right === 15 || (Array.isArray(style) && style.some(s => s && s.right === 15)));
    });

    jest.useFakeTimers();
    for (const btn of editButtons) {
      await act(async () => {
        fireEvent.press(btn);
      });
      await act(async () => {
        jest.advanceTimersByTime(100);
      });
    }
    jest.useRealTimers();
  });

  it('should handle validation, database update errors, and success confirm navigate back', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockUseRoute.mockReturnValueOnce({
      params: {
        product: {
          id: 'p-1', name: 'Product 1', price: 50, stock: 10,
          active: true, description: 'Description 1',
          image_url: '["https://example.com/img1.png", "https://example.com/img2.png"]',
        }
      }
    });
    const { getByText, getByTestId, UNSAFE_getAllByType } = renderScreen(ProductEditScreen);

    // 1. Trigger validation alert by clearing name field (covers line 160-161)
    const { TextInput, TouchableOpacity } = require('react-native');
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    const editButtons = touchables.filter(t => {
      const style = t.props.style;
      return style && (style.right === 15 || (Array.isArray(style) && style.some(s => s && s.right === 15)));
    });

    // Toggle name edit mode on to make it editable
    jest.useFakeTimers();
    if (editButtons.length > 0) {
      await act(async () => {
        fireEvent.press(editButtons[0]);
      });
      await act(async () => {
        jest.advanceTimersByTime(100);
      });
    }
    jest.useRealTimers();

    const inputs = UNSAFE_getAllByType(TextInput);
    const nameInput = inputs[1];
    const saveBtn = getByTestId('save-product-btn');
    
    await act(async () => {
      if (nameInput) {
        fireEvent.changeText(nameInput, '');
      }
    });

    await act(async () => {
      fireEvent.press(saveBtn);
    });

    expect(alertSpy).toHaveBeenCalledWith('Atenção', 'Por favor, preencha todos os campos do formulário.');

    // Restore name input
    if (nameInput) {
      fireEvent.changeText(nameInput, 'Product 1 Updated');
    }

    // 2. Try to save (success) — photos from initial route cover line 169 map
    await act(async () => {
      fireEvent.press(saveBtn);
    });
    expect(alertSpy).toHaveBeenCalledWith('Sucesso', 'Produto atualizado com sucesso!', expect.any(Array));

    // Execute onPress on success confirmation button
    const lastCall = alertSpy.mock.calls[alertSpy.mock.calls.length - 1];
    const buttons = lastCall && lastCall[2] ? lastCall[2] : [];
    const okBtn = buttons.find((b: any) => b.text === 'OK');
    if (okBtn && typeof okBtn.onPress === 'function') {
      okBtn.onPress();
    }
    expect(mockNavigate).toHaveBeenCalledWith('Gerenciar');

    // 3. Database update error
    (supabase.from as jest.Mock).mockImplementationOnce(() => createMockChain({ error: new Error('Update query error') }));
    await act(async () => {
      fireEvent.press(saveBtn);
    });
    expect(alertSpy).toHaveBeenCalledWith('Erro', 'Não foi possível atualizar o produto.');

    alertSpy.mockRestore();
  });

  it('should cover photo sliding chevron index controls and adjacent previews in ProductEditScreen', async () => {
    mockUseRoute.mockReturnValueOnce({
      params: {
        product: {
          id: 'p-1',
          name: 'Product Multi',
          price: 50,
          stock: 10,
          active: true,
          description: 'Description',
          image_url: '["https://example.com/img1.png", "https://example.com/img2.png"]',
        }
      }
    });

    const { getByText, UNSAFE_getAllByType } = renderScreen(ProductEditScreen);

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

    if (chevrons.length > 1) {
      await act(async () => {
        fireEvent.press(chevrons[1]); // right chevron
      });
      await act(async () => {
        fireEvent.press(chevrons[0]); // left chevron
      });
    }

    const { Image } = require('react-native');
    const imagePreviews = UNSAFE_getAllByType(TouchableOpacity).filter(t => {
      try {
        return t.findByType(Image) !== null;
      } catch (_) {
        return false;
      }
    });

    if (imagePreviews.length > 0) {
      await act(async () => {
        fireEvent.press(imagePreviews[0]);
      });
    }

    touchables = UNSAFE_getAllByType(TouchableOpacity);
    const newImagePreviews = touchables.filter(t => {
      try {
        return t.findByType(Image) !== null;
      } catch (_) {
        return false;
      }
    });
    if (newImagePreviews.length > 0) {
      await act(async () => {
        fireEvent.press(newImagePreviews[0]);
      });
    }
  });

  it('should cover light mode theme styles, empty product fallbacks, empty price placeholder, and empty base64 image registration branches in ProductEditScreen', async () => {
    // 1. Mock empty/null values on product params
    mockUseRoute.mockReturnValueOnce({
      params: {
        product: {
          id: 'p-1',
          name: '',
          price: null,
          stock: null,
          description: '',
          image_url: '["https://example.com/img1.png", "", null]',
        }
      }
    });

    const themeContextModule = require('../../presentation/contexts/ThemeContext');
    const localThemeSpy = jest.spyOn(themeContextModule, 'useTheme').mockReturnValue({
      isDarkMode: false,
      colors: themeContextModule.lightColors,
      toggleTheme: jest.fn(),
    });

    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByText, getByPlaceholderText, UNSAFE_getAllByType, getByTestId } = renderScreen(ProductEditScreen);

    // 2. Trigger edit price with empty price value to show placeholder "0,00"
    jest.useFakeTimers();
    await act(async () => {
      fireEvent.press(getByTestId('edit-price-btn'));
    });
    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    jest.useRealTimers();

    await act(async () => {
      fireEvent.changeText(getByTestId('product-price-input'), '');
    });

    // 3. Trigger gallery launch without base64
    const galleryLaunchSpy = jest.spyOn(ImagePicker, 'launchImageLibraryAsync');
    galleryLaunchSpy.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'ph-gallery-no-b64-uri', base64: undefined }]
    } as any);

    fireEvent.press(getByText('Adicionar foto'));
    await act(async () => {
      fireEvent.press(getByText('Escolher da Galeria'));
    });

    // 4. Save and trigger mapping logic
    await act(async () => {
      fireEvent.changeText(getByTestId('product-name-input'), 'Ração Editada');
      fireEvent.changeText(getByTestId('product-quantity-input'), '10');
    });

    const registerSpy = jest.spyOn(supabase.from('products'), 'update').mockImplementation(() => createMockChain());
    await act(async () => {
      fireEvent.press(getByTestId('save-product-btn'));
    });

    galleryLaunchSpy.mockRestore();
    registerSpy.mockRestore();
    alertSpy.mockRestore();
    localThemeSpy.mockRestore();
  });

  it('should cover empty product params and full image base64 saving', async () => {
    mockUseRoute.mockReturnValueOnce({
      params: {
        product: { id: 'p-1', name: '', price: null, stock: null, image_url: '["https://example.com/img.png"]' }
      }
    });
    const { getByText, getByTestId } = renderScreen(ProductEditScreen);

    // Trigger focus listener with empty product (covers lines 84-87 false branches: || '')
    await act(async () => {
      if (focusCallback) focusCallback();
    });

    // Fill form to bypass validation
    await act(async () => {
      fireEvent.changeText(getByTestId('product-name-input'), 'Ração');
      fireEvent.changeText(getByTestId('product-price-input'), '50');
      fireEvent.changeText(getByTestId('product-quantity-input'), '10');
    });

    // Add a gallery photo with base64 to cover line 169 truthy branch (p.base64 ? ...)
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({ canceled: false, assets: [{ uri: 'file://img1', base64: 'abcbase64' }] } as any);

    await act(async () => {
      fireEvent.press(getByText('Adicionar foto'));
    });
    await act(async () => {
      fireEvent.press(getByText('Escolher da Galeria'));
    });

    // Re-acquire save button to get latest onPress closure
    const saveBtn = getByTestId('save-product-btn');
    await act(async () => {
      fireEvent.press(saveBtn);
    });
  });

  it('should cover light mode no-photo render (lines 283-285 false branches)', async () => {
    const themeContextModule = require('../../presentation/contexts/ThemeContext');
    const localThemeSpy = jest.spyOn(themeContextModule, 'useTheme').mockReturnValue({
      isDarkMode: false,
      colors: themeContextModule.lightColors,
      toggleTheme: jest.fn(),
    });
    mockUseRoute.mockReturnValueOnce({
      params: {
        product: { id: 'p-lm', name: 'Test', price: 50, stock: 10, active: true, description: '', image_url: null }
      }
    });
    renderScreen(ProductEditScreen);
    localThemeSpy.mockRestore();
  });

  it('should handle save with no photos (mappedImages empty branch)', async () => {
    mockUseRoute.mockReturnValueOnce({
      params: {
        product: { id: 'p-no-photos', name: 'No Photo', price: 30, stock: 5, active: true, description: '', image_url: null }
      }
    });
    const { getByText, getByTestId } = renderScreen(ProductEditScreen);

    await act(async () => {
      if (focusCallback) focusCallback();
    });

    await act(async () => {
      fireEvent.changeText(getByTestId('product-name-input'), 'No Photo Product');
      fireEvent.changeText(getByTestId('product-price-input'), '30');
      fireEvent.changeText(getByTestId('product-quantity-input'), '5');
    });

    await act(async () => {
      fireEvent.press(getByTestId('save-product-btn'));
    });
  });

  it('should add gallery photo without base64 (covers || null falsy branch at line 125)', async () => {
    mockUseRoute.mockReturnValueOnce({
      params: {
        product: { id: 'p-b64-null', name: 'Test', price: 40, stock: 8, active: true, description: '', image_url: null }
      }
    });
    const { getByText } = renderScreen(ProductEditScreen);

    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({ canceled: false, assets: [{ uri: 'no-b64-uri', base64: undefined }] } as any);

    fireEvent.press(getByText('Trocar foto'));
    await act(async () => {
      fireEvent.press(getByText('Escolher da Galeria'));
    });
  });

  it('should save with gallery photo that has base64 (covers p.base64 truthy at line 169)', async () => {
    mockUseRoute.mockReturnValueOnce({
      params: {
        product: { id: 'p-b64-yes', name: 'Test', price: 40, stock: 8, active: true, description: '', image_url: null }
      }
    });
    const { getByText, getByTestId } = renderScreen(ProductEditScreen);

    await act(async () => {
      if (focusCallback) focusCallback();
    });

    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({ canceled: false, assets: [{ uri: 'with-b64', base64: 'imafakedata' }] } as any);

    fireEvent.press(getByText('Trocar foto'));
    await act(async () => {
      fireEvent.press(getByText('Escolher da Galeria'));
    });

    await act(async () => {
      fireEvent.changeText(getByTestId('product-name-input'), 'Test');
      fireEvent.changeText(getByTestId('product-price-input'), '40');
      fireEvent.changeText(getByTestId('product-quantity-input'), '8');
    });

    await act(async () => {
      fireEvent.press(getByTestId('save-product-btn'));
    });
  });

  it('should take camera photo without base64 (covers || null falsy at line 125)', async () => {
    mockUseRoute.mockReturnValueOnce({
      params: {
        product: { id: 'p-cam-nob64', name: 'Cam', price: 25, stock: 3, active: true, description: '', image_url: null }
      }
    });
    const { getByText } = renderScreen(ProductEditScreen);

    (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValueOnce({ canceled: false, assets: [{ uri: 'cam-uri', base64: undefined }] } as any);

    fireEvent.press(getByText('Trocar foto'));
    await act(async () => {
      fireEvent.press(getByText('Tirar Foto'));
    });
  });
});
