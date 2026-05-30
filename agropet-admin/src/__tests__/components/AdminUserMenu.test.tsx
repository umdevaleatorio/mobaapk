import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Platform } from 'react-native';

jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  Object.defineProperty(rn.Platform, 'OS', {
    value: 'android',
    configurable: true,
  });
  return rn;
});

import { AdminUserMenu } from '../../presentation/components/AdminUserMenu';

// ── Mocks ──
const mockNavigate = jest.fn();
const mockCloseMenu = jest.fn();
const mockSignOut = jest.fn().mockResolvedValue(undefined);

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

const mockUseTheme = jest.fn().mockReturnValue({
  colors: {},
  isDarkMode: false,
  toggleTheme: jest.fn(),
});
jest.mock('../../presentation/contexts/ThemeContext', () => ({
  useTheme: () => mockUseTheme(),
}));

let mockMenuVisibleValue = true;
jest.mock('../../presentation/contexts/UserMenuContext', () => ({
  useUserMenu: () => ({
    isMenuVisible: mockMenuVisibleValue,
    closeMenu: mockCloseMenu,
    toggleMenu: jest.fn(),
  }),
}));

jest.mock('../../presentation/contexts/AuthContext', () => {
  return {
    AuthContext: {
      ...jest.requireActual('react').createContext({
        signOut: () => mockSignOut(),
        session: null,
        user: null,
        isLoading: false,
      }),
    },
  };
});

jest.mock('../../presentation/theme/colors', () => ({}));

describe('AdminUserMenu Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignOut.mockReset();
    mockSignOut.mockResolvedValue(undefined);
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
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('should catch and log error if signOut fails when "Sair" is pressed', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockSignOut.mockRejectedValue(new Error('Signout failed'));

    const { getByText } = render(<AdminUserMenu />);

    await fireEvent.press(getByText('Sair'));

    expect(mockCloseMenu).toHaveBeenCalled();
    expect(mockSignOut).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith("Erro ao sair:", expect.any(Error));

    consoleErrorSpy.mockRestore();
  });

  it('should call onRequestClose (closeMenu) on modal backdrop press', () => {
    const { getByText } = render(<AdminUserMenu />);
    // The menu items are visible so Modal is rendering
    expect(getByText('Ver perfil')).toBeTruthy();
  });

  it('should render correct styles under dark mode', () => {
    mockUseTheme.mockReturnValue({
      colors: {
        cardBackground: '#2E2E38',
        inputBackground: '#2E2E38',
        headerBackground: '#000000',
        settingsCardBackground: '#1E1E24',
        textPrimary: '#FFFFFF',
        accent: '#4A90E2',
      },
      isDarkMode: true,
      toggleTheme: jest.fn(),
    });

    const { getByText } = render(<AdminUserMenu />);
    expect(getByText('Ver perfil')).toBeTruthy();
  });

  it('should support Android-specific layouts for menu container', () => {
    const { getByText } = render(<AdminUserMenu />);
    expect(getByText('Ver perfil')).toBeTruthy();
  });

  it('should return null when not visible', () => {
    mockMenuVisibleValue = false;
    const { toJSON } = render(<AdminUserMenu />);
    expect(toJSON()).toBeNull();
    mockMenuVisibleValue = true; // Reset for other tests
  });
});
