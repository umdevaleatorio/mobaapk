import React from 'react';
import { AuthProvider } from './src/presentation/contexts/AuthContext';
import { UserMenuProvider } from './src/presentation/contexts/UserMenuContext';
import AppNavigator from './src/presentation/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <UserMenuProvider>
        <AppNavigator />
      </UserMenuProvider>
    </AuthProvider>
  );
}
