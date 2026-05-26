import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AdminTabs from './AdminTabs';
import ManageProductsScreen from '../screens/admin/ManageProductsScreen';
import ProductCreateScreen from '../screens/admin/ProductCreateScreen';
import OrdersScreen from '../screens/admin/OrdersScreen';
import AdminOrdersScreen from '../screens/admin/AdminOrdersScreen';
import AdminSalesHistoryScreen from '../screens/admin/AdminSalesHistoryScreen';
import AdminOrderDetailScreen from '../screens/admin/AdminOrderDetailScreen';
import AdminDashboardScreen from '../screens/admin/AdminDashboardScreen';
import AdminConsultSalesScreen from '../screens/admin/AdminConsultSalesScreen';

const Stack = createStackNavigator();

export default function AdminStack() {
  return (
    <Stack.Navigator initialRouteName="AdminTabs">
      <Stack.Screen name="AdminTabs" component={AdminTabs} options={{ headerShown: false }} />
      <Stack.Screen name="ManageProductsScreen" component={ManageProductsScreen} options={{ title: 'Gerenciar Produtos' }} />
      <Stack.Screen name="OrdersScreen" component={OrdersScreen} options={{ title: 'Pedidos dos Clientes' }} />
      <Stack.Screen name="AdminOrdersScreen" component={AdminOrdersScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminSalesHistoryScreen" component={AdminSalesHistoryScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminOrderDetailScreen" component={AdminOrderDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminDashboardScreen" component={AdminDashboardScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AdminConsultSalesScreen" component={AdminConsultSalesScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}
