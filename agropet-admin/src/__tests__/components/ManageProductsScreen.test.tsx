import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { supabase } from '../../data/datasources/supabase/client';
import ManageProductsScreen from '../../presentation/screens/admin/ManageProductsScreen';
import { Feather } from '@expo/vector-icons';

// ── Mock Navigation and Route ──
let focusCallback: any = null;
const stableRoute = { params: {} as any };
const mockNavigate = jest.fn();
const mockSetParams = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    addListener: jest.fn().mockImplementation((event: string, cb: any) => {
      if (event === 'focus') focusCallback = cb;
      return jest.fn();
    }),
    setParams: mockSetParams,
  }),
  useRoute: () => stableRoute,
}));

// ── Mock do Supabase Client ──
const mockProductsList = [
  { id: 'p-1', name: 'Ração Crítica Red', price: 100, stock: 5, category_id: 'cat-1', active: true, description: 'Ração' },
  { id: 'p-2', name: 'Ração Alerta Yellow', price: 120, stock: 15, category_id: 'cat-1', active: true, description: 'Ração' },
  { id: 'p-3', name: 'Ração Segura', price: 150, stock: 50, category_id: 'cat-1', active: true, description: 'Ração' },
  { id: 'p-4', name: 'Ração Inativa', price: 80, stock: 0, category_id: 'cat-1', active: false, description: 'Ração' },
  { id: 'p-5', name: 'Ração JSON Imagem', price: 160, stock: 45, category_id: 'cat-1', active: true, description: 'Ração', image_url: '["https://example.com/img1.png"]' },
  { id: 'p-6', name: 'Ração Plain Imagem', price: 170, stock: 40, category_id: 'cat-1', active: true, description: 'Ração', image_url: 'https://example.com/single-img.png' },
];

let mockOrderFn = jest.fn().mockResolvedValue({ data: mockProductsList, error: null });
const mockSelect = jest.fn().mockReturnValue({
  order: mockOrderFn,
});

let mockEqFn = jest.fn().mockResolvedValue({ error: null });
let mockInFn = jest.fn().mockResolvedValue({ error: null });

const mockUpdate = jest.fn().mockReturnValue({
  eq: mockEqFn,
  in: mockInFn,
});

const mockDelete = jest.fn().mockReturnValue({
  eq: mockEqFn,
  in: mockInFn,
});

jest.mock('../../data/datasources/supabase/client', () => ({
  supabase: {
    from: jest.fn().mockImplementation((table: string) => {
      if (table === 'products') {
        return {
          select: mockSelect,
          update: mockUpdate,
          delete: mockDelete,
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
      };
    }),
  },
}));

// Mock do ThemeContext
(global as any).isDarkModeTest = true;
jest.mock('../../presentation/contexts/ThemeContext', () => {
  const actual = jest.requireActual('../../presentation/contexts/ThemeContext');
  return {
    ...actual,
    useTheme: () => {
      const isDark = (global as any).isDarkModeTest !== false;
      return {
        colors: isDark ? actual.darkColors : actual.lightColors,
        isDarkMode: isDark,
        toggleTheme: jest.fn(),
      };
    }
  };
});

// Mock do AdminHeader e AdminUserMenu
jest.mock('../../presentation/components/AdminHeader', () => {
  const React = require('react');
  const { View } = require('react-native');
  return jest.fn().mockImplementation(() => <View />);
});

jest.mock('../../presentation/components/AdminUserMenu', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    AdminUserMenu: jest.fn().mockImplementation(() => <View />),
  };
});

