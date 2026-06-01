import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { AuthProvider } from './src/presentation/contexts/AuthContext';
import { CartProvider } from './src/presentation/contexts/CartContext';
import { ThemeProvider } from './src/presentation/contexts/ThemeContext';
import { FilterProvider } from './src/presentation/contexts/FilterContext';
import { ConnectivityProvider } from './src/presentation/contexts/ConnectivityContext';
import { ErrorBoundary } from './src/presentation/components/ErrorBoundary';
import { auditService } from './src/services/auditService';
import { NotificationService } from './src/services/notificationService';
import AppNavigator from './src/presentation/navigation/AppNavigator';

export default function App() {
  useEffect(() => {
    auditService.log('app.started', { app: 'cliente' });
    auditService.healthCheck().then((status) => {
      if (status.status !== 'ok') {
        console.warn('[health] App iniciou com problemas de conexão:', status);
      }
    });
  }, []);

  useEffect(() => {
    const receivedListener = NotificationService.addNotificationReceivedListener(notification => {
      const { title, body } = notification.request.content;
      if (title) {
        Alert.alert(title, body);
      }
    });

    return () => {
      receivedListener.remove();
    };
  }, []);

  return (
    <ErrorBoundary>
      <ConnectivityProvider>
        <ThemeProvider>
          <AuthProvider>
            <FilterProvider>
              <CartProvider>
                <AppNavigator />
              </CartProvider>
            </FilterProvider>
          </AuthProvider>
        </ThemeProvider>
      </ConnectivityProvider>
    </ErrorBoundary>
  );
}
