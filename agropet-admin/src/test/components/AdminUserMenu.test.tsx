import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AdminUserMenu } from '../../../src/presentation/components/AdminUserMenu';

// ── Mocks ──
const mockSignOut = jest.fn();
const mockNavigate = jest.fn();
const mockCloseMenu = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('../../../src/presentation/contexts/UserMenuContext', () => ({
  useUserMenu: () => ({
    isMenuVisible: true,
    closeMenu: mockCloseMenu,
    toggleMenu: jest.fn(),
  }),
}));

jest.mock('../../../src/presentation/contexts/AuthContext', () => ({
  AuthContext: {
    ...jest.requireActual('react').createContext({
      signOut: mockSignOut,
      session: null,
      user: null,
      isLoading: false,
    }),
  },
}));

jest.mock('../../../src/presentation/theme/colors', () => ({}));

describe('AdminUserMenu Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render menu items when visible', () => {
    const { getByText } = render(<AdminUserMenu />);

    expect(getByText('Ver perfil')).toBeTruthy();
    expect(getByText('Ver pedidos')).toBeTruthy();
    expect(getByText('Sair')).toBeTruthy();
  });

  it('should navigate to AdminProfile when "Ver perfil" is pressed', () => {
    const { getByText } = render(<AdminUserMenu />);

    fireEvent.press(getByText('Ver perfil'));

    expect(mockCloseMenu).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('AdminProfile', undefined);
  });

  it('should navigate to AdminOrdersScreen when "Ver pedidos" is pressed', () => {
    const { getByText } = render(<AdminUserMenu />);

    fireEvent.press(getByText('Ver pedidos'));

    expect(mockCloseMenu).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('AdminOrdersScreen', undefined);
  });

  it('should call signOut when "Sair" is pressed', async () => {
    const { getByText } = render(<AdminUserMenu />);

    await fireEvent.press(getByText('Sair'));

    expect(mockCloseMenu).toHaveBeenCalled();
  });
});