describe('ManageProductsScreen - Full Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    stableRoute.params = {};
    mockOrderFn.mockResolvedValue({ data: [...mockProductsList], error: null });
    mockEqFn.mockResolvedValue({ error: null });
    mockInFn.mockResolvedValue({ error: null });
  });

  it('should render and load product list, search, and category tag clicks', async () => {
    const { getByText } = render(<ManageProductsScreen />);

    await waitFor(() => {
      expect(getByText('Ração Crítica Red')).toBeTruthy();
    });

    // Press a category tag to toggle filter on
    fireEvent.press(getByText('Pesca'));
    // Toggle off category filter
    fireEvent.press(getByText('Pesca'));
  });

  it('should cover focus listener callback with both empty and defined params', async () => {
    render(<ManageProductsScreen />);

    // 1. Run focus callback with empty route params
    stableRoute.params = undefined;
    await act(async () => {
      if (focusCallback) focusCallback();
    });

    // 2. Run focus callback with defined route params
    stableRoute.params = { searchText: 'Premium Ração', categories: ['Ração'] };
    await act(async () => {
      if (focusCallback) focusCallback();
    });

    expect(mockSetParams).toHaveBeenCalledWith({ searchText: undefined, categories: undefined });
  });

  it('should handle toggle active status click success and error catch paths', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { UNSAFE_getAllByType, getByText } = render(<ManageProductsScreen />);

    await waitFor(() => {
      expect(getByText('Ração Crítica Red')).toBeTruthy();
    });

    // Trigger toggle active status (success)
    const { TouchableOpacity } = require('react-native');
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    
    // Toggle active on first card (touchables[11])
    await act(async () => {
      fireEvent.press(touchables[11]);
    });
    expect(mockUpdate).toHaveBeenCalledWith({ active: false });

    // Trigger toggle active status (error catch)
    mockEqFn.mockResolvedValueOnce({ error: new Error('Update error') });
    await act(async () => {
      fireEvent.press(touchables[11]);
    });
    expect(alertSpy).toHaveBeenCalledWith('Erro', 'Não foi possível alterar o status do produto.');

    alertSpy.mockRestore();
  });

  it('should handle delete individual product (Confirm & Cancel alert flows)', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByText, UNSAFE_getAllByType } = render(<ManageProductsScreen />);

    await waitFor(() => {
      expect(getByText('Ração Crítica Red')).toBeTruthy();
    });

    const { TouchableOpacity } = require('react-native');
    const touchables = UNSAFE_getAllByType(TouchableOpacity);

    // Click trash button on first card (touchables[10])
    await act(async () => {
      fireEvent.press(touchables[10]);
    });

    // Verify Alert.alert is triggered
    expect(alertSpy).toHaveBeenCalledWith(
      'Atenção',
      'Tem certeza que deseja excluir este produto? Ele será removido permanentemente.',
      expect.any(Array)
    );

    // Intercept Excluir click using latest call
    const lastCall = alertSpy.mock.calls[alertSpy.mock.calls.length - 1];
    const buttons = lastCall && lastCall[2] ? lastCall[2] : [];
    const cancelBtn = buttons.find((b: any) => b.text === 'Cancelar');
    const deleteBtn = buttons.find((b: any) => b.text === 'Excluir');

    // Run Cancel option
    if (cancelBtn && typeof cancelBtn.onPress === 'function') {
      cancelBtn.onPress();
    }

    // Run Excluir option (success path)
    if (deleteBtn && typeof deleteBtn.onPress === 'function') {
      const onPressFn = deleteBtn.onPress;
      await act(async () => {
        await onPressFn();
      });
    }
    expect(mockDelete).toHaveBeenCalled();

    // Run Excluir option (error path)
    mockEqFn.mockResolvedValueOnce({ error: new Error('Delete error') });
    if (deleteBtn && typeof deleteBtn.onPress === 'function') {
      const onPressFn = deleteBtn.onPress;
      await act(async () => {
        await onPressFn();
      });
    }
    expect(alertSpy).toHaveBeenLastCalledWith('Erro', 'Não foi possível excluir o produto.');

    alertSpy.mockRestore();
  });

  it('should cover bulk desactivation confirm and cancel alert choices', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByText } = render(<ManageProductsScreen />);

    await waitFor(() => {
      expect(getByText('Ração Crítica Red')).toBeTruthy();
    });

    // 1. Trigger bulk desactivation with error path first to avoid mutating state
    mockInFn.mockRejectedValueOnce(new Error('Mass update rejection'));
    fireEvent.press(getByText('Desativar todos'));
    
    const lastCall1 = alertSpy.mock.calls[alertSpy.mock.calls.length - 1];
    let buttons1 = lastCall1 && lastCall1[2] ? lastCall1[2] : [];
    let confirmBtn1 = buttons1.find((b: any) => b.text === 'Desativar Todos');
    if (confirmBtn1 && typeof confirmBtn1.onPress === 'function') {
      const onPressFn = confirmBtn1.onPress;
      await act(async () => {
        await onPressFn();
      });
    }
    expect(alertSpy).toHaveBeenLastCalledWith('Erro', 'Ocorreu um erro ao desativar os produtos.');

    // 1b. Trigger bulk desactivation where supabase returns an error object (line 318)
    mockInFn.mockResolvedValueOnce({ error: new Error('Supabase error') });
    fireEvent.press(getByText('Desativar todos'));
    const lastCall1b = alertSpy.mock.calls[alertSpy.mock.calls.length - 1];
    buttons1 = lastCall1b && lastCall1b[2] ? lastCall1b[2] : [];
    confirmBtn1 = buttons1.find((b: any) => b.text === 'Desativar Todos');
    if (confirmBtn1 && typeof confirmBtn1.onPress === 'function') {
      const onPressFn = confirmBtn1.onPress;
      await act(async () => {
        await onPressFn();
      });
    }
    expect(alertSpy).toHaveBeenLastCalledWith('Erro', 'Não foi possível desativar os produtos.');

    // 2. Cancel choice
    fireEvent.press(getByText('Desativar todos'));
    const lastCall2 = alertSpy.mock.calls[alertSpy.mock.calls.length - 1];
    const buttons2 = lastCall2 && lastCall2[2] ? lastCall2[2] : [];
    const cancelBtn2 = buttons2.find((b: any) => b.text === 'Cancelar');
    if (cancelBtn2 && typeof cancelBtn2.onPress === 'function') {
      cancelBtn2.onPress();
    }

    // 3. Confirm choice (success)
    const confirmBtn2 = buttons2.find((b: any) => b.text === 'Desativar Todos');
    if (confirmBtn2 && typeof confirmBtn2.onPress === 'function') {
      const onPressFn = confirmBtn2.onPress;
      await act(async () => {
        await onPressFn();
      });
    }
    expect(mockUpdate).toHaveBeenCalledWith({ active: false });

    alertSpy.mockRestore();
  });

  it('should handle selection mode selection, check-all, cancel selection, and custom red warning modal confirm/cancel delete', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByText, getAllByTestId } = render(<ManageProductsScreen />);

    await waitFor(() => {
      expect(getByText('Ração Crítica Red')).toBeTruthy();
    });

    // 1. Enter selection mode by clicking Excluir produto first (selectionMode = false -> true)
    fireEvent.press(getByText('Excluir produto'));
    expect(getByText('Cancelar Seleção')).toBeTruthy();

    // 1a. Click Cancelar Seleção to exit selection mode (covers line 721-722)
    fireEvent.press(getByText('Cancelar Seleção'));
    expect(getByText('Desativar todos')).toBeTruthy();

    // Enter selection mode again to proceed
    fireEvent.press(getByText('Excluir produto'));

    // 1b. Select all to change button text to Deselecionar tudo
    fireEvent.press(getByText('Selecionar tudo'));
    expect(getByText('Deselecionar tudo')).toBeTruthy();

    // 1c. Click Deselecionar tudo to deselect all (text becomes Selecionar tudo)
    fireEvent.press(getByText('Deselecionar tudo'));
    expect(getByText('Selecionar tudo')).toBeTruthy();

    // Select all again to proceed
    fireEvent.press(getByText('Selecionar tudo'));

    // 2. Toggle check checkbox area in first card reliably using testID
    const checkboxes = getAllByTestId('product-checkbox');
    await act(async () => {
      fireEvent.press(checkboxes[0]); // deselects first card
    });

    const freshCheckboxes = getAllByTestId('product-checkbox');
    await act(async () => {
      fireEvent.press(freshCheckboxes[0]); // selects first card (covers newSet.add)
    });

    fireEvent.press(getByText('Deselecionar tudo'));
    fireEvent.press(getByText('Selecionar tudo'));

    // 4. Custom delete modal - CANCEL path (modal closes, products remain)
    fireEvent.press(getByText(/Confirmar/));
    fireEvent.press(getByText('Cancelar'));

    // 5. Custom delete modal - ERROR path (attempts delete and fails, modal closes, products remain)
    fireEvent.press(getByText(/Confirmar/));
    mockInFn.mockResolvedValueOnce({ error: new Error('Delete in error') });
    await act(async () => {
      fireEvent.press(getByText('Sim, Excluir Definitivamente'));
    });
    expect(alertSpy).toHaveBeenCalledWith('Erro', 'Ocorreu um erro na exclusão em massa.');

    // 5b. Custom delete modal - EXCEPTION path (rejection, triggers catch block)
    fireEvent.press(getByText(/Confirmar/));
    mockInFn.mockRejectedValueOnce(new Error('Delete in exception'));
    await act(async () => {
      fireEvent.press(getByText('Sim, Excluir Definitivamente'));
    });
    expect(alertSpy).toHaveBeenLastCalledWith('Erro', 'Ocorreu um erro ao realizar a exclusão.');

    // 6. Toggle selection mode off empty list delete warning (selectionMode is cancelled, products remain)
    fireEvent.press(getByText('Deselecionar tudo'));
    fireEvent.press(getByText('Confirmar (0)'));
    expect(alertSpy).toHaveBeenLastCalledWith('Aviso', 'Nenhum produto selecionado para exclusão.');

    // 7. Custom delete modal - SUCCESS path (successfully deletes them, list empty at the very end of the test)
    fireEvent.press(getByText('Selecionar tudo'));
    fireEvent.press(getByText(/Confirmar/));
    await act(async () => {
      fireEvent.press(getByText('Sim, Excluir Definitivamente'));
    });
    expect(mockDelete).toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it('should cover search input text change, edit screen navigation, and header create screen navigation', async () => {
    const { getByText, UNSAFE_getAllByType } = render(<ManageProductsScreen />);

    await waitFor(() => {
      expect(getByText('Ração Crítica Red')).toBeTruthy();
    });

    // Press edit icon on first card (touchables[9])
    const { TouchableOpacity } = require('react-native');
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    
    await act(async () => {
      fireEvent.press(touchables[9]);
    });
    expect(mockNavigate).toHaveBeenCalledWith('ProductEditScreen', { product: mockProductsList[0] });

    // Navigate to ProductCreateScreen
    fireEvent.press(getByText('Registrar produto'));
    expect(mockNavigate).toHaveBeenCalledWith('ProductCreateScreen');
  });

  it('should show empty/error state when fetch has error', async () => {
    mockOrderFn.mockResolvedValueOnce({ data: null, error: new Error('Query error') });
    const { getByText } = render(<ManageProductsScreen />);

    await waitFor(() => {
      expect(getByText('Não foi possível carregar os produtos.')).toBeTruthy();
    });
  });

  it('should clean and handle filter modal status selection variations and alerts', async () => {
    const { getByText, UNSAFE_getAllByType } = render(<ManageProductsScreen />);

    await waitFor(() => {
      expect(getByText('Ração Crítica Red')).toBeTruthy();
    });

    // 1a. Open filter modal and cancel (covers line 998)
    fireEvent.press(getByText('Filtro'));
    fireEvent.press(getByText('Cancelar'));

    // 1b. Open filter modal, toggle Yellow alert checkbox, apply
    fireEvent.press(getByText('Filtro'));
    fireEvent.press(getByText('Estoque Moderado (Alerta Amarelo)'));
    fireEvent.press(getByText('Aplicar Filtros'));

    // 2. Open modal again, toggle off Yellow, toggle on Red, apply
    fireEvent.press(getByText('Moderado'));
    fireEvent.press(getByText('Estoque Moderado (Alerta Amarelo)')); // off
    fireEvent.press(getByText('Estoque Crítico (Alerta Vermelho)')); // on
    fireEvent.press(getByText('Aplicar Filtros'));

    // 3. Open modal again, toggle on Yellow to have both Yellow & Red alert active, select Active status filter, apply
    fireEvent.press(getByText('Crítico'));
    fireEvent.press(getByText('Estoque Moderado (Alerta Amarelo)')); // on
    fireEvent.press(getByText('Somente ativos'));
    fireEvent.press(getByText('Aplicar Filtros'));

    // 4. Open again using touchables[0] (Filter button) to check mutually exclusive return boundaries
    const { TouchableOpacity } = require('react-native');
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(touchables[0]);

    fireEvent.press(getByText('Somente inativos')); // should reset alerts
    fireEvent.press(getByText('Estoque Moderado (Alerta Amarelo)')); // should do nothing if inativos is active (covers line 174)
    fireEvent.press(getByText('Estoque Crítico (Alerta Vermelho)')); // should do nothing if inativos is active (covers line 179)
    fireEvent.press(getByText('Todos os produtos')); // reset status filter to allow alert selections

    fireEvent.press(getByText('Aplicar Filtros'));
  });

  it('should trigger alert warning dismiss close icon presses', async () => {
    const { getByText, UNSAFE_getAllByType } = render(<ManageProductsScreen />);

    await waitFor(() => {
      expect(getByText('Ração Crítica Red')).toBeTruthy();
    });

    // Find and press close alert icons
    const { TouchableOpacity } = require('react-native');
    const touchables = UNSAFE_getAllByType(TouchableOpacity);

    const closeButtons = touchables.filter(t => {
      try {
        const feather = t.findByType(Feather);
        return feather.props.name === 'x';
      } catch (_) {
        return false;
      }
    });

    for (const btn of closeButtons) {
      await act(async () => {
        fireEvent.press(btn);
      });
    }
  });

  it('should show Aviso when bulk desactivating an empty active list', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByText } = render(<ManageProductsScreen />);

    await waitFor(() => {
      expect(getByText('Ração Crítica Red')).toBeTruthy();
    });

    // Filter to Somente inativos first so there are zero active products
    fireEvent.press(getByText('Filtro'));
    fireEvent.press(getByText('Somente inativos'));
    fireEvent.press(getByText('Aplicar Filtros'));

    // Click Desativar todos
    fireEvent.press(getByText('Desativar todos'));
    expect(alertSpy).toHaveBeenCalledWith('Aviso', 'Não há produtos ativos na lista filtrada para desativar.');

    alertSpy.mockRestore();
  });

  it('should cover styling branches under light mode, getFirstImageUrl edge cases, and category fallbacks', async () => {
    // 1. Switch to Light Mode
    (global as any).isDarkModeTest = false;

    // 2. Mock supabase products with null names/descriptions/images and non-category items
    const mockSpecialProducts = [
      {
        id: 'sp-1',
        name: null, // product.name || '' fallback
        description: null, // product.description || '' fallback
        price: 50,
        stock: 5,
        category_id: 'cat-unknown',
        active: true,
        image_url: '[]' // empty array json cover
      },
      {
        id: 'sp-2',
        name: 'Special Item Object Image',
        description: 'Special description',
        price: 60,
        stock: 120,
        category_id: 'cat-1',
        active: false,
        image_url: '{"url": "not-an-array"}' // non-array json cover
      },
      {
        id: 'sp-3',
        name: 'Special Item Invalid Image',
        price: 60,
        stock: 120,
        category_id: 'cat-1',
        active: false,
        image_url: '[invalid-json' // JSON parse exception cover
      }
    ];

    mockOrderFn.mockResolvedValueOnce({ data: mockSpecialProducts, error: null });

    const { getByText } = render(<ManageProductsScreen />);

    await waitFor(() => {
      expect(getByText('Sem nome')).toBeTruthy();
    });

    // 3. Test activeCategories filtering with OutroCategory to cover fallback branches
    stableRoute.params = { searchText: '', categories: ['OutroCategory'] };
    await act(async () => {
      if (focusCallback) focusCallback();
    });

    // Revert to Dark Mode
    (global as any).isDarkModeTest = true;
  });
});
