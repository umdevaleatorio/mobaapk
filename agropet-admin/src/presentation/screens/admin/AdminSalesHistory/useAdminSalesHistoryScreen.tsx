import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../../../data/datasources/supabase/client';
import { useTheme } from '../../../contexts/ThemeContext';
import { isHoliday } from '../../../../utils/shopHours';
import AsyncStorage from '@react-native-async-storage/async-storage';

function getFirstImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
    } catch (_) {}
  }
  return url;
}

export function useAdminSalesHistoryScreen() {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);

  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isRange, setIsRange] = useState(false);
  const [hasFiltered, setHasFiltered] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  const [prevStartDate, setPrevStartDate] = useState<Date>(new Date());
  const [prevEndDate, setPrevEndDate] = useState<Date>(new Date());
  const [prevIsRange, setPrevIsRange] = useState(false);
  const [prevHasFiltered, setPrevHasFiltered] = useState(true);

  const [showFilterOptionModal, setShowFilterOptionModal] = useState(false);
  const [showSundayHolidayModal, setShowSundayHolidayModal] = useState(false);
  const [pickerMode, setPickerMode] = useState<'single' | 'range_start' | 'range_end'>('single');
  const [showPicker, setShowPicker] = useState(false);
  const [localStartDate, setLocalStartDate] = useState<Date>(new Date());
  const [localEndDate, setLocalEndDate] = useState<Date>(new Date());

  const totalGeral = orders.reduce((acc, o) => acc + (o.total ?? 0), 0);
  const totalCredito = orders.reduce((acc, o) => acc + (o.payment_method === 'cartao_credito' ? (o.total ?? 0) : 0), 0);
  const totalDebito = orders.reduce((acc, o) => acc + (o.payment_method === 'cartao_debito' ? (o.total ?? 0) : 0), 0);
  const totalDinheiro = orders.reduce((acc, o) => acc + (o.payment_method === 'dinheiro' ? (o.total ?? 0) : 0), 0);
  const totalPix = orders.reduce((acc, o) => acc + (o.payment_method === 'pix' ? (o.total ?? 0) : 0), 0);

  const formatCurrency = (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`;

  useEffect(() => {
    const loadPersistedDates = async () => {
      try {
        const storedStart = await AsyncStorage.getItem('admin_history_startDate');
        const storedEnd = await AsyncStorage.getItem('admin_history_endDate');
        const storedIsRange = await AsyncStorage.getItem('admin_history_isRange');
        const storedHasFiltered = await AsyncStorage.getItem('admin_history_hasFiltered');
        if (storedStart) setStartDate(new Date(storedStart));
        if (storedEnd) setEndDate(new Date(storedEnd));
        if (storedIsRange) setIsRange(storedIsRange === 'true');
        if (storedHasFiltered) setHasFiltered(storedHasFiltered === 'true');
      } catch (error) {
        console.error('Error loading persisted history dates:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadPersistedDates();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('orders')
        .select(`*, users(id,name,phone,rua,numero,bairro,cep), order_items(product_id,quantity,unit_price,products(name,image_url))`)
        .eq('status', 'completed')
        .neq('delivery_address', 'Venda Física PDV')
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

      const { data, error } = await query;
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Erro ao buscar histórico de vendas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => { if (isLoaded) fetchSales(); });
    return unsubscribe;
  }, [navigation, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    const saveDates = async () => {
      try {
        await AsyncStorage.setItem('admin_history_startDate', startDate.toISOString());
        await AsyncStorage.setItem('admin_history_endDate', endDate.toISOString());
        await AsyncStorage.setItem('admin_history_isRange', String(isRange));
        await AsyncStorage.setItem('admin_history_hasFiltered', String(hasFiltered));
      } catch (error) {
        console.error('Error persisting history dates:', error);
      }
    };
    saveDates();
    fetchSales();
  }, [startDate, endDate, isRange, hasFiltered, isLoaded]);

  const onChangeDate = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (event.type === 'dismissed' || !selectedDate) return;

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
    } else if (pickerMode === 'range_end') {
      setLocalEndDate(selectedDate);
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
      const sd = startDate; const ed = endDate;
      if (sd.getDate() === ed.getDate() && sd.getMonth() === ed.getMonth() && sd.getFullYear() === ed.getFullYear()) return getSingleDayTitle(startDate);
      return "Neste período:";
    }
    return getSingleDayTitle(startDate);
  };

  const getSingleDayTitle = (selectedDate: Date) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const target = new Date(selectedDate); target.setHours(0, 0, 0, 0);
    const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Hoje:";
    if (diffDays === 1) return "Ontem:";
    if (diffDays === 2) return "Anteontem:";
    return "Neste dia:";
  };

  const getPaymentDisplay = (paymentMethod: string) => {
    switch(paymentMethod) {
      case 'pix': return <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#00BFA5', textAlign: 'center' }}>Pix</Text>;
      case 'cartao_credito': return <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#FF0000', textAlign: 'center' }}>Cartão/Crédito</Text>;
      case 'cartao_debito': return <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#4CAF50', textAlign: 'center' }}>Cartão/Débito</Text>;
      case 'dinheiro': return <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1B5E20', textAlign: 'center' }}>Dinheiro</Text>;
      default: return <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' }}>{paymentMethod}</Text>;
    }
  };

  const openFilterModal = () => {
    setLocalStartDate(startDate);
    setLocalEndDate(endDate);
    setShowFilterOptionModal(true);
  };

  const confirmRangeFilter = () => {
    let start = new Date(localStartDate);
    let end = new Date(localEndDate);
    if (start.getTime() > end.getTime()) { const t = start; start = end; end = t; }
    setPrevStartDate(startDate);
    setPrevEndDate(endDate);
    setPrevIsRange(isRange);
    setPrevHasFiltered(hasFiltered);
    setStartDate(start);
    setEndDate(end);
    setIsRange(true);
    setHasFiltered(true);
    setShowFilterOptionModal(false);
  };

  return {
    colors, isDarkMode, navigation,
    loading, orders, showFilterOptionModal, showSundayHolidayModal,
    showPicker, pickerMode, localStartDate, localEndDate,
    startDate, endDate, isRange, hasFiltered,
    totalGeral, totalCredito, totalDebito, totalDinheiro, totalPix,
    formatCurrency, getDynamicTitle, getPaymentDisplay, getFirstImageUrl,
    openFilterModal, setShowFilterOptionModal, setShowPicker, setPickerMode,
    setLocalStartDate, setLocalEndDate, confirmRangeFilter,
    onChangeDate, handleCloseSundayHolidayModal, setShowSundayHolidayModal,
  };
}
