import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthContext } from '../contexts/AuthContext';
import AuthStack from './AuthStack';
import ClientStack from './ClientStack';
import { View, Text } from 'react-native';

export default function AppNavigator() {
  const { session, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text>Carregando...</Text></View>;
  }

  return (
    <NavigationContainer>
      {session && session.user ? (
        <ClientStack />
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
}
