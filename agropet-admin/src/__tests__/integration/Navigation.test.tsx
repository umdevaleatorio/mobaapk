import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { AuthContext } from '../../presentation/contexts/AuthContext';
import { ThemeProvider } from '../../presentation/contexts/ThemeContext';
import AppNavigator from '../../presentation/navigation/AppNavigator';
import AdminStack from '../../presentation/navigation/AdminStack';
import AuthStack from '../../presentation/navigation/AuthStack';

// ── Mock all Screens to avoid any runtime side effects ──
jest.mock('../../presentation/screens/admin/ManageProducts', () => () => null);
jest.mock('../../presentation/screens/admin/OrdersScreen', () => () => null);
jest.mock('../../presentation/screens/admin/AdminOrders', () => () => null);
jest.mock('../../presentation/screens/admin/AdminSalesHistory', () => () => null);
jest.mock('../../presentation/screens/admin/AdminOrderDetail', () => () => null);
jest.mock('../../presentation/screens/admin/AdminDashboard', () => () => null);
jest.mock('../../presentation/screens/admin/AdminConsultSales', () => () => null);
jest.mock('../../presentation/screens/admin/AdminHome', () => () => null);
jest.mock('../../presentation/screens/admin/AdminMap', () => () => null);
jest.mock('../../presentation/screens/admin/AdminSettings', () => () => null);
jest.mock('../../presentation/screens/admin/AdminProfile', () => () => null);
jest.mock('../../presentation/screens/admin/ProductCreate', () => () => null);
jest.mock('../../presentation/screens/admin/ProductEdit', () => () => null);
jest.mock('../../presentation/screens/auth/AdminLoginScreen', () => () => null);

// Mock Supabase
jest.mock('../../data/datasources/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    }),
  },
}));

describe('Admin App Navigation Stacks', () => {
  it('should render AuthStack when there is no authenticated user session', () => {
    const authVal = { session: null, user: null, isLoading: false, signOut: async () => {} };

    const { toJSON } = render(
      <AuthContext.Provider value={authVal}>
        <ThemeProvider>
          <NavigationContainer>
            <AuthStack />
          </NavigationContainer>
        </ThemeProvider>
      </AuthContext.Provider>
    );

    expect(toJSON()).toMatchSnapshot();
  });

  it('should render AdminStack structure correctly', () => {
    const authVal = { session: null, user: { id: 'admin-123' } as any, isLoading: false, signOut: async () => {} };

    const { toJSON } = render(
      <AuthContext.Provider value={authVal}>
        <ThemeProvider>
          <NavigationContainer>
            <AdminStack />
          </NavigationContainer>
        </ThemeProvider>
      </AuthContext.Provider>
    );

    expect(toJSON()).toMatchSnapshot();
  });

  it('should render main AppNavigator container based on loading and auth states', () => {
    // 1. Loading State
    const loadingVal = { session: null, user: null, isLoading: true, signOut: async () => {} };
    const { rerender, queryByTestId } = render(
      <AuthContext.Provider value={loadingVal}>
        <ThemeProvider>
          <AppNavigator />
        </ThemeProvider>
      </AuthContext.Provider>
    );

    // 2. Authenticated State
    const authVal = { session: { user: { id: 'admin-123' } } as any, user: { id: 'admin-123' } as any, isLoading: false, signOut: async () => {} };
    rerender(
      <AuthContext.Provider value={authVal}>
        <ThemeProvider>
          <AppNavigator />
        </ThemeProvider>
      </AuthContext.Provider>
    );
  });

  it('should render AuthStack when session is truthy but session.user is falsy', () => {
    const incompleteAuthVal = { session: {} as any, user: null, isLoading: false, signOut: async () => {} };
    const { toJSON } = render(
      <AuthContext.Provider value={incompleteAuthVal}>
        <ThemeProvider>
          <AppNavigator />
        </ThemeProvider>
      </AuthContext.Provider>
    );
    expect(toJSON()).toBeTruthy();
  });
});
