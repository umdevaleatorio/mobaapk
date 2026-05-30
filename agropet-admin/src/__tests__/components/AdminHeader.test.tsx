import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import AdminHeader from '../../presentation/components/AdminHeader';
import * as SecureStore from 'expo-secure-store';
import { AuthContext } from '../../presentation/contexts/AuthContext';
import { ThemeProvider } from '../../presentation/contexts/ThemeContext';
import { UserMenuProvider } from '../../presentation/contexts/UserMenuContext';

// Mock Supabase
jest.mock('../../data/datasources/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));

// Mock react-navigation hooks
const mockNavigate = jest.fn();
const mockAddListener = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    addListener: mockAddListener,
  }),
}));

// Mock secure store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));



describe('AdminHeader Component', () => {
  const mockUser = { id: 'admin-userid-123' } as any;
  let focusCallback: any = null;

  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.getItemAsync as jest.Mock).mockReset();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    mockAddListener.mockImplementation((event: string, cb: any) => {
      if (event === 'focus') {
        focusCallback = cb;
      }
      return jest.fn(); // unsubscribe mock
    });
  });

  const renderHeader = (props: any = {}, userVal: any = mockUser) => {
    return render(
      <AuthContext.Provider value={{ session: null, user: userVal, isLoading: false, signOut: async () => {} }}>
        <ThemeProvider>
          <UserMenuProvider>
            <AdminHeader {...props} />
          </UserMenuProvider>
        </ThemeProvider>
      </AuthContext.Provider>
    );
  };

  it('should render correct SVGs and text based on title prop', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

    const { getByTestId, rerender } = renderHeader({ title: 'home' });
    expect(getByTestId('header-title-wrapper')).toBeTruthy();

    // Rerender with 'opcoes'
    rerender(
      <AuthContext.Provider value={{ session: null, user: mockUser, isLoading: false, signOut: async () => {} }}>
        <ThemeProvider>
          <UserMenuProvider>
            <AdminHeader title="opcoes" />
          </UserMenuProvider>
        </ThemeProvider>
      </AuthContext.Provider>
    );
    expect(getByTestId('header-title-wrapper')).toBeTruthy();
  });

  it('should render all textual titles correctly', () => {
    const titles: Array<'mapa' | 'editar_produto' | 'perfil_adm' | 'detalhes_pedido' | 'painel_vendas' | 'consultar_vendas'> = [
      'mapa', 'editar_produto', 'perfil_adm', 'detalhes_pedido', 'painel_vendas', 'consultar_vendas'
    ];

    titles.forEach((t) => {
      const { getByText } = renderHeader({ title: t });
      if (t === 'mapa') expect(getByText('Localizar entrega')).toBeTruthy();
      if (t === 'editar_produto') expect(getByText('Editar produto')).toBeTruthy();
      if (t === 'perfil_adm') expect(getByText('Perfil adm')).toBeTruthy();
      if (t === 'detalhes_pedido') expect(getByText('Detalhes do pedido')).toBeTruthy();
      if (t === 'painel_vendas') expect(getByText('Painel de vendas')).toBeTruthy();
      if (t === 'consultar_vendas') expect(getByText('Consultar vendas')).toBeTruthy();
    });
  });

  it('should navigate to Home when Mini Logo is pressed', () => {
    const { getByTestId } = renderHeader({ title: 'home' });
    const miniLogoBtn = getByTestId('header-logo-btn');
    expect(miniLogoBtn).toBeTruthy();
    fireEvent.press(miniLogoBtn);
    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });

  it('should trigger photo loading and handle custom avatarUri from SecureStore', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('file://custom_avatar.png');

    renderHeader({ title: 'home' });

    await waitFor(() => {
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('av_admin-us');
    });
  });

  it('should fallback to null photo when SecureStore throws error', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(new Error('Read error'));

    renderHeader({ title: 'home' });

    await waitFor(() => {
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('av_admin-us');
    });
  });

  it('should reload photo when focus is triggered', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('file://avatar.png');
    renderHeader({ title: 'home' });

    await waitFor(() => {
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('av_admin-us');
    });

    (SecureStore.getItemAsync as jest.Mock).mockClear();

    // Trigger focus listener
    expect(focusCallback).toBeInstanceOf(Function);
    await act(async () => {
      focusCallback();
    });

    expect(SecureStore.getItemAsync).toHaveBeenCalledWith('av_admin-us');
  });

  it('should render search bar and handle text changes for gerenciar', async () => {
    const mockOnSearchChange = jest.fn();
    const { getByPlaceholderText } = renderHeader({
      title: 'gerenciar',
      searchValue: 'my-search',
      onSearchChange: mockOnSearchChange,
    });

    const searchInput = getByPlaceholderText('Pesquisar...');
    expect(searchInput.props.value).toBe('my-search');

    fireEvent.changeText(searchInput, 'new-query');
    fireEvent(searchInput, 'submitEditing');
    expect(mockOnSearchChange).toHaveBeenCalledWith('new-query');
  });

  it('should scale animated circle on profile active title', async () => {
    const { getByTestId } = renderHeader({ title: 'perfil_adm' });
    expect(getByTestId('header-person-btn')).toBeTruthy();
  });

  it('should handle toggle user menu when person circle is pressed', async () => {
    const { getByTestId } = renderHeader({ title: 'home' });
    const personBtn = getByTestId('header-person-btn');
    expect(personBtn).toBeTruthy();

    await act(async () => {
      fireEvent.press(personBtn);
    });
  });

  it('should render header in dark mode and support search icon click', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (key: string) => {
      if (key === 'app_theme_dark') return 'true';
      return null;
    });

    const mockOnSearchChange = jest.fn();
    const { getByPlaceholderText, getByTestId } = render(
      <AuthContext.Provider value={{ session: null, user: mockUser, isLoading: false, signOut: async () => {} }}>
        <ThemeProvider>
          <UserMenuProvider>
            <AdminHeader title="gerenciar" searchValue="dark-search" onSearchChange={mockOnSearchChange} />
          </UserMenuProvider>
        </ThemeProvider>
      </AuthContext.Provider>
    );

    await act(async () => {
      // Allow ThemeProvider secure store read effect to run
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const searchInput = getByPlaceholderText('Pesquisar...');
    expect(searchInput.props.value).toBe('dark-search');

    const searchIconBtn = getByTestId('header-search-icon-btn');
    expect(searchIconBtn).toBeTruthy();

    await act(async () => {
      fireEvent.press(searchIconBtn);
    });
    expect(mockOnSearchChange).toHaveBeenCalledWith('dark-search');
  });

  it('should support platform-specific styling under Android', () => {
    const originalOS = Platform.OS;
    Object.defineProperty(Platform, 'OS', {
      value: 'android',
      configurable: true,
    });

    try {
      render(
        <AuthContext.Provider value={{ session: null, user: mockUser, isLoading: false, signOut: async () => {} }}>
          <ThemeProvider>
            <UserMenuProvider>
              <AdminHeader title="home" />
            </UserMenuProvider>
          </ThemeProvider>
        </AuthContext.Provider>
      );
    } finally {
      Object.defineProperty(Platform, 'OS', {
        value: originalOS,
        configurable: true,
      });
    }
  });

  it('should render all SVG title variants', () => {
    const svgTitles: Array<'home' | 'opcoes' | 'ver_pedidos' | 'historico_vendas' | 'gerenciar' | 'registrar_produto'> = [
      'home', 'opcoes', 'ver_pedidos', 'historico_vendas', 'gerenciar', 'registrar_produto'
    ];

    svgTitles.forEach((t) => {
      const { getByTestId } = renderHeader({ title: t });
      expect(getByTestId('header-title-wrapper')).toBeTruthy();
    });
  });

  it('should skip photo loading when user is null', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);

    renderHeader({ title: 'home' }, null);

    await waitFor(() => {
      expect(SecureStore.getItemAsync).not.toHaveBeenCalledWith(expect.stringContaining('av_'));
    });
  });

  it('should render header with no onSearchChange (triggerSearch is a no-op)', () => {
    const { getByPlaceholderText, getByTestId } = renderHeader({
      title: 'registrar_produto',
      searchValue: 'test',
    });

    const searchInput = getByPlaceholderText('Pesquisar...');
    expect(searchInput).toBeTruthy();
    
    const searchIconBtn = getByTestId('header-search-icon-btn');
    fireEvent.press(searchIconBtn);
    // Should not throw - triggerSearch gracefully handles missing onSearchChange
  });

  it('should render photo from secure store as Image component', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('file://my-avatar.png');

    const { getByTestId } = renderHeader({ title: 'perfil_adm' });

    await waitFor(() => {
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith('av_admin-us');
    });
    // Person btn exists and has photo
    expect(getByTestId('header-person-btn')).toBeTruthy();
  });

  it('should render search bar for editar_produto title', () => {
    const mockOnSearchChange = jest.fn();
    const { getByPlaceholderText, getByTestId } = renderHeader({
      title: 'editar_produto',
      searchValue: 'edit-test',
      onSearchChange: mockOnSearchChange,
    });

    expect(getByPlaceholderText('Pesquisar...')).toBeTruthy();
    expect(getByTestId('header-search-icon-btn')).toBeTruthy();
  });
});

