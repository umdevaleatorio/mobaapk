import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { TextInput, TouchableOpacity, Alert } from 'react-native';
import RegisterScreen from '../../presentation/screens/auth/RegisterScreen';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../../src/data/datasources/supabase/client';

// ── Mocks ──
jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn(),
}));

jest.mock('../../../src/data/datasources/supabase/client', () => {
  const mockSignUp = jest.fn();
  return {
    supabase: {
      auth: {
        signUp: mockSignUp,
      },
    },
    mockSignUp,
  };
});

jest.mock('../mocks/svgMock.js', () => {
  const React = require('react');
  const { View } = require('react-native');
  return (props: any) => React.createElement('View', { testID: 'svg-mock', ...props });
});

const { mockSignUp } = require('../../../src/data/datasources/supabase/client');

describe('RegisterScreen', () => {
  let mockNavigate: jest.Mock;
  let mockReplace: jest.Mock;
  let mockGoBack: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate = jest.fn();
    mockReplace = jest.fn();
    mockGoBack = jest.fn();
    (useNavigation as jest.Mock).mockReturnValue({
      navigate: mockNavigate,
      replace: mockReplace,
      goBack: mockGoBack,
    });
    mockSignUp.mockResolvedValue({ data: { session: null }, error: null });
  });

  it('should trigger signUp successfully and go back to Login', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByPlaceholderText, UNSAFE_getAllByType } = render(<RegisterScreen />);

    const nameInput = getByPlaceholderText('Nome completo ...');
    const emailInput = getByPlaceholderText('Ex: email@gmail.com...');
    const passwordInput = getByPlaceholderText('Digite sua senha...');
    const confirmPasswordInput = getByPlaceholderText('Repita a senha...');

    await act(async () => {
      fireEvent.changeText(nameInput, 'Client Full Name');
      fireEvent.changeText(emailInput, 'client@email.com');
      fireEvent.changeText(passwordInput, 'newpassword123');
      fireEvent.changeText(confirmPasswordInput, 'newpassword123');
    });

    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    const registerButton = touchables.find(t => {
      const child = t.props.children;
      return child && child.props && child.props.width === 131;
    });

    expect(registerButton).toBeTruthy();

    await act(async () => {
      fireEvent.press(registerButton!);
    });

    expect(mockSignUp).toHaveBeenCalledWith({
      email: 'client@email.com',
      password: 'newpassword123',
      options: {
        data: {
          name: 'Client Full Name',
        },
      },
    });

    expect(alertSpy).toHaveBeenCalledWith('Sucesso!', expect.any(String));
    expect(mockGoBack).toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it('should display Alert error when inputs are incomplete', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { UNSAFE_getAllByType } = render(<RegisterScreen />);

    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    const registerButton = touchables.find(t => {
      const child = t.props.children;
      return child && child.props && child.props.width === 131;
    });

    await act(async () => {
      fireEvent.press(registerButton!);
    });

    expect(alertSpy).toHaveBeenCalledWith('Erro', 'Preencha todos os campos.');
    alertSpy.mockRestore();
  });

  it('should display Alert error when passwords mismatch', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByPlaceholderText, UNSAFE_getAllByType } = render(<RegisterScreen />);

    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('Nome completo ...'), 'Name');
      fireEvent.changeText(getByPlaceholderText('Ex: email@gmail.com...'), 'client@email.com');
      fireEvent.changeText(getByPlaceholderText('Digite sua senha...'), 'pass1');
      fireEvent.changeText(getByPlaceholderText('Repita a senha...'), 'pass2');
    });

    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    const registerButton = touchables.find(t => {
      const child = t.props.children;
      return child && child.props && child.props.width === 131;
    });

    await act(async () => {
      fireEvent.press(registerButton!);
    });

    expect(alertSpy).toHaveBeenCalledWith('Erro', 'As senhas não conferem.');
    alertSpy.mockRestore();
  });

  it('should display Alert error when signUp fails on server', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    mockSignUp.mockResolvedValue({ data: {}, error: new Error('User already exists') });

    const { getByPlaceholderText, UNSAFE_getAllByType } = render(<RegisterScreen />);

    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('Nome completo ...'), 'Name');
      fireEvent.changeText(getByPlaceholderText('Ex: email@gmail.com...'), 'client@email.com');
      fireEvent.changeText(getByPlaceholderText('Digite sua senha...'), 'pass123');
      fireEvent.changeText(getByPlaceholderText('Repita a senha...'), 'pass123');
    });

    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    const registerButton = touchables.find(t => {
      const child = t.props.children;
      return child && child.props && child.props.width === 131;
    });

    await act(async () => {
      fireEvent.press(registerButton!);
    });

    expect(alertSpy).toHaveBeenCalledWith('Erro ao cadastrar', 'User already exists');
    alertSpy.mockRestore();
  });

  it('should navigate to login screen when clicking Entre por aqui', async () => {
    const { getByTestId, UNSAFE_getAllByType } = render(<RegisterScreen />);

    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    // Find Entre por aqui touchable by checking width of svg-mock (EntrePorAqui has width 88)
    const loginLink = touchables.find(t => {
      const child = t.props.children;
      return child && child.props && child.props.width === 88;
    });

    expect(loginLink).toBeTruthy();

    await act(async () => {
      fireEvent.press(loginLink!);
    });

    expect(mockReplace).toHaveBeenCalledWith('ClientLoginScreen');
  });

  it('should handle signUp when session is returned immediately', async () => {
    mockSignUp.mockResolvedValue({ data: { session: { id: 'sess-1' } }, error: null });
    const { getByPlaceholderText, UNSAFE_getAllByType } = render(<RegisterScreen />);

    await act(async () => {
      fireEvent.changeText(getByPlaceholderText('Nome completo ...'), 'Name');
      fireEvent.changeText(getByPlaceholderText('Ex: email@gmail.com...'), 'client@email.com');
      fireEvent.changeText(getByPlaceholderText('Digite sua senha...'), 'pass123');
      fireEvent.changeText(getByPlaceholderText('Repita a senha...'), 'pass123');
    });

    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    const registerButton = touchables.find(t => {
      const child = t.props.children;
      return child && child.props && child.props.width === 131;
    });

    await act(async () => {
      fireEvent.press(registerButton!);
    });

    expect(mockSignUp).toHaveBeenCalled();
  });

  it('should cover stylesheet iOS branch', () => {
    const { Platform } = require('react-native');
    const originalOS = Platform.OS;
    Platform.OS = 'ios';

    jest.isolateModules(() => {
      jest.doMock('react', () => React);
      const IsolatedRegisterScreen = require('../../presentation/screens/auth/RegisterScreen').default;
      const { toJSON } = render(<IsolatedRegisterScreen />);
      expect(toJSON()).toBeTruthy();
    });

    Platform.OS = originalOS;
  });

  it('should cover stylesheet Android with null StatusBar height', () => {
    const { StatusBar } = require('react-native');
    const originalHeight = StatusBar.currentHeight;
    StatusBar.currentHeight = null;

    jest.isolateModules(() => {
      jest.doMock('react', () => React);
      const IsolatedRegisterScreen = require('../../presentation/screens/auth/RegisterScreen').default;
      const { toJSON } = render(<IsolatedRegisterScreen />);
      expect(toJSON()).toBeTruthy();
    });

    StatusBar.currentHeight = originalHeight;
  });
});
