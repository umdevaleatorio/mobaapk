import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Image, Platform } from 'react-native';
import AdminHeader from '../../components/AdminHeader';
import { AdminUserMenu } from '../../components/AdminUserMenu';
import { supabase } from '../../../data/datasources/supabase/client';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

// Top SVGs
import HojeLabelSvg from '../../assets/tela6/resumos/Hoje_.svg';
import FundoBtnFiltro from '../../assets/tela6/selecionar data/Fundo.svg';
import SelecionarDataTexto from '../../assets/tela6/selecionar data/Selecionar data.svg';
import SetaBaixo from '../../assets/tela6/selecionar data/Upside Down.svg';

// Card Labels & Separators
import ValorVendaSvg from '../../assets/tela6/resumos/resumo hoje/resumo 1/Valor da venda.svg';
import FormaPgtoSvg from '../../assets/tela6/resumos/resumo hoje/resumo 1/Forma de pagamento.svg';
import VerResumoSvg from '../../assets/tela6/resumos/resumo hoje/resumo 1/Ver resumo.svg';
import Separador1 from '../../assets/tela6/resumos/resumo hoje/resumo 1/Separador 1.svg';
import Separador2 from '../../assets/tela6/resumos/resumo hoje/resumo 1/Separador 2.svg';
import Separador3 from '../../assets/tela6/resumos/resumo hoje/resumo 1/Separador 3.svg';

// Payment methods SVGs
import PixSvg from '../../assets/tela5/em entrega/pedido 1/PIX.svg';
import DinheiroSvg from '../../assets/tela5/em entrega/pedido 4/Dinheiro.svg';

// Bottom Bar Active (Gerenciar)
import HomeIcon8 from '../../assets/tela5/barra de baixo/Home.svg';
import MapIcon8 from '../../assets/tela5/barra de baixo/Map.svg';
import ManageIcon8 from '../../assets/tela2/barra/Manage.svg';
import GearIcon8 from '../../assets/tela5/barra de baixo/Gear.svg';
import MenuLabel8 from '../../assets/tela5/barra de baixo/Menu.svg';
import MapaLabel8 from '../../assets/tela5/barra de baixo/Mapa.svg';
import GerenciarLabel8 from '../../assets/tela2/barra/Gerenciar.svg';
import OpcoesLabel8 from '../../assets/tela5/barra de baixo/Opções.svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AdminSalesHistoryScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [hasFilteredDate, setHasFilteredDate] = useState(false);

  useEffect(() => {
    fetchSales();
  }, [date, hasFilteredDate]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            product_id,
            products (
              name,
              image_url
            )
          )
        `)
        .in('status', ['confirmed', 'completed'])
        .order('created_at', { ascending: false });

      if (hasFilteredDate) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        query = query.gte('created_at', start.toISOString()).lte('created_at', end.toISOString());
      } else {
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        query = query.gte('created_at', twoDaysAgo.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Erro ao buscar histórico de vendas:', error);
    } finally {
      setLoading(false);
    }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      setHasFilteredDate(true);
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
      {/* Header */}
      <AdminHeader title="historico_vendas" />

      {/* Body */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Title: Histórico de Vendas removed (now in header) */}

        {/* Filter Row: Hoje: [Selecionar data v] */}
        <View style={styles.filterRow}>
          <HojeLabelSvg width={90} height={36} />
          
          <TouchableOpacity activeOpacity={0.8} style={styles.filterBtn} onPress={() => setShowPicker(true)}>
            <FundoBtnFiltro width={170} height={42} style={{ position: 'absolute' }} />
            <View style={styles.filterBtnContent}>
              {hasFilteredDate ? (
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1C2434' }}>
                  {date.toLocaleDateString('pt-BR')}
                </Text>
              ) : (
                <SelecionarDataTexto width={110} height={16} />
              )}
              <SetaBaixo width={15} height={10} />
            </View>
          </TouchableOpacity>
        </View>

        {showPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onChangeDate}
          />
        )}

        {/* List of Sales */}
        {loading ? (
          <ActivityIndicator size="large" color="#339914" style={{ marginTop: 20 }} />
        ) : orders.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma venda registrada neste período.</Text>
        ) : (
          orders.map((order, index) => {
            const firstItem = order.order_items?.[0];
            const productImg = firstItem?.products?.image_url;

            return (
              <View key={order.id} style={styles.orderCard}>
                
                {/* Coluna 1: Imagem + Pedido X */}
                <View style={styles.colContainer}>
                  {productImg ? (
                    <Image source={{ uri: productImg }} style={styles.productImage} resizeMode="contain" />
                  ) : (
                    <View style={styles.placeholderImg} />
                  )}
                  <Text style={styles.pedidoText}>Pedido {index + 1}</Text>
                </View>

                {/* Separador 1 */}
                <Separador1 height={100} style={{ alignSelf: 'center' }} />

                {/* Coluna 2: Valor da Venda */}
                <View style={styles.colContainer}>
                  <ValorVendaSvg width={65} height={22} style={{ marginBottom: 12 }} />
                  <Text style={styles.valorText}>R$ {order.total_amount.toFixed(2).replace('.', ',')}</Text>
                </View>

                {/* Separador 2 */}
                <Separador2 height={100} style={{ alignSelf: 'center' }} />

                {/* Coluna 3: Forma de pagamento */}
                <View style={styles.colContainer}>
                  <FormaPgtoSvg width={65} height={22} style={{ marginBottom: 12 }} />
                  {getPaymentDisplay(order.payment_method)}
                </View>

                {/* Separador 3 */}
                <Separador3 height={100} style={{ alignSelf: 'center' }} />

                {/* Coluna 4: Ver Resumo */}
                <View style={styles.colContainer}>
                  <TouchableOpacity activeOpacity={0.7} style={styles.verResumoBtn}>
                    <VerResumoSvg width={61} height={34} />
                  </TouchableOpacity>
                </View>

              </View>
            )
          })
        )}
      </ScrollView>

      {/* ========== BARRA INFERIOR (GERENCIAR ATIVO) ========== */}
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 120, // espaço para barra inferior
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: -10,
    justifyContent: 'space-between',
    zIndex: 10,
  },
  filterBtn: {
    width: 170,
    height: 42,
    justifyContent: 'center',
  },
  filterBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  emptyText: {
    fontSize: 14,
    color: '#000',
    textAlign: 'center',
    marginTop: 20,
  },
  
  // Card
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
    paddingHorizontal: 2,
  },
  productImage: {
    width: 40,
    height: 40,
    marginBottom: 5,
  },
  placeholderImg: {
    width: 40,
    height: 40,
    backgroundColor: '#CCC',
    borderRadius: 8,
    marginBottom: 5,
  },
  pedidoText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1C2434',
    textAlign: 'center',
  },
  valorText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#339914', // a green tint like R$125,50.svg
    textAlign: 'center',
  },
  pgtoText: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  verResumoBtn: {
    alignItems: 'center',
    justifyContent: 'center'
  },

  // Bottom Bar
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
    backgroundColor: '#8A7268',
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
  iconBgActive: {
    width: 51,
    height: 41,
    borderRadius: 20,
    backgroundColor: '#E3DAD9',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
