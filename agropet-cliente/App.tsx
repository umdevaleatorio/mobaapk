import React from 'react';
import { AuthProvider } from './src/presentation/contexts/AuthContext';
import { CartProvider } from './src/presentation/contexts/CartContext';
import { ThemeProvider } from './src/presentation/contexts/ThemeContext';
import { FilterProvider } from './src/presentation/contexts/FilterContext';
import AppNavigator from './src/presentation/navigation/AppNavigator';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <FilterProvider>
          <CartProvider>
            <AppNavigator />
          </CartProvider>
        </FilterProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
