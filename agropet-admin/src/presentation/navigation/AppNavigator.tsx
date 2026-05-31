import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthContext } from '../contexts/AuthContext';
import AuthStack from './AuthStack';
import AdminStack from './AdminStack';
import { View, Text } from 'react-native';

import { useTheme } from '../contexts/ThemeContext';

export default function AppNavigator() {
  const { session, isLoading } = useContext(AuthContext);
  const { isDarkMode, colors } = useTheme();

  if (isLoading) {
    return <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text>Aprovando Credenciais...</Text></View>;
  }

  const navigationTheme = {
    dark: isDarkMode,
    colors: {
      primary: colors.primary,
      background: colors.backgroundLight,
      card: colors.headerBackground,
      text: colors.textPrimary,
      border: 'transparent',
      notification: colors.primary,
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      {session && session.user ? (
        <AdminStack />
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}
