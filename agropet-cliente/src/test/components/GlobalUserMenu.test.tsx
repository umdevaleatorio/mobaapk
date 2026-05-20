import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { GlobalUserMenu } from '../../../src/presentation/components/GlobalUserMenu';

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

describe('GlobalUserMenu Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render menu items when visible', () => {
    const { getByText } = render(<GlobalUserMenu />);

    expect(getByText('Ver perfil')).toBeTruthy();
    expect(getByText('Ver pedidos')).toBeTruthy();
    expect(getByText('Sair')).toBeTruthy();
  });

  it('should navigate to ProfileScreen when "Ver perfil" is pressed', () => {
    const { getByText } = render(<GlobalUserMenu />);

    fireEvent.press(getByText('Ver perfil'));

    expect(mockCloseMenu).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('ProfileScreen', undefined);
  });

  it('should navigate to OrdersScreen when "Ver pedidos" is pressed', () => {
    const { getByText } = render(<GlobalUserMenu />);

    fireEvent.press(getByText('Ver pedidos'));

    expect(mockCloseMenu).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('OrdersScreen', undefined);
  });

  it('should call signOut when "Sair" is pressed', async () => {
    const { getByText } = render(<GlobalUserMenu />);

    await fireEvent.press(getByText('Sair'));

    expect(mockCloseMenu).toHaveBeenCalled();
  });
});
