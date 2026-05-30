import React from 'react';
import { render } from '@testing-library/react-native';
import AppNavigator from '../../presentation/navigation/AppNavigator';
import { AuthContext } from '../../presentation/contexts/AuthContext';

// ── Mocks ──
jest.mock('../../presentation/navigation/AuthStack', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement('Text', { testID: 'auth-stack' }, 'AuthStack');
});

jest.mock('../../presentation/navigation/ClientStack', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement('Text', { testID: 'client-stack' }, 'ClientStack');
});

jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: any) => children,
}));

describe('AppNavigator', () => {
  it('should render loading bar if auth state is loading', () => {
    const { getByText, queryByTestId } = render(
      <AuthContext.Provider value={{ session: null, user: null, isLoading: true, signOut: jest.fn() }}>
        <AppNavigator />
      </AuthContext.Provider>
    );

    expect(getByText('Carregando...')).toBeTruthy();
    expect(queryByTestId('auth-stack')).toBeNull();
    expect(queryByTestId('client-stack')).toBeNull();
  });

  it('should render AuthStack if user is not authenticated', () => {
    const { getByTestId, queryByTestId } = render(
      <AuthContext.Provider value={{ session: null, user: null, isLoading: false, signOut: jest.fn() }}>
        <AppNavigator />
      </AuthContext.Provider>
    );

    expect(getByTestId('auth-stack')).toBeTruthy();
    expect(queryByTestId('client-stack')).toBeNull();
  });

  it('should render ClientStack if user has an active session', () => {
    const mockSession = { user: { id: 'user-1' }, access_token: 'tok' } as any;
    const { getByTestId, queryByTestId } = render(
      <AuthContext.Provider value={{ session: mockSession, user: mockSession.user, isLoading: false, signOut: jest.fn() }}>
        <AppNavigator />
      </AuthContext.Provider>
    );

    expect(getByTestId('client-stack')).toBeTruthy();
    expect(queryByTestId('auth-stack')).toBeNull();
  });
});
