import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthContext } from '../contexts/AuthContext';
import AuthStack from './AuthStack';
import AdminStack from './AdminStack';
import { View, Text } from 'react-native';

export default function AppNavigator() {
  const { session, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text>Aprovando Credenciais...</Text></View>;
  }

  return (
    <NavigationContainer>
      {session && session.user ? (
        <AdminStack />
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}
