import React from 'react';
import { render } from '@testing-library/react-native';
import AuthStack from '../../presentation/navigation/AuthStack';

// ── Mocks ──
jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }: any) => {
      const React = require('react');
      const { View } = require('react-native');
      return React.createElement('View', { testID: 'stack-navigator' }, children);
    },
    Screen: ({ name }: any) => {
      const React = require('react');
      const { Text } = require('react-native');
      return React.createElement('Text', null, name);
    },
  }),
}));

jest.mock('../../presentation/screens/SplashScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement('Text', null, 'SplashScreen');
});
jest.mock('../../presentation/screens/auth/ClientLogin', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement('Text', null, 'ClientLoginScreen');
});
jest.mock('../../presentation/screens/auth/Register', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement('Text', null, 'RegisterScreen');
});

describe('AuthStack', () => {
  it('should render Stack Navigator without crash', () => {
    const { getByTestId, getByText } = render(<AuthStack />);
    expect(getByTestId('stack-navigator')).toBeTruthy();
    expect(getByText('SplashScreen')).toBeTruthy();
    expect(getByText('ClientLoginScreen')).toBeTruthy();
    expect(getByText('RegisterScreen')).toBeTruthy();
  });
});
