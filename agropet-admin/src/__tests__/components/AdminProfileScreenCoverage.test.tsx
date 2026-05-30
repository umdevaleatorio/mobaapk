import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import AdminProfileScreen from '../../presentation/screens/admin/AdminProfileScreen';
import { AuthContext } from '../../presentation/contexts/AuthContext';
import { ThemeProvider } from '../../presentation/contexts/ThemeContext';
import { UserMenuProvider } from '../../presentation/contexts/UserMenuContext';
import { supabase } from '../../data/datasources/supabase/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

jest.mock('../../data/datasources/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
    auth: { refreshSession: jest.fn().mockResolvedValue({}) },
  },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    addListener: jest.fn(),
  }),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

const mockUser = {
  id: 'user-123',
  email: 'admin@test.com',
};

const renderScreen = () => {
  const customAuthVal = { session: null, user: mockUser as any, isLoading: false, signOut: jest.fn() };
  return render(
    <AuthContext.Provider value={customAuthVal}>
      <ThemeProvider>
        <UserMenuProvider>
          <AdminProfileScreen />
        </UserMenuProvider>
      </ThemeProvider>
    </AuthContext.Provider>
  );
};

const createMockChain = (resolvedValue: any = { data: [] }) => {
  return {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue(resolvedValue),
    then: jest.fn((cb) => cb(resolvedValue)),
  };
};

describe('AdminProfileScreen - Deep Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it('covers photo uri, profile fetch error, lat lng delay, nominatim error, username rpc fallback and catch', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('file://mock/photo.jpg');

    (supabase.from as jest.Mock).mockImplementation((table) => {
      if (table === 'users') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockRejectedValue(new Error('Profile fetch error (201)')),
          update: jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({}) }),
          then: jest.fn(),
        };
      }
      return { select: jest.fn().mockReturnThis() };
    });

    (supabase.rpc as jest.Mock).mockRejectedValueOnce(new Error('RPC Error'));
    
    global.fetch = jest.fn().mockRejectedValueOnce(new Error('Nominatim error (266)'));

    const { getByPlaceholderText, getByText, UNSAFE_getAllByType, UNSAFE_getAllByProps } = renderScreen();

    // Trigger photo URI and fetch error
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    // Trigger username debounce RPC error and catch
    fireEvent.press(getByText('Definir nome de usuário...'));
    const userInp = getByPlaceholderText('Ex: usuario123');
    fireEvent.changeText(userInp, 'newadmin');
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    
    // Trigger username catch error
    (supabase.rpc as jest.Mock).mockImplementationOnce(() => { throw new Error('Sync error (513)'); });
    fireEvent.changeText(userInp, 'newadmin2');
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    // Address Search (Nominatim)
    const cepInp = getByPlaceholderText('00000-000');
    fireEvent.changeText(cepInp, '37480000');
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    
    // Fallback nominatim json error
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: true, json: () => { throw new Error('JSON error (266)'); }});
    fireEvent.changeText(cepInp, '37480001');
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
  });
});
