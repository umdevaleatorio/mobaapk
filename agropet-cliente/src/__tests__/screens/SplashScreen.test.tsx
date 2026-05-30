import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { TouchableOpacity } from 'react-native';
import SplashScreen from '../../presentation/screens/SplashScreen';
import { useNavigation } from '@react-navigation/native';

// ── Mocks ──
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));

jest.mock('../mocks/svgMock.js', () => {
  const React = require('react');
  const { View } = require('react-native');
  return (props: any) => React.createElement('View', { testID: 'svg-mock', ...props });
});

describe('SplashScreen', () => {
  let mockNavigate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate = jest.fn();
    (useNavigation as jest.Mock).mockReturnValue({
      navigate: mockNavigate,
    });
  });

  it('should render all splash elements and trigger navigation buttons correctly', async () => {
    const { UNSAFE_getAllByType } = render(<SplashScreen />);

    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    // Touchables layout order:
    // 0: Comece Aqui (header right)
    // 1: Cadastro Button (card)
    // 2: Login Button (card)
    // 3, 4, 5: Footer links (Suporte, Privacidade, Termos)
    expect(touchables.length).toBe(6);

    // Click Comece Aqui (should navigate to RegisterScreen)
    await act(async () => {
      fireEvent.press(touchables[0]);
    });
    expect(mockNavigate).toHaveBeenCalledWith('RegisterScreen');

    // Click Cadastro (should navigate to RegisterScreen)
    await act(async () => {
      fireEvent.press(touchables[1]);
    });
    expect(mockNavigate).toHaveBeenCalledWith('RegisterScreen');

    // Click Login (should navigate to ClientLoginScreen)
    await act(async () => {
      fireEvent.press(touchables[2]);
    });
    expect(mockNavigate).toHaveBeenCalledWith('ClientLoginScreen');
  });
});
