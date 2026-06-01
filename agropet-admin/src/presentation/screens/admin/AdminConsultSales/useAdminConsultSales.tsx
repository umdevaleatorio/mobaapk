import React, { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Text,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../../../../data/datasources/supabase/client';
import { useTheme } from '../../../contexts/ThemeContext';
import { isHoliday } from '../../../../utils/shopHours';
import { useCaixaCalculations } from './hooks/useCaixaCalculations';
import { useOrderFilters } from './hooks/useOrderFilters';
import { useOrderMutations } from './hooks/useOrderMutations';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface CaixaTransaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  type: 'sangria' | 'suprimento';
  paymentMethod?: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix';
}

export function useAdminConsultSales() {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<CaixaTransaction[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);

  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isRange, setIsRange] = useState(false);
  const [hasFiltered, setHasFiltered] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  const [pulseAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  }, [pulseAnim]);

  const {
    originFilter, setOriginFilter,
    selectedPayMethods, setSelectedPayMethods,
    statusFilter, setStatusFilter,
    tempOriginFilter, setTempOriginFilter,
    tempPayMethods, setTempPayMethods,
    tempStatusFilter, setTempStatusFilter,
    filteredOrders,
    handleToggleTempPayMethod,
    handleApplyFilters: applyFiltersHook,
    prepareTempFilters,
  } = useOrderFilters(orders);

  const [prevStartDate, setPrevStartDate] = useState<Date>(new Date());
  const [prevEndDate, setPrevEndDate] = useState<Date>(new Date());
  const [prevIsRange, setPrevIsRange] = useState(false);
  const [prevHasFiltered, setPrevHasFiltered] = useState(true);

  const [showFilterOptionModal, setShowFilterOptionModal] = useState(false);
  const [showSundayHolidayModal, setShowSundayHolidayModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showPaymentEditModal, setShowPaymentEditModal] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const [pickerMode, setPickerMode] = useState<'single' | 'range_start' | 'range_end'>('single');
  const [showPicker, setShowPicker] = useState(false);

  const [localStartDate, setLocalStartDate] = useState<Date>(new Date());
  const [localEndDate, setLocalEndDate] = useState<Date>(new Date());

  const {
    totalCreditoGeral, totalDebitoGeral, totalPixGeral,
    totalDinheiroVendasGeral, totalDinheiroCaixaGeral,
    saldoTotalCaixaGeral, formatCurrency,
  } = useCaixaCalculations(allOrders, transactions);

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
          users (id, name, phone, rua, numero, bairro, cep),
          order_items (product_id, quantity, unit_price, products (name))
        `)
        .in('status', ['completed', 'cancelled'])
        .limit(100)
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

      const { data: ordersData, error: ordersError } = await query;
      if (ordersError) throw ordersError;
        
      setOrders(ordersData || []);
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      /* istanbul ignore next */ if (isLoaded) {
        fetchSales(false);
      }
    }, [isLoaded, isRange, startDate, endDate, hasFiltered])
  );

  const fetchCaixaData = async () => {
    try {
      const { data: allData, error: allErr } = await supabase
        .from('orders')
        .select('total, payment_method')
        .eq('status', 'completed');
      if (!allErr && allData) {
        setAllOrders(allData);
      }
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

  const { handleCancelOrder, confirmPaymentEdit } = useOrderMutations(
    setLoading,
    fetchSales,
    fetchCaixaData,
    selectedOrder,
    setSelectedOrder,
    setShowPaymentEditModal
  );

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (event.type === 'dismissed') return;

    if (selectedDate) {
      if (pickerMode === 'single') {
        const isSun = selectedDate.getDay() === 0;
        const isHol = isHoliday(selectedDate);
        if (isSun || isHol) {
          setShowSundayHolidayModal(true);
          return;
        }
        setPrevStartDate(startDate);
        setPrevEndDate(endDate);
        setPrevIsRange(isRange);
        setPrevHasFiltered(hasFiltered);
        setStartDate(selectedDate);
        setEndDate(selectedDate);
        setIsRange(false);
        setHasFiltered(true);
        setShowFilterOptionModal(false);
      } else if (pickerMode === 'range_start') {
        setLocalStartDate(selectedDate);
      } else {
        /* istanbul ignore next */
        if (pickerMode === 'range_end') {
          setLocalEndDate(selectedDate);
        }
      }
    }
  };

  const handleCloseSundayHolidayModal = () => {
    setShowSundayHolidayModal(false);
    setStartDate(prevStartDate);
    setEndDate(prevEndDate);
    setIsRange(prevIsRange);
    setHasFiltered(prevHasFiltered);
  };

  const getDynamicTitle = () => {
    if (!hasFiltered) return "Histórico:";
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
    if (diffDays === 0) return "Hoje:";
    if (diffDays === 1) return "Ontem:";
    if (diffDays === 2) return "Anteontem:";
    return "Neste dia:";
  };

  const getPaymentDisplay = (paymentMethod: string) => {
    switch (paymentMethod) {
      case 'pix': return <Text style={{ color: '#00BFA5', fontWeight: 'bold' }}>Pix</Text>;
      case 'cartao_credito': return <Text style={{ color: '#FF0000', fontWeight: 'bold' }}>Crédito</Text>;
      case 'cartao_debito': return <Text style={{ color: '#4CAF50', fontWeight: 'bold' }}>Débito</Text>;
      case 'dinheiro': return <Text style={{ color: isDarkMode ? '#00E676' : '#1B5E20', fontWeight: 'bold' }}>Dinheiro</Text>;
      default: return <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{paymentMethod}</Text>;
    }
  };

  const getPaymentDisplayPortuguese = (paymentMethod: string) => {
    switch (paymentMethod) {
      case 'pix': return 'Pix';
      case 'cartao_credito': return 'Cartão de Crédito';
      case 'cartao_debito': return 'Cartão de Débito';
      case 'dinheiro': return 'Dinheiro';
      default: return paymentMethod;
    }
  };

  const getPayMethodColor = (method: string) => {
    switch (method) {
      case 'dinheiro': return isDarkMode ? '#00E676' : '#1B5E20';
      case 'cartao_credito': return isDarkMode ? '#FF5252' : '#FF0000';
      case 'cartao_debito': return '#4CAF50';
      case 'pix': return '#00BFA5';
      default: return colors.textDark;
    }
  };

  const handleOpenFilterModal = () => {
    prepareTempFilters();
    setShowFilterModal(true);
  };

  const handleApplyFilters = () => {
    applyFiltersHook();
    setShowFilterModal(false);
  };

  const handleEditPaymentMethod = (order: any) => {
    setSelectedOrder(order);
    setShowPaymentEditModal(true);
  };

  return {
    colors, isDarkMode, navigation, loading, refreshing,
    orders, allOrders, transactions,
    startDate, setStartDate, endDate, setEndDate, isRange, setIsRange, hasFiltered, setHasFiltered, isLoaded, pulseAnim,
    originFilter, selectedPayMethods, statusFilter,
    tempOriginFilter, setTempOriginFilter,
    tempPayMethods, setTempPayMethods,
    tempStatusFilter, setTempStatusFilter,
    prevStartDate, setPrevStartDate,
    prevEndDate, setPrevEndDate,
    prevIsRange, setPrevIsRange,
    prevHasFiltered, setPrevHasFiltered,
    showFilterOptionModal, setShowFilterOptionModal,
    showSundayHolidayModal, setShowSundayHolidayModal,
    showFilterModal, setShowFilterModal,
    showPaymentEditModal, setShowPaymentEditModal,
    selectedOrder, setSelectedOrder,
    pickerMode, setPickerMode,
    showPicker, setShowPicker,
    localStartDate, setLocalStartDate,
    localEndDate, setLocalEndDate,
    totalCreditoGeral, totalDebitoGeral, totalPixGeral,
    totalDinheiroVendasGeral, totalDinheiroCaixaGeral,
    saldoTotalCaixaGeral,
    formatCurrency, getDynamicTitle, getSingleDayTitle,
    getPaymentDisplay, getPaymentDisplayPortuguese, getPayMethodColor,
    filteredOrders,
    fetchSales, fetchCaixaData, onRefresh,
    handleCancelOrder, handleEditPaymentMethod, confirmPaymentEdit,
    onChangeDate, handleCloseSundayHolidayModal,
    handleOpenFilterModal, handleToggleTempPayMethod, handleApplyFilters,
  };
}
