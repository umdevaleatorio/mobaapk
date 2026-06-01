import React, { useEffect } from 'react';
import { AuthProvider } from './src/presentation/contexts/AuthContext';
import { UserMenuProvider } from './src/presentation/contexts/UserMenuContext';
import { ThemeProvider } from './src/presentation/contexts/ThemeContext';
import { ErrorBoundary } from './src/presentation/components/ErrorBoundary';
import { auditService } from './src/services/auditService';
import AppNavigator from './src/presentation/navigation/AppNavigator';

export default function App() {
  useEffect(() => {
    auditService.log('app.started', { app: 'admin' });
    auditService.healthCheck().then((status) => {
      if (status.status !== 'ok') {
        console.warn('[health] App iniciou com problemas de conexão:', status);
      }
    });
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <UserMenuProvider>
            <AppNavigator />
          </UserMenuProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

