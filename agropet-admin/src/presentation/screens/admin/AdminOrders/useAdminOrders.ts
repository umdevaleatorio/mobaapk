import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../../../data/datasources/supabase/client';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../contexts/ThemeContext';

export function useAdminOrders() {
  const navigation = useNavigation<any>();
  const { colors, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('admin_orders_realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          fetchOrders(false);
        }
      )
      .subscribe();

    const unsubscribe = navigation.addListener('focus', () => {
      fetchOrders();
    });

    return () => {
      supabase.removeChannel(channel);
      unsubscribe();
    };
  }, [navigation]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const fetchOrders = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, users(id, name, phone, lat, lng, rua, numero, bairro, cep, location_confirmed), order_items( quantity, unit_price, product_id, products( name ) )')
        .in('status', ['confirmed', 'preparing', 'delivering', 'cancelled'])
        .limit(100)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      setOrders(ordersData || []);
    } catch (error) {
      console.error('Erro ao buscar pedidos no AdminOrdersScreen:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders(false);
    setRefreshing(false);
  };

  const handleTrackOrder = (order: any) => {
    navigation.navigate('AdminTabs', {
      screen: 'Mapa',
      params: {
        clientLocation: {
          latitude: order.users.lat,
          longitude: order.users.lng,
          name: order.users.name || 'Cliente',
          address: `${order.users.rua || ''}, ${order.users.numero || ''} - ${order.users.bairro || ''}`,
          orderId: order.id,
        }
      }
    });
  };

  const getPaymentDisplay = (paymentMethod: string) => {
    switch(paymentMethod) {
      case 'pix':
        return { label: 'PIX', color: '#00BFA5' };
      case 'cartao_credito':
        return { label: 'Crédito', color: '#D32F2F' };
      case 'cartao_debito':
        return { label: 'Débito', color: isDarkMode ? '#4ADE80' : '#4CAF50' };
      case 'dinheiro':
        return { label: 'Dinheiro', color: isDarkMode ? '#43A047' : '#1B5E20' };
      default:
        return { label: paymentMethod, color: colors.textDark };
    }
  };

  const activeOrders = orders.filter(order =>
    order.status !== 'cancelled' &&
    order.users?.lat &&
    order.users?.lng &&
    order.users?.location_confirmed
  );

  const cancelledOrders = orders.filter(order => {
    if (order.status !== 'cancelled') return false;
    const orderDate = new Date(order.updated_at || order.created_at);
    const today = new Date();
    return (
      orderDate.getDate() === today.getDate() &&
      orderDate.getMonth() === today.getMonth() &&
      orderDate.getFullYear() === today.getFullYear()
    );
  });

  return {
    colors, isDarkMode, navigation, loading, refreshing,
    orders, currentTime,
    fetchOrders, onRefresh, handleTrackOrder, getPaymentDisplay,
    activeOrders, cancelledOrders,
  };
}
