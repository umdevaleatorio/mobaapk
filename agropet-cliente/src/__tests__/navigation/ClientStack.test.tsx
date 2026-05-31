import React from 'react';
import { render } from '@testing-library/react-native';
import ClientStack from '../../presentation/navigation/ClientStack';

// ── Mocks ──
jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }: any) => {
      const React = require('react');
      const { View } = require('react-native');
      return React.createElement('View', { testID: 'client-stack-navigator' }, children);
    },
    Screen: ({ name }: any) => {
      const React = require('react');
      const { Text } = require('react-native');
      return React.createElement('Text', null, name);
    },
  }),
}));

jest.mock('../../presentation/contexts/UserMenuContext', () => ({
  UserMenuProvider: ({ children }: any) => children,
}));

jest.mock('../../presentation/components/GlobalUserMenu', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    GlobalUserMenu: () => React.createElement('View', { testID: 'global-user-menu' }),
  };
});

// Mock all screens inside the stack to prevent parsing or import errors
jest.mock('../../presentation/navigation/ClientTabs', () => () => null);
jest.mock('../../presentation/screens/client/ProductDetail', () => () => null);
jest.mock('../../presentation/screens/client/Payment', () => () => null);
jest.mock('../../presentation/screens/client/PaymentConfirmScreen', () => () => null);
jest.mock('../../presentation/screens/client/Orders', () => () => null);
jest.mock('../../presentation/screens/client/OrderDetail', () => () => null);
jest.mock('../../presentation/screens/client/Tracking', () => () => null);
jest.mock('../../presentation/screens/client/Profile', () => () => null);

describe('ClientStack', () => {
  it('should render ClientStack Navigator and GlobalUserMenu correctly', () => {
    const { getByTestId, getByText } = render(<ClientStack />);
    expect(getByTestId('client-stack-navigator')).toBeTruthy();
    expect(getByTestId('global-user-menu')).toBeTruthy();
    expect(getByText('ClientTabs')).toBeTruthy();
    expect(getByText('ProductDetail')).toBeTruthy();
    expect(getByText('PaymentScreen')).toBeTruthy();
    expect(getByText('ProfileScreen')).toBeTruthy();
  });
});
