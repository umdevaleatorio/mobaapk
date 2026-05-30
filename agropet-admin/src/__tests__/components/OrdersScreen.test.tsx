import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { AuthContext } from '../../presentation/contexts/AuthContext';
import { ThemeProvider } from '../../presentation/contexts/ThemeContext';
import { UserMenuProvider } from '../../presentation/contexts/UserMenuContext';
import { supabase } from '../../data/datasources/supabase/client';
import OrdersScreen from '../../presentation/screens/admin/OrdersScreen';

// Mock Supabase with standard thenable chain
jest.mock('../../data/datasources/supabase/client', () => {
  const mockOrders = [
    {
      id: 'o-1',
      status: 'pending',
      total: 50.00,
      payment_method: 'pix',
      created_at: '2026-05-27T10:00:00.000Z',
      users: { name: 'Cliente A', email: 'cliente@test.com' },
      order_items: [
        { quantity: 2, unit_price: 25.00, products: { name: 'Ração A' } }
      ]
    }
  ];
  const chain = {
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    then: (resolve: any) => {
      if (typeof resolve === 'function') {
        resolve({ data: mockOrders, error: null });
      }
      return Promise.resolve({ data: mockOrders, error: null });
    }
  };
  return {
    supabase: {
      from: jest.fn().mockReturnValue(chain)
    }
  };
});

// Mock Navigation
const mockAddListener = jest.fn().mockReturnValue(jest.fn());
const mockNavigation = {
  addListener: mockAddListener
};

describe('OrdersScreen - Deep Coverage', () => {
  const mockUser = { id: 'admin-userid-123' };
  const authVal = { session: null, user: mockUser as any, isLoading: false, signOut: jest.fn() };

  it('should render orders in Light Mode and cover light theme styling branches', async () => {
    // Force Light Mode
    const themeContextModule = require('../../presentation/contexts/ThemeContext');
    const useThemeSpy = jest.spyOn(themeContextModule, 'useTheme').mockReturnValue({
      isDarkMode: false,
      colors: themeContextModule.lightColors,
      toggleTheme: jest.fn(),
    });

    const { getByText } = render(
      <AuthContext.Provider value={authVal}>
        <ThemeProvider>
          <UserMenuProvider>
            <OrdersScreen navigation={mockNavigation} />
          </UserMenuProvider>
        </ThemeProvider>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(getByText('Cliente A')).toBeTruthy();
      expect(getByText('cliente@test.com')).toBeTruthy();
      expect(getByText('PAGTO: PIX')).toBeTruthy();
    });

    useThemeSpy.mockRestore();
  });
});
