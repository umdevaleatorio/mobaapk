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

  const totalGeral = orders.reduce((acc, o) => acc + (o.total ?? 0), 0);
  const totalCredito = orders.reduce((acc, o) => acc + (o.payment_method === 'cartao_credito' ? (o.total ?? 0) : 0), 0);
  const totalDebito = orders.reduce((acc, o) => acc + (o.payment_method === 'cartao_debito' ? (o.total ?? 0) : 0), 0);
  const totalDinheiro = orders.reduce((acc, o) => acc + (o.payment_method === 'dinheiro' ? (o.total ?? 0) : 0), 0);
  const totalPix = orders.reduce((acc, o) => acc + (o.payment_method === 'pix' ? (o.total ?? 0) : 0), 0);

  const formatCurrency = (val: number) => {
    return `R$ ${val.toFixed(2).replace('.', ',')}`;
  };

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
          users (
            id,
            name,
            phone,
            rua,
            numero,
            bairro,
            cep
          ),
          order_items (
            product_id,
            quantity,
            unit_price,
            products (
              name,
              image_url
            )
          )
        `)
        .eq('status', 'completed')
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
      case 'pix': return <Text style={[styles.pgtoText, { color: '#00BFA5' }]}>Pix</Text>;
      case 'cartao_credito': return <Text style={[styles.pgtoText, { color: '#FF0000' }]}>Cartão/Crédito</Text>;
      case 'cartao_debito': return <Text style={[styles.pgtoText, { color: '#4CAF50' }]}>Cartão/Débito</Text>;
      case 'dinheiro': return <Text style={[styles.pgtoText, { color: '#1B5E20' }]}>Dinheiro</Text>;
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

        {/* Totals Summary Card (Branco-neve) */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTotalRow}>
            <Text style={styles.summaryTotalLabel}>Venda Total do Dia</Text>
            <Text style={styles.summaryTotalValue}>{formatCurrency(totalGeral)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabelCredito}>Cartão de Crédito</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalCredito)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabelDebito}>Cartão de Débito</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalDebito)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabelDinheiro}>Dinheiro</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalDinheiro)}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabelPix}>Pix</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalPix)}</Text>
          </View>
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
                
                {/* Coluna 1: Foto do produto */}
                <View style={styles.colContainer}>
                  <View style={styles.productImageContainer}>
                    {productImg ? (
                      <Image source={{ uri: productImg }} style={styles.productImage} resizeMode="contain" />
                    ) : (
                      <View style={styles.placeholderImg} />
                    )}
                  </View>
                </View>

                {/* Separador 1 */}
                <View style={styles.cardSeparator} />

                {/* Coluna 2: Forma de pagamento */}
                <View style={styles.colContainer}>
                  <Text style={styles.headerTextWhite}>Forma de{"\n"}pagamento</Text>
                  {getPaymentDisplay(order.payment_method)}
                </View>

                {/* Separador 2 */}
                <View style={styles.cardSeparator} />

                {/* Coluna 3: Valor total da venda */}
                <View style={styles.colContainer}>
                  <Text style={styles.headerTextWhite}>Valor de{"\n"}venda</Text>
                  <Text style={styles.valorText}>R$ {(order.total ?? 0).toFixed(2).replace('.', ',')}</Text>
                </View>

                {/* Separador 3 */}
                <View style={styles.cardSeparator} />

                {/* Coluna 4: Ver Resumo */}
                <View style={styles.colContainer}>
                  <TouchableOpacity 
                    activeOpacity={0.7} 
                    style={styles.verResumoBtn}
                    onPress={() => navigation.navigate('AdminOrderDetailScreen', { order })}
                  >
                    <Text style={styles.verResumoText}>Ver{"\n"}Resumo</Text>
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
    backgroundColor: '#1C2434', // Dark blue
    borderRadius: 15,
    marginBottom: 15,
    height: 100, // Fixed height similar to design
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  colContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  productImageContainer: {
    width: 70,
    height: 70,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  productImage: {
    width: 58,
    height: 58,
  },
  placeholderImg: {
    width: 58,
    height: 58,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
  },
  cardSeparator: {
    width: 1,
    height: 100,
    backgroundColor: '#F5F5F5',
  },
  headerTextWhite: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
    marginTop: -8,
  },
  valorText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#339914', // Green
    textAlign: 'center',
  },
  pgtoText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  verResumoBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  verResumoText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
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
  summaryCard: {
    backgroundColor: '#FFFAFA', // Branco-neve
    borderRadius: 15,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E3E4EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E3E4EB',
    paddingBottom: 10,
    marginBottom: 10,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  summaryLabelCredito: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FF0000', // Vermelho para crédito
  },
  summaryLabelDebito: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4CAF50', // Verde para débito
  },
  summaryLabelDinheiro: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1B5E20', // Verde escuro para dinheiro
  },
  summaryLabelPix: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#00BFA5', // Verde-água para pix
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#48B644', // Verde um pouco mais claro
  },
});
