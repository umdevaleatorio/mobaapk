import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { TextInput, TouchableOpacity, Alert } from 'react-native';
import ClientLoginScreen from '../../presentation/screens/auth/ClientLogin';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../../src/data/datasources/supabase/client';

// ── Mocks ──
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));

jest.mock('../../../src/data/datasources/supabase/client', () => {
  const mockSignIn = jest.fn();
  const mockReset = jest.fn();
  const mockVerify = jest.fn();
  const mockUpdate = jest.fn();
  return {
    supabase: {
      auth: {
        signInWithPassword: mockSignIn,
        resetPasswordForEmail: mockReset,
        verifyOtp: mockVerify,
        updateUser: mockUpdate,
      },
    },
    mockSignIn,
    mockReset,
    mockVerify,
    mockUpdate,
  };
});

jest.mock('../mocks/svgMock.js', () => {
  const React = require('react');
  const { View } = require('react-native');
  return (props: any) => React.createElement('View', { testID: 'svg-mock', ...props });
});

const { mockSignIn, mockReset, mockVerify, mockUpdate } = require('../../../src/data/datasources/supabase/client');

describe('ClientLoginScreen', () => {
  let mockNavigate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate = jest.fn();
    (useNavigation as jest.Mock).mockReturnValue({
      navigate: mockNavigate,
    });
    mockSignIn.mockResolvedValue({ error: null });
    mockReset.mockResolvedValue({ error: null });
    mockVerify.mockResolvedValue({ data: { session: {} }, error: null });
    mockUpdate.mockResolvedValue({ error: null });
  });

  it('should trigger login successfully and redirect to Menu', async () => {
    const { getByPlaceholderText, UNSAFE_getAllByType } = render(<ClientLoginScreen />);

    const emailInput = getByPlaceholderText('Digite seu email...');
    const passwordInput = getByPlaceholderText('Digite sua senha...');

    await act(async () => {
      fireEvent.changeText(emailInput, 'client@test.com');
      fireEvent.changeText(passwordInput, 'password123');
    });

    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    // Find Entrar button by checking child svg-mock with width = 75
    const loginButton = touchables.find(t => {
      const child = t.props.children;
      return child && child.props && child.props.width === 75;
    });

    expect(loginButton).toBeTruthy();

    await act(async () => {
      fireEvent.press(loginButton!);
    });

    expect(mockSignIn).toHaveBeenCalledWith({
      email: 'client@test.com',
      password: 'password123',
    });
  });

  it('should display Alert error when login fails', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockSignIn.mockResolvedValue({ error: { message: 'Invalid credentials' } });

    const { getByPlaceholderText, UNSAFE_getAllByType } = render(<ClientLoginScreen />);

    const emailInput = getByPlaceholderText('Digite seu email...');
    const passwordInput = getByPlaceholderText('Digite sua senha...');

    await act(async () => {
      fireEvent.changeText(emailInput, 'client@test.com');
      fireEvent.changeText(passwordInput, 'wrongpassword');
    });

    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    const loginButton = touchables.find(t => {
      const child = t.props.children;
      return child && child.props && child.props.width === 75;
    });

    await act(async () => {
      fireEvent.press(loginButton!);
    });

    expect(alertSpy).toHaveBeenCalledWith('Erro no Login', 'Invalid credentials');
    alertSpy.mockRestore();
  });

  it('should support forgot password modal flows', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByText, getByPlaceholderText, queryByPlaceholderText } = render(<ClientLoginScreen />);

    // Open Forgot Password modal
    const forgotBtn = getByText('Esqueci a senha');
    await act(async () => {
      fireEvent.press(forgotBtn);
    });

    // Modal is opened, fill email and request OTP code
    const modalEmailInput = getByPlaceholderText('Seu e-mail');
    await act(async () => {
      fireEvent.changeText(modalEmailInput, 'forgot@test.com');
    });

    const sendOtpBtn = getByText('Mandar');
    await act(async () => {
      fireEvent.press(sendOtpBtn);
    });

    expect(mockReset).toHaveBeenCalledWith('forgot@test.com');
    expect(alertSpy).toHaveBeenCalledWith('Código Enviado!', expect.any(String));

    // Fill remaining password reset details
    const tokenInput = getByPlaceholderText('Código de 8 dígitos');
    const newPassInput = getByPlaceholderText('Nova senha');
    const confirmPassInput = getByPlaceholderText('Confirmar nova senha');

    await act(async () => {
      fireEvent.changeText(tokenInput, '12345678');
      fireEvent.changeText(newPassInput, 'newpassword123');
      fireEvent.changeText(confirmPassInput, 'newpassword123');
    });

    const confirmBtn = getByText('Confirmar');
    await act(async () => {
      fireEvent.press(confirmBtn);
    });

    expect(mockVerify).toHaveBeenCalledWith({
      email: 'forgot@test.com',
      token: '12345678',
      type: 'recovery',
    });
    expect(mockUpdate).toHaveBeenCalledWith({ password: 'newpassword123' });
    expect(alertSpy).toHaveBeenCalledWith('Sucesso', expect.any(String));

    alertSpy.mockRestore();
  });
});
