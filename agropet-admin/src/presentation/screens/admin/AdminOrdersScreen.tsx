import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import AdminHeader from '../../components/AdminHeader';
import { AdminUserMenu } from '../../components/AdminUserMenu';
import { supabase } from '../../../data/datasources/supabase/client';
import { useNavigation } from '@react-navigation/native';

// Body Labels
import PedidosDeHojeSvg from '../../assets/tela5/Pedidos de hoje_.svg';

// Card
import NumPedidoSvg from '../../assets/tela5/em entrega/pedido 1/Nº do pedido.svg';
import FormaPgtoSvg from '../../assets/tela5/em entrega/pedido 1/Forma de pagamento.svg';
import SituaPgtoSvg from '../../assets/tela5/em entrega/pedido 1/Situação do pagamento.svg';
import VerProdutosSvg from '../../assets/tela5/em entrega/pedido 1/Ver produtos.svg';
import PixSvg from '../../assets/tela5/em entrega/pedido 1/PIX.svg';
import PgtoAprovadoSvg from '../../assets/tela5/em entrega/pedido 1/Pagamento aprovado.svg';
import DinheiroSvg from '../../assets/tela5/em entrega/pedido 4/Dinheiro.svg';

import Separador1 from '../../assets/tela5/em entrega/pedido 1/Separador 1.svg';
import Separador2 from '../../assets/tela5/em entrega/pedido 1/Separador 2.svg';
import Separador3 from '../../assets/tela5/em entrega/pedido 1/Separador 3.svg';

// Barra Inferior Inativa (Marrom)
import HomeIcon8 from '../../assets/tela5/barra de baixo/Home.svg';
import MapIcon8 from '../../assets/tela5/barra de baixo/Map.svg';
import ManageIcon8 from '../../assets/tela5/barra de baixo/Manage.svg';
import GearIcon8 from '../../assets/tela5/barra de baixo/Gear.svg';
import MenuLabel8 from '../../assets/tela5/barra de baixo/Menu.svg';
import MapaLabel8 from '../../assets/tela5/barra de baixo/Mapa.svg';
import GerenciarLabel8 from '../../assets/tela5/barra de baixo/Gerenciar.svg';
import OpcoesLabel8 from '../../assets/tela5/barra de baixo/Opções.svg';

export default function AdminOrdersScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Fetch all orders for admin
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items( product_id, products( name, image_url ) )')
        .order('created_at', { ascending: false });
        
      if (ordersError) throw ordersError;
      setOrders(ordersData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getPaymentDisplay = (paymentMethod: string) => {
    switch(paymentMethod) {
      case 'pix': return <PixSvg width={25} height={12} />;
      case 'cartao_credito': return <Text style={[styles.pgtoText, { color: '#FF0000' }]}>Cartão/Crédito</Text>;
      case 'cartao_debito': return <Text style={[styles.pgtoText, { color: '#2A7420' }]}>Cartão/Débito</Text>;
      case 'dinheiro': return <DinheiroSvg width={50} height={15} />;
      default: return <Text style={styles.pgtoText}>{paymentMethod}</Text>;
    }
  };

  return (
    <View style={styles.mainContainer}>
      
      {/* Header Admin */}
      <AdminHeader title="ver_pedidos" />

      {/* Body */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <View style={styles.sectionHeader}>
          <PedidosDeHojeSvg width={180} height={20} />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#339914" style={{ marginTop: 20 }} />
        ) : orders.length === 0 ? (
          <Text style={styles.emptyText}>Não há pedidos registrados.</Text>
        ) : (
          orders.map((order, index) => {
            return (
              <View key={order.id} style={styles.orderCard}>
                
                {/* Coluna 1: Nº do Pedido */}
                <View style={styles.colContainer}>
                  <NumPedidoSvg width={72} height={12} style={{ marginBottom: 12 }} />
                  <Text style={styles.valText}>{order.id.slice(0, 8).toUpperCase()}</Text>
                </View>

                {/* Separador 1 */}
                <Separador1 height={100} style={{ alignSelf: 'center' }} />

                {/* Coluna 2: Forma de pagamento */}
                <View style={styles.colContainer}>
                  <FormaPgtoSvg width={65} height={22} style={{ marginBottom: 12 }} />
                  {getPaymentDisplay(order.payment_method)}
                </View>

                {/* Separador 2 */}
                <Separador2 height={100} style={{ alignSelf: 'center' }} />

                {/* Coluna 3: Situação do pagamento */}
                <View style={styles.colContainer}>
                  <SituaPgtoSvg width={65} height={22} style={{ marginBottom: 12 }} />
                  {order.status === 'confirmed' || order.status === 'completed' ? (
                    <PgtoAprovadoSvg width={65} height={22} />
                  ) : (
                    <Text style={[styles.valText, { color: '#e69900' }]}>Pendente</Text>
                  )}
                </View>

                {/* Separador 3 */}
                <Separador3 height={100} style={{ alignSelf: 'center' }} />

                {/* Coluna 4: Ver Produtos */}
                <View style={styles.colContainer}>
                  <TouchableOpacity activeOpacity={0.7} style={styles.verProdutosBtn}>
                    <VerProdutosSvg width={61} height={34} />
                  </TouchableOpacity>
                </View>

              </View>
            )
          })
        )}
      </ScrollView>

      {/* ========== BARRA INFERIOR (Tudo Inativo) ========== */}
      <View style={styles.tabBarOuter}>
        <View style={styles.tabBarInner}>
          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('AdminTabs', { screen: 'Home' })}>
            <View style={styles.iconBgInactive}>
              <HomeIcon8 width={32} height={32} />
            </View>
            <MenuLabel8 width={33} height={9} />
          </TouchableOpacity>
          
          <View style={styles.tabSeparator} />

          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('AdminTabs', { screen: 'Mapa' })}>
            <View style={styles.iconBgInactive}>
              <MapIcon8 width={32} height={32} />
            </View>
            <MapaLabel8 width={32} height={12} />
          </TouchableOpacity>
          
          <View style={styles.tabSeparator} />

          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('AdminTabs', { screen: 'Gerenciar' })}>
            <View style={styles.iconBgInactive}>
              <ManageIcon8 width={32} height={32} />
            </View>
            <GerenciarLabel8 width={55} height={10} />
          </TouchableOpacity>

          <View style={styles.tabSeparator} />

          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('AdminTabs', { screen: 'Opções' })}>
            <View style={styles.iconBgInactive}>
              <GearIcon8 width={32} height={32} />
            </View>
            <OpcoesLabel8 width={42} height={12} />
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
    justifyContent: 'center'
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
