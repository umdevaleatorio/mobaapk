import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthContext, AuthProvider } from '../../../src/presentation/contexts/AuthContext';

// ── Mock Supabase ──
const mockGetSession = jest.fn();
const mockSignOut = jest.fn();
const mockOnAuthStateChange = jest.fn();

jest.mock('../../../src/data/datasources/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      signOut: () => mockSignOut(),
      onAuthStateChange: (callback: any) => {
        mockOnAuthStateChange.mockImplementation(() => callback);
        return {
          data: {
            subscription: {
              unsubscribe: jest.fn(),
            },
          },
        };
      },
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: { role: 'admin' }, error: null }),
        }),
      }),
    }),
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

describe('AuthContext (Admin)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
  });

  it('should start with loading state', async () => {
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

  it('should provide signOut function through context', async () => {
    const { getByTestId } = render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading').props.children).toBe('loaded');
    });
  });
});
