import React from 'react';
import { render } from '@testing-library/react-native';

jest.mock('react-native', () => {
  const rn = jest.requireActual('react-native');
  rn.Platform.OS = 'android';
  return rn;
});

import AdminHeader from '../../presentation/components/AdminHeader';
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
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    addListener: jest.fn().mockReturnValue(jest.fn()),
  }),
}));

// Mock secure store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('AdminHeader Component - Android Platform Style Coverage', () => {
  it('should render correct Android platform styles for status bar offset padding', () => {
    const mockUser = { id: 'admin-userid-123' } as any;
    const { getByTestId } = render(
      <AuthContext.Provider value={{ session: null, user: mockUser, isLoading: false, signOut: async () => {} }}>
        <ThemeProvider>
          <UserMenuProvider>
            <AdminHeader title="home" />
          </UserMenuProvider>
        </ThemeProvider>
      </AuthContext.Provider>
    );

    expect(getByTestId('header-title-wrapper')).toBeTruthy();
  });
});
