import React from 'react';
import { AuthProvider } from './src/presentation/contexts/AuthContext';
import { CartProvider } from './src/presentation/contexts/CartContext';
import AppNavigator from './src/presentation/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppNavigator />
      </CartProvider>
    </AuthProvider>
  );
}
