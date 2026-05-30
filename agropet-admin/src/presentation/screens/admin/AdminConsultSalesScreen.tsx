import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Image, Platform, Modal, Alert, RefreshControl } from 'react-native';
import AdminHeader from '../../components/AdminHeader';
import { AdminUserMenu } from '../../components/AdminUserMenu';
import { supabase } from '../../../data/datasources/supabase/client';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../contexts/ThemeContext';
import { isHoliday } from '../../../utils/shopHours';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';


// Top SVGs
import FundoBtnFiltro from '../../assets/tela6/selecionar data/Fundo.svg';
import SetaBaixo from '../../assets/tela6/selecionar data/Upside Down.svg';

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

interface CaixaTransaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  type: 'sangria' | 'suprimento';
  paymentMethod?: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix';
}

export default function AdminConsultSalesScreen() {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);

  // Caixa Global State
  const [transactions, setTransactions] = useState<CaixaTransaction[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);

  // Date and Range filter states
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isRange, setIsRange] = useState(false);
  const [hasFiltered, setHasFiltered] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // Active filters applied to the view
  const [originFilter, setOriginFilter] = useState<'tudo' | 'fisica' | 'concluidos'>('tudo');
  const [selectedPayMethods, setSelectedPayMethods] = useState<string[]>(['dinheiro', 'cartao_credito', 'cartao_debito', 'pix']);
  const [statusFilter, setStatusFilter] = useState<'todos' | 'completed' | 'cancelled'>('todos');

  // Temporary filter state inside the unified modal
  const [tempOriginFilter, setTempOriginFilter] = useState<'tudo' | 'fisica' | 'concluidos'>('tudo');
  const [tempPayMethods, setTempPayMethods] = useState<string[]>(['dinheiro', 'cartao_credito', 'cartao_debito', 'pix']);
  const [tempStatusFilter, setTempStatusFilter] = useState<'todos' | 'completed' | 'cancelled'>('todos');

  // Backup states for Sunday/Holiday automatic reversion
  const [prevStartDate, setPrevStartDate] = useState<Date>(new Date());
  const [prevEndDate, setPrevEndDate] = useState<Date>(new Date());
  const [prevIsRange, setPrevIsRange] = useState(false);
  const [prevHasFiltered, setPrevHasFiltered] = useState(true);

  // Modals visibility
  const [showFilterOptionModal, setShowFilterOptionModal] = useState(false);
  const [showSundayHolidayModal, setShowSundayHolidayModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showPaymentEditModal, setShowPaymentEditModal] = useState(false);

  // Selected order for payment editing
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // DateTimePicker flow
  const [pickerMode, setPickerMode] = useState<'single' | 'range_start' | 'range_end'>('single');
  const [showPicker, setShowPicker] = useState(false);

  // Local picker state before confirming range
  const [localStartDate, setLocalStartDate] = useState<Date>(new Date());
  const [localEndDate, setLocalEndDate] = useState<Date>(new Date());

  // Lifetime Caixa calculations
  const getTransactionSum = (method: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix', type: 'sangria' | 'suprimento') => {
    return transactions.reduce((acc, t) => {
      if (t.description === 'Venda PDV' || t.description === 'Venda PDV (Cancelada)') return acc;
      const isMatch = (t.paymentMethod || 'dinheiro') === method && (t.type || 'sangria') === type;
      return acc + (isMatch ? t.amount : 0);
    }, 0);
  };

  const totalCreditoGeral = allOrders.reduce((acc, o) => acc + (o.payment_method === 'cartao_credito' ? (o.total ?? 0) : 0), 0) + getTransactionSum('cartao_credito', 'suprimento') - getTransactionSum('cartao_credito', 'sangria');
  const totalDebitoGeral = allOrders.reduce((acc, o) => acc + (o.payment_method === 'cartao_debito' ? (o.total ?? 0) : 0), 0) + getTransactionSum('cartao_debito', 'suprimento') - getTransactionSum('cartao_debito', 'sangria');
  const totalPixGeral = allOrders.reduce((acc, o) => acc + (o.payment_method === 'pix' ? (o.total ?? 0) : 0), 0) + getTransactionSum('pix', 'suprimento') - getTransactionSum('pix', 'sangria');
  const totalDinheiroVendasGeral = allOrders.reduce((acc, o) => acc + (o.payment_method === 'dinheiro' ? (o.total ?? 0) : 0), 0);
  const totalDinheiroCaixaGeral = totalDinheiroVendasGeral + getTransactionSum('dinheiro', 'suprimento') - getTransactionSum('dinheiro', 'sangria');
  const saldoTotalCaixaGeral = totalCreditoGeral + totalDebitoGeral + totalPixGeral + totalDinheiroCaixaGeral;

  const formatCurrency = (val: number) => {
    return `R$ ${val.toFixed(2).replace('.', ',')}`;
  };

  // Load persisted dates from AsyncStorage on mount
  useEffect(() => {
    const loadPersistedDates = async () => {
      try {
        const storedStart = await AsyncStorage.getItem('admin_consult_startDate');
        const storedEnd = await AsyncStorage.getItem('admin_consult_endDate');
        const storedIsRange = await AsyncStorage.getItem('admin_consult_isRange');
        const storedHasFiltered = await AsyncStorage.getItem('admin_consult_hasFiltered');

        if (storedStart) setStartDate(new Date(storedStart));
        if (storedEnd) setEndDate(new Date(storedEnd));
        if (storedIsRange) setIsRange(storedIsRange === 'true');
        if (storedHasFiltered) setHasFiltered(storedHasFiltered === 'true');
      } catch (error) {
        console.error('Error loading persisted consult sales dates:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadPersistedDates();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (isLoaded) {
        fetchSales();
        fetchCaixaData();
      }
    });
    return unsubscribe;
  }, [navigation, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;

    const saveDates = async () => {
      try {
        await AsyncStorage.setItem('admin_consult_startDate', startDate.toISOString());
        await AsyncStorage.setItem('admin_consult_endDate', endDate.toISOString());
        await AsyncStorage.setItem('admin_consult_isRange', String(isRange));
        await AsyncStorage.setItem('admin_consult_hasFiltered', String(hasFiltered));
      } catch (error) {
        console.error('Error persisting consult sales dates:', error);
      }
    };
    saveDates();

    fetchSales();
    fetchCaixaData();
  }, [startDate, endDate, isRange, hasFiltered, isLoaded]);

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
        .in('status', ['completed', 'cancelled'])
        .order('created_at', { ascending: false });

      if (hasFiltered) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
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

  const fetchCaixaData = async () => {
    try {
      // Fetch all completed orders
      const { data: allData, error: allErr } = await supabase
        .from('orders')
        .select('total, payment_method')
        .eq('status', 'completed');
      if (!allErr && allData) {
        setAllOrders(allData);
      }

      // Load SecureStore ledger
      const stored = await SecureStore.getItemAsync('agropet_sangrias');
      if (stored) {
        const parsed: CaixaTransaction[] = JSON.parse(stored);
        const normalized = parsed.filter(t => (t.type as string) !== 'venda' && t.description !== 'Venda PDV' && t.description !== 'Venda PDV (Cancelada)');
        setTransactions(normalized);
      } else {
        setTransactions([]);
      }
    } catch (e) {
      console.error('Erro ao buscar dados do caixa global:', e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchSales(), fetchCaixaData()]);
    setRefreshing(false);
  };

  const handleCancelOrder = async (order: any) => {
    Alert.alert(
      'Cancelar Venda',
      `Deseja realmente cancelar a venda #${order.id.slice(0, 8).toUpperCase()}? O estoque dos itens comprados será devolvido e a venda deduzida do caixa.`,
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, Cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              // 1. Devolve itens ao estoque
              const orderItems = order.order_items || [];
              for (const item of orderItems) {
                if (item.product_id && item.quantity > 0) {
                  // Buscar estoque atual
                  const { data: prodData } = await supabase
                    .from('products')
                    .select('stock')
                    .eq('id', item.product_id)
                    .single();
                  
                  if (prodData) {
                    await supabase
                      .from('products')
                      .update({ stock: prodData.stock + item.quantity })
                      .eq('id', item.product_id);
                  }
                }
              }

              // 2. Modifica status da ordem para 'cancelled'
              const { error: orderError } = await supabase
                .from('orders')
                .update({ status: 'cancelled' })
                .eq('id', order.id);

              if (orderError) throw orderError;

              // 3. Sincroniza localmente com o SecureStore se for venda física PDV
              if (order.delivery_address === 'Venda Física PDV') {
                const stored = await SecureStore.getItemAsync('agropet_sangrias');
                if (stored) {
                  const txList: CaixaTransaction[] = JSON.parse(stored);
                  const orderTime = new Date(order.created_at).getTime();
                  let bestIdx = -1;
                  let minDiff = Infinity;

                  for (let i = 0; i < txList.length; i++) {
                    const tx = txList[i];
                    if (tx.description === 'Venda PDV' && Math.abs(tx.amount - order.total) < 0.01) {
                      const txTime = new Date(tx.date).getTime();
                      const diff = Math.abs(txTime - orderTime);
                      if (diff < minDiff && diff < 5 * 60 * 1000) {
                        minDiff = diff;
                        bestIdx = i;
                      }
                    }
                  }

                  if (bestIdx !== -1) {
                    txList[bestIdx].description = 'Venda PDV (Cancelada)';
                    txList[bestIdx].amount = 0;
                    await SecureStore.setItemAsync('agropet_sangrias', JSON.stringify(txList));
                  }
                }
              }

              Alert.alert('Sucesso', 'Venda cancelada e estoque estornado!');
              await Promise.all([fetchSales(), fetchCaixaData()]);
            } catch (err) {
              console.error('Erro ao cancelar venda:', err);
              Alert.alert('Erro', 'Não foi possível cancelar a venda.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleEditPaymentMethod = (order: any) => {
    setSelectedOrder(order);
    setShowPaymentEditModal(true);
  };

  const confirmPaymentEdit = async (newMethod: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix') => {
    if (!selectedOrder) return;
    setShowPaymentEditModal(false);

    try {
      setLoading(true);
      // 1. Atualiza no Supabase
      const { error: dbError } = await supabase
        .from('orders')
        .update({ payment_method: newMethod })
        .eq('id', selectedOrder.id);

      if (dbError) throw dbError;

      // 2. Sincroniza localmente com o SecureStore se for venda física PDV
      if (selectedOrder.delivery_address === 'Venda Física PDV') {
        const stored = await SecureStore.getItemAsync('agropet_sangrias');
        if (stored) {
          const txList: CaixaTransaction[] = JSON.parse(stored);
          const orderTime = new Date(selectedOrder.created_at).getTime();
          let bestIdx = -1;
          let minDiff = Infinity;

          for (let i = 0; i < txList.length; i++) {
            const tx = txList[i];
            if (tx.description === 'Venda PDV' && Math.abs(tx.amount - selectedOrder.total) < 0.01) {
              const txTime = new Date(tx.date).getTime();
              const diff = Math.abs(txTime - orderTime);
              if (diff < minDiff && diff < 5 * 60 * 1000) {
                minDiff = diff;
                bestIdx = i;
              }
            }
          }

          if (bestIdx !== -1) {
            txList[bestIdx].paymentMethod = newMethod;
            await SecureStore.setItemAsync('agropet_sangrias', JSON.stringify(txList));
          }
        }
      }

      Alert.alert('Sucesso', 'Forma de pagamento atualizada!');
      await Promise.all([fetchSales(), fetchCaixaData()]);
    } catch (err) {
      console.error('Erro ao atualizar forma de pagamento:', err);
      Alert.alert('Erro', 'Não foi possível atualizar a forma de pagamento.');
    } finally {
      setLoading(false);
      setSelectedOrder(null);
    }
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (event.type === 'dismissed') {
      return;
    }

    if (selectedDate) {
      if (pickerMode === 'single') {
        const isSun = selectedDate.getDay() === 0;
        const isHol = isHoliday(selectedDate);
        if (isSun || isHol) {
          setShowSundayHolidayModal(true);
          return;
        }

        // Save backups
        setPrevStartDate(startDate);
        setPrevEndDate(endDate);
        setPrevIsRange(isRange);
        setPrevHasFiltered(hasFiltered);

        setStartDate(selectedDate);
        setEndDate(selectedDate);
        setIsRange(false);
        setHasFiltered(true);
        setShowFilterOptionModal(false); // Close modal on single pick
      } else if (pickerMode === 'range_start') {
        setLocalStartDate(selectedDate);
      } else if (pickerMode === 'range_end') {
        setLocalEndDate(selectedDate);
      }
    }
  };

  const handleCloseSundayHolidayModal = () => {
    setShowSundayHolidayModal(false);
    // Explicitly guarantee reversion
    setStartDate(prevStartDate);
    setEndDate(prevEndDate);
    setIsRange(prevIsRange);
    setHasFiltered(prevHasFiltered);
  };

  const getDynamicTitle = () => {
    if (!hasFiltered) {
      return "Histórico:";
    }
    if (isRange) {
      const startD = startDate.getDate();
      const startM = startDate.getMonth();
      const startY = startDate.getFullYear();

      const endD = endDate.getDate();
      const endM = endDate.getMonth();
      const endY = endDate.getFullYear();

      if (startD === endD && startM === endM && startY === endY) {
        return getSingleDayTitle(startDate);
      }
      return "Neste período:";
    }
    return getSingleDayTitle(startDate);
  };

  const getSingleDayTitle = (selectedDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const target = new Date(selectedDate);
    target.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - target.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Hoje:";
    } else if (diffDays === 1) {
      return "Ontem:";
    } else if (diffDays === 2) {
      return "Anteontem:";
    } else {
      return "Neste dia:";
    }
  };

  const getPaymentDisplay = (paymentMethod: string) => {
    switch(paymentMethod) {
      case 'pix': return <Text style={{ color: '#00BFA5', fontWeight: 'bold' }}>Pix</Text>;
      case 'cartao_credito': return <Text style={{ color: '#FF0000', fontWeight: 'bold' }}>Crédito</Text>;
      case 'cartao_debito': return <Text style={{ color: '#4CAF50', fontWeight: 'bold' }}>Débito</Text>;
      case 'dinheiro': return <Text style={{ color: isDarkMode ? '#00E676' : '#1B5E20', fontWeight: 'bold' }}>Dinheiro</Text>;
      default: return <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{paymentMethod}</Text>;
    }
  };

  const getPaymentDisplayPortuguese = (paymentMethod: string) => {
    switch(paymentMethod) {
      case 'pix': return 'Pix';
      case 'cartao_credito': return 'Cartão de Crédito';
      case 'cartao_debito': return 'Cartão de Débito';
      case 'dinheiro': return 'Dinheiro';
      default: return paymentMethod;
    }
  };

  // Payment Colors inside unified filter modal
  const getPayMethodColor = (method: string) => {
    switch(method) {
      case 'dinheiro': return isDarkMode ? '#00E676' : '#1B5E20';
      case 'cartao_credito': return isDarkMode ? '#FF5252' : '#FF0000';
      case 'cartao_debito': return '#4CAF50';
      case 'pix': return '#00BFA5';
      default: return colors.textDark;
    }
  };

  const filteredOrders = orders.filter((order) => {
    // 1. Origin Filter
    if (originFilter === 'fisica') {
      if (order.delivery_address !== 'Venda Física PDV') return false;
    } else if (originFilter === 'concluidos') {
      if (order.delivery_address === 'Venda Física PDV') return false;
    }

    // 2. Multi-select Payment Method Filter
    if (selectedPayMethods.length > 0) {
      if (!selectedPayMethods.includes(order.payment_method)) {
        return false;
      }
    } else {
      // If none is selected, don't show anything
      return false;
    }

    // 3. Status Filter (Concluído / Cancelado)
    if (statusFilter !== 'todos') {
      if (order.status !== statusFilter) return false;
    }

    return true;
  });

  const handleOpenFilterModal = () => {
    setTempOriginFilter(originFilter);
    setTempPayMethods(selectedPayMethods);
    setTempStatusFilter(statusFilter);
    setShowFilterModal(true);
  };

  const handleToggleTempPayMethod = (method: string) => {
    if (tempPayMethods.includes(method)) {
      setTempPayMethods(tempPayMethods.filter(m => m !== method));
    } else {
      setTempPayMethods([...tempPayMethods, method]);
    }
  };

  const handleApplyFilters = () => {
    setOriginFilter(tempOriginFilter);
    setSelectedPayMethods(tempPayMethods);
    setStatusFilter(tempStatusFilter);
    setShowFilterModal(false);
  };

  const iconColorInactive = isDarkMode ? '#FFFFFF' : undefined; /* istanbul ignore next - unused */

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.white }]}>
      {/* Header */}
      <AdminHeader title="consultar_vendas" />

      {/* Body */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#339914"]}
            tintColor={isDarkMode ? "#FFFFFF" : "#339914"}
          />
        }
      >
        
        {/* ========== CAIXA GLOBAL PANEL ========== */}
        <View style={[styles.caixaCard, { backgroundColor: isDarkMode ? '#2E2E38' : '#1C2434' }]}>
          <View style={styles.caixaTopRow}>
            <View>
              <Text style={styles.caixaTitle}>Saldo Total em Caixa</Text>
              <Text style={[styles.caixaValue, { color: saldoTotalCaixaGeral >= 0 ? '#00E676' : '#FF5252' }]}>
                {formatCurrency(saldoTotalCaixaGeral)}
              </Text>
            </View>
            {/* Pulsing indicator - green or red depending on Dinheiro physical cash balance */}
            <View style={styles.pulseContainer}>
              <View style={[styles.pulseDot, { backgroundColor: totalDinheiroCaixaGeral >= 0 ? '#00E676' : '#FF5252' }]} />
              <View style={[styles.pulseRing, { borderColor: totalDinheiroCaixaGeral >= 0 ? '#00E676' : '#FF5252' }]} />
            </View>
          </View>

          <View style={styles.caixaDivider} />

          <View style={styles.caixaSubGrid}>
            <View style={styles.caixaSubItem}>
              <Feather name="credit-card" size={14} color="#FF5252" />
              <Text style={styles.caixaSubLabel}>Crédito</Text>
              <Text style={styles.caixaSubValue}>{formatCurrency(totalCreditoGeral)}</Text>
            </View>
            <View style={styles.caixaSubItem}>
              <Feather name="credit-card" size={14} color="#4CAF50" />
              <Text style={styles.caixaSubLabel}>Débito</Text>
              <Text style={styles.caixaSubValue}>{formatCurrency(totalDebitoGeral)}</Text>
            </View>
            <View style={styles.caixaSubItem}>
              <Feather name="smartphone" size={14} color="#00E676" />
              <Text style={styles.caixaSubLabel}>Pix</Text>
              <Text style={styles.caixaSubValue}>{formatCurrency(totalPixGeral)}</Text>
            </View>
            <View style={styles.caixaSubItem}>
              <Feather name="dollar-sign" size={14} color={totalDinheiroCaixaGeral >= 0 ? '#00E676' : '#FF5252'} />
              <Text style={styles.caixaSubLabel}>Dinheiro</Text>
              <Text style={[styles.caixaSubValue, { color: totalDinheiroCaixaGeral >= 0 ? '#00E676' : '#FF5252' }]}>
                {formatCurrency(totalDinheiroCaixaGeral)}
              </Text>
            </View>
          </View>
        </View>

        {/* ========== UNIFIED FILTER BUTTONS BAR ========== */}
        <View style={styles.filterSectionContainer}>
          <View style={styles.filterLeftRow}>
            {/* Unified Filter Trigger */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.originFilterBtn, { backgroundColor: isDarkMode ? '#2E2E38' : '#F5F6FA', borderColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]}
              onPress={handleOpenFilterModal}
            >
              <Feather name="sliders" size={14} color={isDarkMode ? '#FFE082' : '#F97D01'} style={{ marginRight: 6 }} />
              <Text style={[styles.originFilterText, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]} numberOfLines={1}>
                {originFilter === 'tudo' ? 'Filtrar vendas' : originFilter === 'fisica' ? 'Vendas físicas' : 'Pedidos concluídos'}
              </Text>
              {selectedPayMethods.length < 4 && (
                <View style={styles.filterCountBadge}>
                  <Text style={styles.filterCountText}>{selectedPayMethods.length}</Text>
                </View>
              )}
              <Feather name="chevron-down" size={14} color={isDarkMode ? '#A8A8B3' : '#767676'} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>

          {/* Date Picker Trigger (Right side aligned, sized identical to historical screen = 170) */}
          <View style={styles.filterRightRow}>
            <TouchableOpacity 
              activeOpacity={0.8} 
              style={[
                styles.filterBtn, 
                isDarkMode && { backgroundColor: '#1E1E24', borderRadius: 10 }
              ]} 
              onPress={() => {
                setLocalStartDate(startDate);
                setLocalEndDate(endDate);
                setShowFilterOptionModal(true);
              }}
            >
              {!isDarkMode && (
                <FundoBtnFiltro width={170} height={42} style={{ position: 'absolute' }} />
              )}
              <View style={styles.filterBtnContent}>
                {hasFiltered ? (
                  <Text style={{ 
                    fontSize: isRange ? 11 : 13, 
                    fontWeight: 'bold', 
                    color: isDarkMode ? '#FFFFFF' : '#1C2434',
                    textAlign: 'center',
                    flex: 1
                  }}>
                    {isRange 
                      ? `${startDate.getDate()}/${startDate.getMonth()+1} - ${endDate.getDate()}/${endDate.getMonth()+1}`
                      : startDate.toLocaleDateString('pt-BR')
                    }
                  </Text>
                ) : (
                  <Text style={{ 
                    fontSize: 13, 
                    fontWeight: 'bold', 
                    color: isDarkMode ? '#FFFFFF' : '#1C2434',
                    textAlign: 'center',
                    flex: 1
                  }}>
                    Selecionar data
                  </Text>
                )}
                <SetaBaixo 
                  width={15} 
                  height={10} 
                  color={isDarkMode ? '#FFE082' : '#1C2434'} 
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {showPicker && (
          <DateTimePicker
            value={pickerMode === 'range_end' ? endDate : startDate}
            mode="date"
            display="default"
            onChange={onChangeDate}
            themeVariant={isDarkMode ? 'dark' : 'light'}
          />
        )}

        {/* ========== UNIFIED FILTER MODAL (ORIGIN & PAYMENT) ========== */}
        <Modal visible={showFilterModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.whiteModalContainer, { backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF' }]}>
              <Text style={[styles.whiteModalTitle, { color: colors.textDark }]}>Filtrar Vendas</Text>
              
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
                {/* SUBSECTION 1: ORIGIN */}
                <Text style={[styles.modalSubsectionHeader, { color: isDarkMode ? '#FFE082' : '#F97D01' }]}>Origem da venda</Text>
                
                {['tudo', 'fisica', 'concluidos'].map((origin) => {
                  const label = origin === 'tudo' ? 'Ver tudo' : origin === 'fisica' ? 'Vendas físicas (PDV)' : 'Pedidos concluídos (E-commerce)';
                  const isSelected = tempOriginFilter === origin;
                  
                  return (
                    <TouchableOpacity
                      key={origin}
                      activeOpacity={0.7}
                      style={[styles.modalFilterRow, { borderBottomColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]}
                      onPress={() => setTempOriginFilter(origin as any)}
                    >
                      <Text style={[styles.modalFilterLabel, { color: colors.textDark, fontWeight: isSelected ? 'bold' : 'normal' }]}>
                        {label}
                      </Text>
                      <View style={[styles.radioCircle, isSelected && { borderColor: '#25BE36' }]}>
                        {isSelected && <View style={styles.radioChecked} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {/* SUBSECTION 2: MULTI-SELECT PAYMENT METHODS */}
                <Text style={[styles.modalSubsectionHeader, { color: isDarkMode ? '#FFE082' : '#F97D01', marginTop: 20 }]}>Forma de pagamento</Text>
                
                {['dinheiro', 'cartao_credito', 'cartao_debito', 'pix'].map((method) => {
                  const label = getPaymentDisplayPortuguese(method);
                  const isChecked = tempPayMethods.includes(method);
                  const themedColor = getPayMethodColor(method);
                  
                  return (
                    <TouchableOpacity
                      key={method}
                      activeOpacity={0.7}
                      style={[styles.modalFilterRow, { borderBottomColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]}
                      onPress={() => handleToggleTempPayMethod(method)}
                    >
                      <Text style={[styles.modalFilterLabel, { color: themedColor, fontWeight: 'bold' }]}>
                        {label}
                      </Text>
                      <View style={[styles.checkboxSquare, isChecked && { backgroundColor: themedColor, borderColor: themedColor }]}>
                        {isChecked && <Feather name="check" size={12} color="#FFFFFF" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {/* SUBSECTION 3: ORDER STATUS (Concluído/Cancelado) */}
                <Text style={[styles.modalSubsectionHeader, { color: isDarkMode ? '#FFE082' : '#F97D01', marginTop: 20 }]}>Situação da venda</Text>

                {['todos', 'completed', 'cancelled'].map((statusOption) => {
                  const label = statusOption === 'todos' ? 'Ver tudo' : statusOption === 'completed' ? 'Apenas Concluídas' : 'Apenas Canceladas';
                  const isSelected = tempStatusFilter === statusOption;

                  return (
                    <TouchableOpacity
                      key={statusOption}
                      activeOpacity={0.7}
                      style={[styles.modalFilterRow, { borderBottomColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]}
                      onPress={() => setTempStatusFilter(statusOption as any)}
                    >
                      <Text style={[styles.modalFilterLabel, { color: colors.textDark, fontWeight: isSelected ? 'bold' : 'normal' }]}>
                        {label}
                      </Text>
                      <View style={[styles.radioCircle, isSelected && { borderColor: '#25BE36' }]}>
                        {isSelected && <View style={styles.radioChecked} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {/* Utility selection buttons */}
                <View style={styles.modalUtilityRow}>
                  <TouchableOpacity onPress={() => setTempPayMethods(['dinheiro', 'cartao_credito', 'cartao_debito', 'pix'])}>
                    <Text style={[styles.utilityText, { color: colors.primary }]}>Selecionar Todos</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setTempPayMethods([])}>
                    <Text style={[styles.utilityText, { color: '#FF3B30' }]}>Limpar</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>

              {/* Confirm / Cancel Buttons */}
              <View style={styles.modalButtonsRow}>
                <TouchableOpacity 
                  style={[styles.modalConfirmBtn, { backgroundColor: '#25BE36' }]}
                  activeOpacity={0.7}
                  onPress={handleApplyFilters}
                >
                  <Text style={styles.modalConfirmText}>Aplicar Filtros</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.modalCancelBtn, { borderColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]}
                  activeOpacity={0.7}
                  onPress={() => setShowFilterModal(false)}
                >
                  <Text style={[styles.modalCancelText, { color: colors.textDark }]}>Fechar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* ========== MODAL: EDIT PAYMENT METHOD ========== */}
        <Modal visible={showPaymentEditModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.whiteModalContainer, { backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF' }]}>
              <Text style={[styles.whiteModalTitle, { color: colors.textDark }]}>Mudar Forma de Pagamento</Text>
              <Text style={[styles.whiteModalDesc, { color: isDarkMode ? '#A8A8B3' : '#767676' }]}>
                Escolha o novo método de pagamento para esta venda:
              </Text>

              {['dinheiro', 'cartao_credito', 'cartao_debito', 'pix'].map((method) => (
                <TouchableOpacity
                  key={method}
                  activeOpacity={0.7}
                  style={[styles.modalFilterRow, { borderBottomColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]}
                  onPress={() => confirmPaymentEdit(method as any)}
                >
                  <Text style={[styles.modalFilterLabel, { color: getPayMethodColor(method), fontWeight: 'bold' }]}>
                    {getPaymentDisplayPortuguese(method)}
                  </Text>
                  {selectedOrder?.payment_method === method && <Feather name="check" size={18} color="#25BE36" />}
                </TouchableOpacity>
              ))}

              <TouchableOpacity 
                style={{ alignSelf: 'center', marginTop: 16 }}
                activeOpacity={0.7}
                onPress={() => {
                  setShowPaymentEditModal(false);
                  setSelectedOrder(null);
                }}
              >
                <Text style={{ color: '#FF3B30', fontWeight: 'bold' }}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal de Opções de Filtro de Data */}
        <Modal visible={showFilterOptionModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.whiteModalContainer, { backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF' }]}>
              <Text style={[styles.whiteModalTitle, { color: colors.textDark }]}>
                Filtrar Ganhos
              </Text>
              <Text style={[styles.whiteModalDesc, { color: isDarkMode ? '#A8A8B3' : '#767676' }]}>
                Escolha como deseja consultar as vendas da loja:
              </Text>

              {/* MODO DIA ÚNICO */}
              <TouchableOpacity 
                style={[styles.filterModeHeader, { borderBottomColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]}
                activeOpacity={0.7}
                onPress={() => {
                  setPickerMode('single');
                  setShowPicker(true);
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Feather name="calendar" size={20} color={colors.primary} style={{ marginRight: 10 }} />
                  <View>
                    <Text style={[styles.filterModeTitle, { color: colors.textDark }]}>Dia Único</Text>
                    <Text style={{ fontSize: 12, color: isDarkMode ? '#A8A8B3' : '#767676' }}>
                      Consultar vendas de uma data específica
                    </Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color={isDarkMode ? '#A8A8B3' : '#767676'} />
              </TouchableOpacity>

              {/* MODO PERÍODO PERSONALIZADO */}
              <View style={[styles.filterPeriodContainer, { borderColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]}>
                <Text style={[styles.filterModeTitle, { color: colors.textDark, marginBottom: 12 }]}>
                  Período Personalizado
                </Text>

                <View style={styles.rangeRowContainer}>
                  {/* Botão Data Início */}
                  <TouchableOpacity 
                    style={[styles.datePickRow, { backgroundColor: isDarkMode ? '#1E1E24' : '#F5F6FA' }]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setPickerMode('range_start');
                      setShowPicker(true);
                    }}
                  >
                    <Text style={styles.datePickLabel}>Início</Text>
                    <Text style={[styles.datePickVal, { color: colors.textDark }]}>
                      {localStartDate.toLocaleDateString('pt-BR')}
                    </Text>
                  </TouchableOpacity>

                  <Feather name="arrow-right" size={16} color={isDarkMode ? '#FFFFFF' : '#1C2434'} style={{ alignSelf: 'center' }} />

                  {/* Botão Data Fim */}
                  <TouchableOpacity 
                    style={[styles.datePickRow, { backgroundColor: isDarkMode ? '#1E1E24' : '#F5F6FA' }]}
                    activeOpacity={0.7}
                    onPress={() => {
                      setPickerMode('range_end');
                      setShowPicker(true);
                    }}
                  >
                    <Text style={styles.datePickLabel}>Fim</Text>
                    <Text style={[styles.datePickVal, { color: colors.textDark }]}>
                      {localEndDate.toLocaleDateString('pt-BR')}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Botão de Confirmar Período */}
                <TouchableOpacity 
                  style={[styles.whiteModalBtnConfirm, { backgroundColor: '#25BE36', marginTop: 12 }]}
                  activeOpacity={0.7}
                  onPress={() => {
                    let start = new Date(localStartDate);
                    let end = new Date(localEndDate);

                    if (start.getTime() > end.getTime()) {
                      const t = start;
                      start = end;
                      end = t;
                    }

                    // Salva backups
                    setPrevStartDate(startDate);
                    setPrevEndDate(endDate);
                    setPrevIsRange(isRange);
                    setPrevHasFiltered(hasFiltered);

                    setStartDate(start);
                    setEndDate(end);
                    setIsRange(true);
                    setHasFiltered(true);
                    setShowFilterOptionModal(false);
                  }}
                >
                  <Text style={styles.whiteModalBtnTextConfirm}>Filtrar Período</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={{ alignSelf: 'center', marginTop: 16 }}
                activeOpacity={0.7}
                onPress={() => setShowFilterOptionModal(false)}
              >
                <Text style={{ color: '#FF3B30', fontWeight: 'bold' }}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal de Alerta de Domingo/Feriado */}
        <Modal visible={showSundayHolidayModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.whiteModalContainer, { backgroundColor: '#FFFFFF' }]}>
              <View style={{ alignSelf: 'center', marginBottom: 16 }}>
                <Feather name="alert-triangle" size={48} color="#FF3B30" />
              </View>
              <Text style={[styles.whiteModalTitle, { color: '#1C2434' }]}>
                Aviso de Fechamento
              </Text>
              <Text style={[styles.whiteModalDesc, { color: '#767676', fontSize: 15, lineHeight: 22 }]}>
                Este dia foi domingo/feriado, portanto a loja esteve fechada.
              </Text>
              
              <TouchableOpacity 
                style={[styles.whiteModalBtnConfirm, { backgroundColor: '#FF3B30', marginTop: 8 }]}
                activeOpacity={0.7}
                onPress={handleCloseSundayHolidayModal}
              >
                <Text style={styles.whiteModalBtnTextConfirm}>Entendido</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ========== LIST OF CARD SALES ========== */}
        <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFFFFF' : '#1C2434', marginLeft: 4, marginBottom: 12 }]}>
          {getDynamicTitle()}
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color="#339914" style={{ marginTop: 20 }} />
        ) : filteredOrders.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textDark }]}>Nenhuma venda registrada neste período.</Text>
        ) : (
          filteredOrders.map((order) => {
            const isCancelled = order.status === 'cancelled';
            const shortId = order.id.slice(0, 8).toUpperCase();
            const clientName = order.delivery_address === 'Venda Física PDV' ? 'Venda Física (PDV)' : (order.users?.name || 'Cliente');

            return (
              <View 
                key={order.id} 
                style={[
                  styles.saleCard, 
                  { backgroundColor: isDarkMode ? '#2E2E38' : '#1C2434' },
                  isCancelled && { opacity: 0.6 }
                ]}
              >
                {/* Top Info row */}
                <View style={styles.cardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Feather name="shopping-bag" size={14} color="#FFE082" />
                    <Text style={styles.orderIdText}>Pedido #{shortId}</Text>
                  </View>
                  <View style={styles.badgeContainer}>
                    {isCancelled ? (
                      <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,82,82,0.15)' }]}>
                        <Text style={[styles.statusBadgeText, { color: '#FF5252' }]}>Cancelado</Text>
                      </View>
                    ) : (
                      <View style={[styles.statusBadge, { backgroundColor: 'rgba(0,230,118,0.15)' }]}>
                        <Text style={[styles.statusBadgeText, { color: '#00E676' }]}>Concluído</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Client and payment method details */}
                <View style={styles.cardInfoGrid}>
                  <View style={styles.infoCol}>
                    <Text style={styles.colHeader}>Cliente</Text>
                    <Text style={styles.colVal} numberOfLines={1}>{clientName}</Text>
                  </View>
                  <View style={[styles.infoCol, { alignItems: 'center' }]}>
                    <Text style={styles.colHeader}>Forma de Pagamento</Text>
                    {getPaymentDisplay(order.payment_method)}
                  </View>
                  <View style={[styles.infoCol, { alignItems: 'flex-end' }]}>
                    <Text style={styles.colHeader}>Total da Venda</Text>
                    <Text style={styles.totalValText}>{formatCurrency(order.total ?? 0)}</Text>
                  </View>
                </View>

                {/* Action Buttons row */}
                <View style={styles.actionRow}>
                  {/* Ver detalhes (Always active) */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.actionBtn, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
                    onPress={() => navigation.navigate('AdminOrderDetailScreen', { order })}
                  >
                    <Feather name="eye" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.actionBtnText}>Ver Detalhes</Text>
                  </TouchableOpacity>

                  {/* Edit payment (Disabled if cancelled) */}
                  {!isCancelled && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[styles.actionBtn, { backgroundColor: 'rgba(255, 224, 130, 0.15)' }]}
                      onPress={() => handleEditPaymentMethod(order)}
                    >
                      <Feather name="edit" size={14} color="#FFE082" style={{ marginRight: 4 }} />
                      <Text style={[styles.actionBtnText, { color: '#FFE082' }]}>Mudar Pgto</Text>
                    </TouchableOpacity>
                  )}

                  {/* Cancel Order (Disabled if cancelled) */}
                  {!isCancelled && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[styles.actionBtn, { backgroundColor: 'rgba(255, 82, 82, 0.15)' }]}
                      onPress={() => handleCancelOrder(order)}
                    >
                      <Feather name="trash-2" size={14} color="#FF5252" style={{ marginRight: 4 }} />
                      <Text style={[styles.actionBtnText, { color: '#FF5252' }]}>Cancelar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ========== FIXO: BOTÃO VOLTAR (SEMPRE VISÍVEL NO RODAPÉ CENTRALIZADO E ELEVADO) ========== */}
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: Platform.OS === 'ios' ? 110 : 90,
        backgroundColor: isDarkMode ? '#1E1E24' : '#ECECEC',
        borderTopWidth: 1,
        borderTopColor: isDarkMode ? '#3E3E4A' : '#D2D2D2',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 25 : 15,
      }}>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#2D8CE5',
            paddingVertical: 12,
            paddingHorizontal: 32,
            borderRadius: 25,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 4,
          }}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="caret-back" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#FFFFFF' }}>Painel de vendas</Text>
        </TouchableOpacity>
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
    paddingBottom: Platform.OS === 'ios' ? 145 : 125, // espaço para botão voltar fixo elevado
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#767676',
    textAlign: 'center',
    marginTop: 20,
  },

  // Caixa Card top component
  caixaCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  caixaTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caixaTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#A8A8B3',
    marginBottom: 4,
  },
  caixaValue: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  pulseContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    zIndex: 2,
  },
  pulseRing: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2.5,
    opacity: 0.45,
  },
  caixaDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 14,
  },
  caixaSubGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  caixaSubItem: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  caixaSubLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A8A8B3',
    flex: 1,
  },
  caixaSubValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Double Filter styling
  filterSectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    zIndex: 10,
    gap: 8,
  },
  filterLeftRow: {
    flex: 1,
  },
  filterRightRow: {
    flex: 1,
    alignItems: 'flex-end',
  },
  originFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 42,
    width: '100%',
  },
  originFilterText: {
    fontSize: 12.5,
    fontWeight: 'bold',
    flex: 1,
  },
  filterCountBadge: {
    backgroundColor: '#FF5C00',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  filterCountText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  filterBtn: {
    width: 170, // Sized identically to Sales History Screen
    height: 42,
    justifyContent: 'center',
  },
  filterBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },

  // Sale card redesign styling
  saleCard: {
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    paddingBottom: 8,
    marginBottom: 10,
  },
  orderIdText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFE082',
  },
  badgeContainer: {},
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  cardInfoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 4,
  },
  infoCol: {
    flex: 1,
  },
  colHeader: {
    fontSize: 10,
    color: '#A8A8B3',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  colVal: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  totalValText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00E676',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  whiteModalContainer: {
    borderRadius: 20,
    padding: 24,
    width: '85%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  whiteModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  whiteModalDesc: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  whiteModalBtnConfirm: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  whiteModalBtnTextConfirm: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  modalSubsectionHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 6,
  },
  modalFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalFilterLabel: {
    fontSize: 14,
    flex: 1,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#A8A8B3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioChecked: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#25BE36',
  },
  checkboxSquare: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#A8A8B3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalUtilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginTop: 4,
  },
  utilityText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalConfirmBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontWeight: 'bold',
    fontSize: 14,
  },

  // Dynamic picker in-modal styles
  filterModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  filterModeTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  filterPeriodContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  rangeRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  datePickRow: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#E3E4EB',
  },
  datePickLabel: {
    fontSize: 10,
    color: '#767676',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  datePickVal: {
    fontSize: 13,
    fontWeight: 'bold',
  },

  // Bottom Bar
  /* istanbul ignore next */ tabBarOuter: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 24,
    left: 16,
    right: 16,
  },
  /* istanbul ignore next */ tabBarInner: {
    flexDirection: 'row',
    backgroundColor: '#E3E4EB',
    borderRadius: 30,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  /* istanbul ignore next */ tabSeparator: {
    width: 1,
    height: 49,
    backgroundColor: '#8A7268',
  },
  /* istanbul ignore next */ tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  /* istanbul ignore next */ iconBgInactive: {
    width: 51,
    height: 41,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
