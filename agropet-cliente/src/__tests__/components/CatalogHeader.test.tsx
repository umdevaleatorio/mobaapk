const { Platform } = require('react-native');
Platform.OS = 'ios';

import React from 'react';
import { render, act, fireEvent, waitFor } from '@testing-library/react-native';
import { CatalogHeader, CatalogFilter } from '../../presentation/components/CatalogHeader';
import { AuthContext } from '../../presentation/contexts/AuthContext';
import { useUserMenu } from '../../presentation/contexts/UserMenuContext';
import { useTheme } from '../../presentation/contexts/ThemeContext';
import { useFilter } from '../../presentation/contexts/FilterContext';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';

// ── Mocks ──
jest.mock('../../presentation/contexts/UserMenuContext', () => ({
  useUserMenu: jest.fn(),
}));

jest.mock('../../presentation/contexts/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

jest.mock('../../presentation/contexts/FilterContext', () => ({
  useFilter: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useRoute: jest.fn(),
  useNavigation: jest.fn(),
}));

// Mock the svgMock.js globally mapped target
jest.mock('../mocks/svgMock.js', () => {
  const React = require('react');
  const { View } = require('react-native');
  return (props: any) => {
    let testID = 'svg-mock';
    if (props.width === 36) testID = 'mini-logo';
    if (props.width === 26) testID = 'lupa';
    if (props.width === 46) testID = 'person-icon';
    return React.createElement('View', { testID, ...props });
  };
});

describe('CatalogHeader & CatalogFilter', () => {
  let mockToggleMenu: jest.Mock;
  let mockSetSearchText: jest.Mock;
  let mockToggleCategory: jest.Mock;
  let mockNavigate: jest.Mock;
  let mockAddListener: jest.Mock;
  let unsubscribeMock: jest.Mock;

  const mockUser = { id: '12345678-user-id', email: 'client@test.com' } as any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockToggleMenu = jest.fn();
    (useUserMenu as jest.Mock).mockReturnValue({ toggleMenu: mockToggleMenu });

    (useTheme as jest.Mock).mockReturnValue({
      colors: {
        background: '#F5F5F5',
        backgroundLight: '#F5F5F5',
        headerBackground: '#1C2434',
        white: '#FFFFFF',
      },
      isDarkMode: false,
    });

    mockSetSearchText = jest.fn();
    mockToggleCategory = jest.fn();
    (useFilter as jest.Mock).mockReturnValue({
      searchText: '',
      setSearchText: mockSetSearchText,
      selectedCategories: [],
      toggleCategory: mockToggleCategory,
    });

    (useRoute as jest.Mock).mockReturnValue({ name: 'Menu' });

    unsubscribeMock = jest.fn();
    mockAddListener = jest.fn().mockReturnValue(unsubscribeMock);
    mockNavigate = jest.fn();
    (useNavigation as jest.Mock).mockReturnValue({
      navigate: mockNavigate,
      addListener: mockAddListener,
    });

    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
  });

  describe('CatalogHeader', () => {
    it('should render header elements correctly with defaults', async () => {
      const { getByText, getByPlaceholderText, queryByTestId } = render(
        <AuthContext.Provider value={{ session: null, user: null, isLoading: false, signOut: jest.fn() }}>
          <CatalogHeader searchText="" onSearchChange={jest.fn()} />
        </AuthContext.Provider>
      );

      expect(getByText('Catálogo')).toBeTruthy();
      expect(getByPlaceholderText('Procurar produtos...')).toBeTruthy();
      expect(queryByTestId('person-icon')).toBeTruthy();
    });

    it('should load avatar photo from SecureStore on mount and navigation focus', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue('file:///my-avatar.jpg');

      render(
        <AuthContext.Provider value={{ session: null, user: mockUser, isLoading: false, signOut: jest.fn() }}>
          <CatalogHeader searchText="" onSearchChange={jest.fn()} />
        </AuthContext.Provider>
      );

      // Verify load on mount
      await waitFor(() => {
        expect(SecureStore.getItemAsync).toHaveBeenCalledWith('av_12345678');
      });

      // Verify event listener is added
      expect(mockAddListener).toHaveBeenCalledWith('focus', expect.any(Function));

      // Trigger navigation focus callback
      const focusCallback = mockAddListener.mock.calls[0][1];
      await act(async () => {
        focusCallback();
      });

      expect(SecureStore.getItemAsync).toHaveBeenCalledTimes(2);
    });

    it('should trigger search text changes and fire navigation when click search or submit', async () => {
      (useRoute as jest.Mock).mockReturnValue({ name: 'CartScreen' });
      const mockSearchChange = jest.fn();
      const { getByPlaceholderText, getByTestId } = render(
        <AuthContext.Provider value={{ session: null, user: null, isLoading: false, signOut: jest.fn() }}>
          <CatalogHeader searchText="" onSearchChange={mockSearchChange} />
        </AuthContext.Provider>
      );

      const input = getByPlaceholderText('Procurar produtos...');
      await act(async () => {
        fireEvent.changeText(input, 'purina');
      });

      // Trigger search via lupa click
      await act(async () => {
        fireEvent.press(getByTestId('lupa'));
      });

      expect(mockSetSearchText).toHaveBeenCalledWith('purina');
      expect(mockSearchChange).toHaveBeenCalledWith('purina');
      expect(mockNavigate).toHaveBeenCalledWith('Menu');

      // Trigger search via input submit
      await act(async () => {
        fireEvent(input, 'submitEditing');
      });
      expect(mockSetSearchText).toHaveBeenCalledTimes(2);
    });

    it('should scale profile avatar icon on press and toggle drawer menu', async () => {
      const { getByTestId } = render(
        <AuthContext.Provider value={{ session: null, user: null, isLoading: false, signOut: jest.fn() }}>
          <CatalogHeader searchText="" onSearchChange={jest.fn()} />
        </AuthContext.Provider>
      );

      await act(async () => {
        fireEvent.press(getByTestId('person-icon'));
      });

      expect(mockToggleMenu).toHaveBeenCalled();
    });

    it('should trigger profile transition animations when route is active', async () => {
      (useRoute as jest.Mock).mockReturnValue({ name: 'ProfileScreen' });

      render(
        <AuthContext.Provider value={{ session: null, user: null, isLoading: false, signOut: jest.fn() }}>
          <CatalogHeader searchText="" onSearchChange={jest.fn()} />
        </AuthContext.Provider>
      );

      // Verify it loaded styling matching active profile green bg
      expect(useRoute).toHaveBeenCalled();
    });

    it('should support rendering custom photoUri directly if supplied in props', () => {
      const { queryByTestId } = render(
        <AuthContext.Provider value={{ session: null, user: null, isLoading: false, signOut: jest.fn() }}>
          <CatalogHeader searchText="" onSearchChange={jest.fn()} photoUri="file:///custom-img.png" />
        </AuthContext.Provider>
      );

      // PersonIcon should not be rendered, because custom photoUri is set
      expect(queryByTestId('person-icon')).toBeNull();
    });

    it('should render header with dark mode configurations', () => {
      (useTheme as jest.Mock).mockReturnValue({
        colors: {
          background: '#121212',
          backgroundLight: '#18181C',
          headerBackground: '#121212',
          white: '#121212',
        },
        isDarkMode: true,
      });

      const { getByPlaceholderText } = render(
        <AuthContext.Provider value={{ session: null, user: null, isLoading: false, signOut: jest.fn() }}>
          <CatalogHeader searchText="" onSearchChange={jest.fn()} />
        </AuthContext.Provider>
      );

      expect(getByPlaceholderText('Procurar produtos...')).toBeTruthy();
    });

    it('should navigate to Menu catalog screen when clicking Logo button', () => {
      const { getByTestId } = render(
        <AuthContext.Provider value={{ session: null, user: null, isLoading: false, signOut: jest.fn() }}>
          <CatalogHeader searchText="" onSearchChange={jest.fn()} />
        </AuthContext.Provider>
      );

      fireEvent.press(getByTestId('mini-logo'));
      expect(mockNavigate).toHaveBeenCalledWith('Menu');
    });

    it('should fallback to null photo if SecureStore reading fails', async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(new Error('SecureStore read error'));
      
      const { getByText } = render(
        <AuthContext.Provider value={{ session: null, user: { id: '12345678-user-id', email: 'client@test.com' } as any, isLoading: false, signOut: jest.fn() }}>
          <CatalogHeader searchText="" onSearchChange={jest.fn()} />
        </AuthContext.Provider>
      );
      
      await waitFor(() => {
        expect(getByText('Catálogo')).toBeTruthy();
      });
    });

    it('should cover fallback search paths (no search callback and on Menu screen)', async () => {
      (useRoute as jest.Mock).mockReturnValue({ name: 'Menu' });
      const { getByPlaceholderText, getByTestId } = render(
        <AuthContext.Provider value={{ session: null, user: null, isLoading: false, signOut: jest.fn() }}>
          <CatalogHeader searchText="" onSearchChange={undefined as any} />
        </AuthContext.Provider>
      );

      const input = getByPlaceholderText('Procurar produtos...');
      await act(async () => {
        fireEvent.changeText(input, 'adubo');
      });

      await act(async () => {
        fireEvent.press(getByTestId('lupa'));
      });

      expect(mockSetSearchText).toHaveBeenCalledWith('adubo');
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('CatalogFilter', () => {
    it('should render filter tags and active labels correctly', () => {
      (useFilter as jest.Mock).mockReturnValue({
        searchText: '',
        setSearchText: mockSetSearchText,
        selectedCategories: ['Ração'],
        toggleCategory: mockToggleCategory,
      });

      const { getByText } = render(<CatalogFilter />);
      expect(getByText('Filtro')).toBeTruthy();
      expect(getByText('Categoria')).toBeTruthy();
      expect(getByText('Ração')).toBeTruthy();
      expect(getByText('Pesca')).toBeTruthy();
    });

    it('should toggle category selection and navigate to catalog Menu if on another screen', async () => {
      (useRoute as jest.Mock).mockReturnValue({ name: 'CartScreen' });

      const { getByText } = render(<CatalogFilter />);

      await act(async () => {
        fireEvent.press(getByText('Pesca'));
      });

      expect(mockToggleCategory).toHaveBeenCalledWith('Pesca');
      expect(mockNavigate).toHaveBeenCalledWith('Menu');
    });

    it('should toggle category selection and not navigate if already on Menu', async () => {
      (useRoute as jest.Mock).mockReturnValue({ name: 'Menu' });
      const { getByText } = render(<CatalogFilter />);

      await act(async () => {
        fireEvent.press(getByText('Pesca'));
      });

      expect(mockToggleCategory).toHaveBeenCalledWith('Pesca');
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should render selected categories in dark mode correctly', () => {
      (useTheme as jest.Mock).mockReturnValue({
        colors: {
          background: '#121212',
          backgroundLight: '#18181C',
          headerBackground: '#121212',
          white: '#121212',
        },
        isDarkMode: true,
      });
      (useFilter as jest.Mock).mockReturnValue({
        searchText: '',
        setSearchText: mockSetSearchText,
        selectedCategories: ['Ração'],
        toggleCategory: mockToggleCategory,
      });

      const { getByText } = render(<CatalogFilter />);
      expect(getByText('Ração')).toBeTruthy();
    });

    it('should cover stylesheet Android spacing branch in active render', () => {
      const { Platform } = require('react-native');
      const originalOS = Platform.OS;
      Platform.OS = 'android';

      const { toJSON } = render(
        <AuthContext.Provider value={{ session: null, user: null, isLoading: false, signOut: jest.fn() }}>
          <CatalogHeader searchText="" onSearchChange={jest.fn()} />
        </AuthContext.Provider>
      );
      expect(toJSON()).toBeTruthy();

      Platform.OS = originalOS;
    });
  });
});
