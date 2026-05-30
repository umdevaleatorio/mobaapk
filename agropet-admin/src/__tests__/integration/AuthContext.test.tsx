import React from 'react';
import { render, act, waitFor, fireEvent } from '@testing-library/react-native';
import { Text, Button } from 'react-native';
import { AuthContext, AuthProvider } from '../../presentation/contexts/AuthContext';
import { supabase } from '../../data/datasources/supabase/client';

// ── Mock Supabase ──
const mockGetSession = jest.fn();
const mockSignOut = jest.fn();
const mockOnAuthStateChange = jest.fn();
const mockSingle = jest.fn();

jest.mock('../../data/datasources/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      signOut: (...args: any[]) => mockSignOut(...args),
      onAuthStateChange: (callback: any) => mockOnAuthStateChange(callback),
    },
    from: jest.fn().mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          single: () => mockSingle(),
        }),
      }),
    })),
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
      <Button title="Sign Out" onPress={signOut} testID="signout-btn" />
    </>
  );
}

describe('AuthContext (Admin)', () => {
  let authChangeCallback: any = null;
  const mockUnsubscribe = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockSingle.mockResolvedValue({ data: { role: 'admin' }, error: null });
    
    mockOnAuthStateChange.mockImplementation((callback: any) => {
      authChangeCallback = callback;
      return {
        data: {
          subscription: {
            unsubscribe: mockUnsubscribe,
          },
        },
      };
    });
  });

  it('should start with loading state and set no session when session is null', async () => {
    const { getByTestId } = render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    expect(getByTestId('loading').props.children).toBe('loading');

    await waitFor(() => {
      expect(getByTestId('loading').props.children).toBe('loaded');
      expect(getByTestId('session').props.children).toBe('no-session');
    });
  });

  it('should set session and user when role is admin', async () => {
    const mockSession = { user: { id: 'admin-123' } };
    mockGetSession.mockResolvedValue({ data: { session: mockSession } });

    const { getByTestId } = render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading').props.children).toBe('loaded');
      expect(getByTestId('session').props.children).toBe('has-session');
      expect(getByTestId('user').props.children).toBe('has-user');
    });
  });

  it('should sign out and alert when role is client (non-admin)', async () => {
    const mockSession = { user: { id: 'client-123' } };
    mockGetSession.mockResolvedValue({ data: { session: mockSession } });
    mockSingle.mockResolvedValue({ data: { role: 'client' }, error: { message: 'DB Error' } });

    const { getByTestId } = render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
      expect(global.alert).toHaveBeenCalled();
      expect(getByTestId('session').props.children).toBe('no-session');
      expect(getByTestId('loading').props.children).toBe('loaded');
    });
  });

  it('should listen to auth state changes for SIGNED_IN', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(authChangeCallback).toBeInstanceOf(Function);
    });

    // Simula login de admin via evento
    const mockSession = { user: { id: 'admin-456' } };
    mockSingle.mockResolvedValue({ data: { role: 'admin' }, error: null });

    await act(async () => {
      await authChangeCallback('SIGNED_IN', mockSession);
    });
  });

  it('should listen to auth state changes for SIGNED_OUT', async () => {
    const { getByTestId } = render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(authChangeCallback).toBeInstanceOf(Function);
    });

    await act(async () => {
      await authChangeCallback('SIGNED_OUT', null);
      await authChangeCallback('TOKEN_REFRESHED', null);
    });

    expect(getByTestId('session').props.children).toBe('no-session');
  });

  it('should call unsubscribe when unmounted', async () => {
    const { unmount } = render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should sign out when signOut is called', async () => {
    const { getByTestId } = render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId('loading').props.children).toBe('loaded');
    });

    const signoutBtn = getByTestId('signout-btn');
    await act(async () => {
      fireEvent.press(signoutBtn);
    });

    expect(mockSignOut).toHaveBeenCalled();
  });

  it('should cover context default signOut function', async () => {
    const { getByTestId } = render(<AuthConsumer />);
    const signoutBtn = getByTestId('signout-btn');
    await act(async () => {
      fireEvent.press(signoutBtn);
    });
    // This will call the default context signOut implementation
  });
});
