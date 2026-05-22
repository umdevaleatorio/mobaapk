import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import AdminHeader from '../../components/AdminHeader';
import { AdminUserMenu } from '../../components/AdminUserMenu';
import { supabase } from '../../../data/datasources/supabase/client';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';

// SVGs for Tab Bar only (cleaned card/text SVGs)

// Barra Inferior Inativa (Marrom)
import HomeIcon8 from '../../assets/tela5/barra de baixo/Home.svg';
import MapIcon8 from '../../assets/tela5/barra de baixo/Map.svg';
import ManageIcon8 from '../../assets/tela5/barra de baixo/Manage.svg';
import GearIcon8 from '../../assets/tela5/barra de baixo/Gear.svg';
import MenuLabel8 from '../../assets/tela5/barra de baixo/Menu.svg';
import MapaLabel8 from '../../assets/tela5/barra de baixo/Mapa.svg';
import GerenciarLabel8 from '../../assets/tela5/barra de baixo/Gerenciar.svg';
import OpcoesLabel8 from '../../assets/tela5/barra de baixo/Opções.svg';
import RastrearSvg from '../../assets/tela5/Rastrear.svg';

export default function AdminOrdersScreen() {
  const navigation = useNavigation<any>();
  const { colors, isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    fetchOrders();

    const unsubscribe = navigation.addListener('focus', () => {
      fetchOrders();
    });
    return unsubscribe;
  }, [navigation]);

  // Timer local para atualizar o tempo atual a cada 10 segundos, forçando a limpeza automática de pedidos expirados
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Fetch all orders for admin (excluding completed orders)
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, users(id, name, phone, lat, lng, rua, numero, bairro, cep), order_items( quantity, unit_price, product_id, products( name, image_url ) )')
        .neq('status', 'completed')
        .order('created_at', { ascending: false });
        
      if (ordersError) throw ordersError;
      setOrders(ordersData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackOrder = (order: any) => {
    if (!order.users?.lat || !order.users?.lng) {
      Alert.alert('Aviso', 'Este cliente não possui localização geográfica cadastrada no perfil.');
      return;
    }

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
        return <Text style={[styles.valText, { color: '#00BFA5', fontWeight: 'bold' }]}>PIX</Text>;
      case 'cartao_credito': 
        return <Text style={[styles.valText, { color: '#D32F2F', fontWeight: 'bold' }]}>Crédito</Text>;
      case 'cartao_debito': 
        return <Text style={[styles.valText, { color: isDarkMode ? '#4ADE80' : '#4CAF50', fontWeight: 'bold' }]}>Débito</Text>;
      case 'dinheiro': 
        return <Text style={[styles.valText, { color: isDarkMode ? '#43A047' : '#1B5E20', fontWeight: 'bold' }]}>Dinheiro</Text>;
      default: 
        return <Text style={[styles.valText, { color: colors.textDark, fontWeight: 'bold' }]}>{paymentMethod}</Text>;
    }
  };

  const activeOrders = orders.filter(order => order.status !== 'cancelled');
  const cancelledOrders = orders.filter(order => {
    if (order.status !== 'cancelled') return false;
    const cancellationTime = new Date(order.updated_at || order.created_at).getTime();
    const elapsed = currentTime - cancellationTime;
    return elapsed < 5 * 60 * 1000; // 5 minutos em milissegundos
  });

  const renderOrderCard = (order: any, isCancelled: boolean) => {
    const cardBgColor = isDarkMode ? '#2E2E38' : '#E3E4EB';
    const separatorColor = isDarkMode ? '#18181C' : '#F5F5F5';
    const labelColor = isDarkMode ? '#4A90E2' : '#2B6CB0';

    return (
      <View key={order.id} style={[styles.orderCard, { backgroundColor: cardBgColor }, isCancelled && { opacity: 0.6 }]}>
        
        {/* Coluna 1: Nº do Pedido */}
        <View style={styles.colContainer}>
          <Text style={[styles.columnLabel, { color: labelColor }]}>Nº do pedido</Text>
          <Text style={[styles.valText, { color: colors.textDark, fontWeight: 'bold' }]}>{order.id.slice(0, 8).toUpperCase()}</Text>
        </View>

        {/* Separador 1 */}
        <View style={{ width: 1, height: '100%', backgroundColor: separatorColor }} />

        {/* Coluna 2: Forma de pagamento */}
        <View style={styles.colContainer}>
          <Text style={[styles.columnLabel, { color: labelColor }]}>Forma de{"\n"}pagamento</Text>
          {getPaymentDisplay(order.payment_method)}
        </View>

        {/* Separador 2 */}
        <View style={{ width: 1, height: '100%', backgroundColor: separatorColor }} />

        {/* Coluna 3: Situação do pagamento */}
        <View style={styles.colContainer}>
          <Text style={[styles.columnLabel, { color: labelColor }]}>Situação do{"\n"}pagamento</Text>
          {order.status === 'cancelled' ? (
            <Text style={[styles.valText, { color: '#FF6B6B', fontWeight: 'bold' }]}>Cancelado</Text>
          ) : order.status === 'confirmed' || order.status === 'completed' ? (
            <Text style={[styles.valText, { color: isDarkMode ? '#4ADE80' : '#339914', fontWeight: 'bold' }]}>Aprovado</Text>
          ) : (
            <Text style={[styles.valText, { color: '#e69900', fontWeight: 'bold' }]}>Pendente</Text>
          )}
        </View>

        {/* Separador 3 */}
        <View style={{ width: 1, height: '100%', backgroundColor: separatorColor }} />

        {/* Coluna 4: Rastrear e Ver Produtos */}
        <View style={[styles.colContainer, { gap: 6 }]}>
          <TouchableOpacity 
            activeOpacity={0.7} 
            style={[isCancelled && { opacity: 0.3 }]}
            onPress={() => !isCancelled && handleTrackOrder(order)}
            disabled={isCancelled}
          >
            <RastrearSvg width={57} height={14} />
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.7} 
            style={styles.verProdutosBtn}
            onPress={() => navigation.navigate('AdminOrderDetailScreen', { order })}
          >
            <Text style={{ color: isDarkMode ? '#FFE082' : '#042A7D', fontSize: 11, fontWeight: 'bold', textAlign: 'center' }}>Ver produtos</Text>
          </TouchableOpacity>
        </View>

      </View>
    );
  };

  const iconColorInactive = isDarkMode ? '#FFFFFF' : undefined;

  return (
    <View style={[styles.mainContainer, { backgroundColor: isDarkMode ? '#18181C' : '#F5F5F5' }]}>
      
      {/* Header Admin */}
      <AdminHeader title="ver_pedidos" />

      {/* Body */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.sectionHeader}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: isDarkMode ? '#FFFFFF' : '#1C2434', marginLeft: 4 }}>Pedidos de hoje:</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#339914" style={{ marginTop: 20 }} />
        ) : activeOrders.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textDark }]}>Não há pedidos ativos registrados.</Text>
        ) : (
          activeOrders.map(order => renderOrderCard(order, false))
        )}

        {/* Sub-sessão de Pedidos Cancelados */}
        {!loading && (
          <View style={{ marginTop: 25 }}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.cancelledSectionTitle, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>Pedidos cancelados:</Text>
            </View>
            {cancelledOrders.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textDark }]}>Não há pedidos cancelados, Uhuu 🥳</Text>
            ) : (
              cancelledOrders.map(order => renderOrderCard(order, true))
            )}
          </View>
        )}
      </ScrollView>

      {/* ========== BARRA INFERIOR (Tudo Inativo) ========== */}
      <View style={styles.tabBarOuter}>
        <View style={[styles.tabBarInner, { backgroundColor: isDarkMode ? '#000000' : '#E3E4EB' }]}>
          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('AdminTabs', { screen: 'Home' })}>
            <View style={styles.iconBgInactive}>
              <HomeIcon8 width={32} height={32} fill={iconColorInactive} stroke={iconColorInactive} />
            </View>
            <MenuLabel8 width={33} height={9} fill={iconColorInactive} stroke={iconColorInactive} />
          </TouchableOpacity>
          
          <View style={[styles.tabSeparator, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#8A7268' }]} />

          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('AdminTabs', { screen: 'Mapa' })}>
            <View style={styles.iconBgInactive}>
              <MapIcon8 width={32} height={32} fill={iconColorInactive} stroke={iconColorInactive} />
            </View>
            <MapaLabel8 width={32} height={12} fill={iconColorInactive} stroke={iconColorInactive} />
          </TouchableOpacity>
          
          <View style={[styles.tabSeparator, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#8A7268' }]} />

          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('AdminTabs', { screen: 'Gerenciar' })}>
            <View style={styles.iconBgInactive}>
              <ManageIcon8 width={32} height={32} fill={iconColorInactive} stroke={iconColorInactive} />
            </View>
            <GerenciarLabel8 width={55} height={10} fill={iconColorInactive} stroke={iconColorInactive} />
          </TouchableOpacity>

          <View style={[styles.tabSeparator, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#8A7268' }]} />

          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('AdminTabs', { screen: 'Opções' })}>
            <View style={styles.iconBgInactive}>
              <GearIcon8 width={32} height={32} fill={iconColorInactive} stroke={iconColorInactive} />
            </View>
            <OpcoesLabel8 width={42} height={12} fill={iconColorInactive} stroke={iconColorInactive} />
          </TouchableOpacity>
        </View>
      </View>

      <AdminUserMenu />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  
  // ========== BODY ==========
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: 120, // espaço para barra inferior
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 20,
    marginLeft: 4,
  },
  emptyText: {
    fontSize: 14,
    color: '#000000',
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center'
  },
  cancelledSectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C2434',
    marginLeft: 4,
    marginBottom: 8,
  },
  columnLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },

  // ========== CARD ==========
  orderCard: {
    flexDirection: 'row',
    backgroundColor: '#E3E4EB',
    borderRadius: 15,
    marginBottom: 15,
    height: 100, // Fixed height similar to design
    alignItems: 'center',
  },
  colContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  valText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1C2434',
    textAlign: 'center',
  },
  pgtoText: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  verProdutosBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },


  // ========== BARRA INFERIOR ==========
  tabBarOuter: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 24,
    left: 16,
    right: 16,
  },
  tabBarInner: {
    flexDirection: 'row',
    backgroundColor: '#E3E4EB',
    borderRadius: 30,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabSeparator: {
    width: 1,
    height: 49,
    backgroundColor: '#8A7268', // Same as Client map inactive
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconBgInactive: {
    width: 51,
    height: 41,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
