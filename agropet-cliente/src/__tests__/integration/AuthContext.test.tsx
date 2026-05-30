import React from 'react';
import { render, waitFor, act, fireEvent } from '@testing-library/react-native';
import { Text, Button } from 'react-native';
import { AuthContext, AuthProvider } from '../../../src/presentation/contexts/AuthContext';

// ── Mock Supabase ──
const mockGetSession = jest.fn();
const mockSignOut = jest.fn();
const mockUnsubscribe = jest.fn();

let authStateChangeCallback: any = null;

jest.mock('../../../src/data/datasources/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      signOut: () => mockSignOut(),
      onAuthStateChange: (cb: any) => {
        authStateChangeCallback = cb;
        return {
          data: {
            subscription: {
              unsubscribe: mockUnsubscribe,
            },
          },
        };
      },
    },
  },
}));

// Componente auxiliar para consumir o contexto nos testes
function AuthConsumer() {
  const { session, user, isLoading, signOut } = React.useContext(AuthContext);
  return (
    <>
      <Text testID="loading">{isLoading ? 'loading' : 'loaded'}</Text>
      <Text testID="session">{session ? 'has-session' : 'no-session'}</Text>
      <Text testID="user">{user ? 'has-user' : 'no-user'}</Text>
      <Button title="Sign Out" onPress={signOut} />
    </>
  );
}

describe('AuthContext (Cliente)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    authStateChangeCallback = null;
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

  it('should update session and user state on auth state changes', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const { getByTestId } = render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId('session').props.children).toBe('no-session');
    });

    expect(authStateChangeCallback).toBeInstanceOf(Function);

    // Simulate LOGIN change event
    const activeSession = {
      user: { id: 'user-logged-in', email: 'logged@test.com' },
      access_token: 'active-token',
    };

    await act(async () => {
      authStateChangeCallback('SIGNED_IN', activeSession);
    });

    expect(getByTestId('session').props.children).toBe('has-session');
    expect(getByTestId('user').props.children).toBe('has-user');

    // Simulate LOGOUT change event
    await act(async () => {
      authStateChangeCallback('SIGNED_OUT', null);
    });

    expect(getByTestId('session').props.children).toBe('no-session');
    expect(getByTestId('user').props.children).toBe('no-user');
  });

  it('should call supabase.auth.signOut on signOut', async () => {
    const { getByText } = render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.press(getByText('Sign Out'));
    });

    expect(mockSignOut).toHaveBeenCalled();
  });

  it('should unsubscribe from auth change listener on unmount', () => {
    const { unmount } = render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should cover default createContext values', async () => {
    let defaultContextVal: any;
    function DummyConsumer() {
      defaultContextVal = React.useContext(AuthContext);
      return null;
    }
    render(<DummyConsumer />);
    await defaultContextVal.signOut();
  });
});
