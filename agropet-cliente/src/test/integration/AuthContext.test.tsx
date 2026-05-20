import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthContext, AuthProvider } from '../../../src/presentation/contexts/AuthContext';

// ── Mock Supabase ──
const mockGetSession = jest.fn();
const mockSignOut = jest.fn();

jest.mock('../../../src/data/datasources/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      signOut: () => mockSignOut(),
      onAuthStateChange: () => ({
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      }),
    },
  },
}));

// Componente auxiliar para consumir o contexto nos testes
function AuthConsumer() {
  const { session, user, isLoading } = React.useContext(AuthContext);
  return (
    <>
      <Text testID="loading">{isLoading ? 'loading' : 'loaded'}</Text>
      <Text testID="session">{session ? 'has-session' : 'no-session'}</Text>
      <Text testID="user">{user ? 'has-user' : 'no-user'}</Text>
    </>
  );
}

describe('AuthContext (Cliente)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
  });

  it('should start with loading state and resolve to loaded', async () => {
    const { getByTestId } = render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading').props.children).toBe('loaded');
    });
  });

  it('should set no session when getSession returns null', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const { getByTestId } = render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId('session').props.children).toBe('no-session');
      expect(getByTestId('user').props.children).toBe('no-user');
    });
  });

  it('should set session when getSession returns valid session', async () => {
    const mockSession = {
      user: { id: 'user-1', email: 'test@test.com' },
      access_token: 'token',
    };
    mockGetSession.mockResolvedValue({ data: { session: mockSession } });

    const { getByTestId } = render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId('session').props.children).toBe('has-session');
      expect(getByTestId('user').props.children).toBe('has-user');
    });
  });
});
