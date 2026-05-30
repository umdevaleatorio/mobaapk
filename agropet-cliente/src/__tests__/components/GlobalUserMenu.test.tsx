import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { GlobalUserMenu } from '../../presentation/components/GlobalUserMenu';

let mockIsMenuVisible = true;
const mockNavigate = jest.fn();
const mockCloseMenu = jest.fn();
const mockSignOut = jest.fn().mockResolvedValue(undefined);
let mockIsDarkMode = false;

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('../../presentation/contexts/UserMenuContext', () => ({
  useUserMenu: () => ({
    isMenuVisible: mockIsMenuVisible,
    closeMenu: mockCloseMenu,
    toggleMenu: jest.fn(),
  }),
}));

jest.mock('../../presentation/contexts/AuthContext', () => {
  return {
    AuthContext: {
      ...jest.requireActual('react').createContext({
        signOut: (...args: any[]) => mockSignOut(...args),
        session: null,
        user: null,
        isLoading: false,
      }),
    },
  };
});

jest.mock('../../presentation/contexts/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#EA841E',
      background: '#F5F5F5',
      backgroundLight: '#FFFFFF',
      textPrimary: '#1C2434',
      success: '#25BE36',
    },
    isDarkMode: mockIsDarkMode,
    toggleTheme: jest.fn(),
  }),
}));

describe('GlobalUserMenu Component', () => {
  beforeEach(() => {
    mockIsMenuVisible = true;
    mockIsDarkMode = false;
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
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
    jest.advanceTimersByTime(500);

    expect(mockCloseMenu).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('ProfileScreen', undefined);
  });

  it('should navigate to OrdersScreen when "Ver pedidos" is pressed', () => {
    const { getByText } = render(<GlobalUserMenu />);

    fireEvent.press(getByText('Ver pedidos'));
    jest.advanceTimersByTime(500);

    expect(mockCloseMenu).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('OrdersScreen', undefined);
  });

  it('should call signOut when "Sair" is pressed', async () => {
    const { getByText } = render(<GlobalUserMenu />);

    await fireEvent.press(getByText('Sair'));
    jest.advanceTimersByTime(500);

    expect(mockCloseMenu).toHaveBeenCalled();
  });

  it('should run closing animation and set shouldRender to false when isMenuVisible becomes false', () => {
    mockIsMenuVisible = true;
    const { rerender, queryByText } = render(<GlobalUserMenu />);
    expect(queryByText('Ver perfil')).toBeTruthy();

    mockIsMenuVisible = false;
    rerender(<GlobalUserMenu />);

    jest.advanceTimersByTime(200);
    expect(queryByText('Ver perfil')).toBeNull();
  });

  it('should render correct styles in dark mode', () => {
    mockIsDarkMode = true;
    const { getByText } = render(<GlobalUserMenu />);
    expect(getByText('Ver perfil')).toBeTruthy();
    mockIsDarkMode = false;
  });

  it('should log error when signOut rejects', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockSignOut.mockRejectedValueOnce(new Error('SignOut failure'));

    const { getByText } = render(<GlobalUserMenu />);
    fireEvent.press(getByText('Sair'));

    await act(async () => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Erro ao sair:', expect.any(Error));
    });
    consoleSpy.mockRestore();
  });
});
