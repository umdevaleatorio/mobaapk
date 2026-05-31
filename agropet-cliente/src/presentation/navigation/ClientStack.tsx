import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { UserMenuProvider } from '../contexts/UserMenuContext';
import { GlobalUserMenu } from '../components/GlobalUserMenu';
import ClientTabs from './ClientTabs';
import ProductDetailScreen from '../screens/client/ProductDetail';
import PaymentScreen from '../screens/client/Payment';
import PaymentConfirmScreen from '../screens/client/PaymentConfirmScreen';
import { OrdersScreen } from '../screens/client/Orders';
import OrderDetailScreen from '../screens/client/OrderDetail';
import TrackingScreen from '../screens/client/Tracking';
import ProfileScreen from '../screens/client/Profile';

const Stack = createStackNavigator();

export default function ClientStack() {
  return (
    <UserMenuProvider>
      <Stack.Navigator>
        {/* Abas inferiores na raiz */}
        <Stack.Screen name="ClientTabs" component={ClientTabs} options={{ headerShown: false }} />
        {/* Visualizar Produto (Tela 5) */}
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ headerShown: false }} />
        {/* Telas complementares de fluxo (Checkout) */}
        <Stack.Screen name="PaymentScreen" component={PaymentScreen} options={{ headerShown: false }} />
        <Stack.Screen name="PaymentConfirmScreen" component={PaymentConfirmScreen} options={{ headerShown: false }} />
        {/* Tela de Histórico/Situação de Pedidos (Tela 11) */}
        <Stack.Screen name="OrdersScreen" component={OrdersScreen} options={{ headerShown: false }} />
        {/* Tela de Detalhes do Pedido */}
        <Stack.Screen name="OrderDetailScreen" component={OrderDetailScreen} options={{ headerShown: false }} />
        {/* Tela de Acompanhamento (Tela 12) */}
        <Stack.Screen name="TrackingScreen" component={TrackingScreen} options={{ headerShown: false }} />
        {/* Nova Tela de Perfil (Tela 13) */}
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
      <GlobalUserMenu />
    </UserMenuProvider>
  );
}
