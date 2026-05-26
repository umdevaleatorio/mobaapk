import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  Modal,
  TextInput,
  Alert,
  Image,
  Animated,
  BackHandler,
} from 'react-native';
import AdminHeader from '../../components/AdminHeader';
import { AdminUserMenu } from '../../components/AdminUserMenu';
import { supabase } from '../../../data/datasources/supabase/client';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../contexts/ThemeContext';
import { isHoliday } from '../../../utils/shopHours';

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
import { Feather, Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Rect, Line, G, Text as SvgText } from 'react-native-svg';

// Bottom Bar Icons (Sem aba selecionada para paridade)
import HomeIcon8 from '../../assets/tela5/barra de baixo/Home.svg';
import MapIcon8 from '../../assets/tela5/barra de baixo/Map.svg';
import ManageIcon8 from '../../assets/tela2/barra/Manage.svg';
import GearIcon8 from '../../assets/tela5/barra de baixo/Gear.svg';
import MenuLabel8 from '../../assets/tela5/barra de baixo/Menu.svg';
import MapaLabel8 from '../../assets/tela5/barra de baixo/Mapa.svg';
import GerenciarLabel8 from '../../assets/tela2/barra/Gerenciar.svg';
import OpcoesLabel8 from '../../assets/tela5/barra de baixo/Opções.svg';

// Seta para seleção de data
import FundoBtnFiltro from '../../assets/tela6/selecionar data/Fundo.svg';
import SetaBaixo from '../../assets/tela6/selecionar data/Upside Down.svg';
import CheckIcon from '../../assets/tela7/registrar/Adicionar/Remover/Check.svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Ração': ['ração', 'racao', 'dog chow', 'pedigree', 'besser', 'purina', 'whiskas', 'granplus', 'premium', 'cão', 'cães', 'gato', 'gatos', 'vaca', 'porco'],
  'Pesca': ['pesca', 'vara', 'anzol', 'linha', 'molinete', 'boia', 'bóia', 'isca', 'carretilha'],
  'Sementes': ['semente', 'semeadura', 'sementes', 'girassol', 'milho', 'alpiste'],
  'Adubo': ['adubo', 'fertilizante', 'terra', 'substrato', 'humus', 'húmus', 'calpiso', 'calcario']
};

const isProductInCategories = (product: any, categories: string[]) => {
  if (categories.length === 0) return true;

  const name = (product.name || '').toLowerCase();
  const description = (product.description || '').toLowerCase();

  return categories.some(category => {
    const keywords = CATEGORY_KEYWORDS[category] || [];
    return keywords.some(keyword =>
      name.includes(keyword.toLowerCase()) ||
      description.includes(keyword.toLowerCase())
    );
  });
};

interface CaixaTransaction {
  id: string;
  amount: number;
  description: string;
  date: string; // ISO Date String
  type?: 'sangria' | 'suprimento';
  paymentMethod?: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix';
}

export default function AdminDashboardScreen() {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);

  // Date selection states
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isRange, setIsRange] = useState(false);
  const [hasFiltered, setHasFiltered] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // Backup states for Sundays/Holidays automatic reversion
  const [prevStartDate, setPrevStartDate] = useState<Date>(new Date());
  const [prevEndDate, setPrevEndDate] = useState<Date>(new Date());
  const [prevIsRange, setPrevIsRange] = useState(false);
  const [prevHasFiltered, setPrevHasFiltered] = useState(true);

  // Modals visibility
  const [showFilterOptionModal, setShowFilterOptionModal] = useState(false);
  const [showSundayHolidayModal, setShowSundayHolidayModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showCashFlowFilterModal, setShowCashFlowFilterModal] = useState(false);
  const [cashFlowFilter, setCashFlowFilter] = useState<'all' | 'sangria' | 'suprimento'>('all');
  const [cashFlowStartDate, setCashFlowStartDate] = useState<Date | null>(null);
  const [cashFlowEndDate, setCashFlowEndDate] = useState<Date | null>(null);
  const [cashLocalFilter, setCashLocalFilter] = useState<'all' | 'sangria' | 'suprimento'>('all');
  const [cashLocalStartDate, setCashLocalStartDate] = useState<Date | null>(null);
  const [cashLocalEndDate, setCashLocalEndDate] = useState<Date | null>(null);

  // DatePicker flow states
  const [pickerMode, setPickerMode] = useState<'single' | 'range_start' | 'range_end' | 'cash_range_start' | 'cash_range_end'>('single');
  const [showPicker, setShowPicker] = useState(false);
  const [localStartDate, setLocalStartDate] = useState<Date>(new Date());
  const [localEndDate, setLocalEndDate] = useState<Date>(new Date());

  // Completed orders from Supabase
  const [orders, setOrders] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);

  // Caixa local ledger state
  const [transactions, setTransactions] = useState<CaixaTransaction[]>([]);

  // Transaction modal form state
  const [modalTransactionType, setModalTransactionType] = useState<'sangria' | 'suprimento'>('sangria');
  const [modalPaymentMethod, setModalPaymentMethod] = useState<'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix'>('dinheiro');
  const [rawAmount, setRawAmount] = useState<number>(0);
  const [formattedAmount, setFormattedAmount] = useState<string>('');
  const [transactionDesc, setTransactionDesc] = useState<string>('');

  // PDV (Ponto de Venda) States
  const [isPDVMode, setIsPDVMode] = useState(false);
  const [pdvSelectMode, setPdvSelectMode] = useState(false);
  const [pdvProducts, setPdvProducts] = useState<any[]>([]);
  const [pdvSearchText, setPdvSearchText] = useState('');
  const [pdvActiveCategories, setPdvActiveCategories] = useState<string[]>([]);
  const [pdvCart, setPdvCart] = useState<Record<string, { qty: number; checked: boolean }>>({});
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [dropdownExpanded, setDropdownExpanded] = useState(false);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix'>('dinheiro');
  const [pdvLoading, setPdvLoading] = useState(false);
  const [dismissedProductIds, setDismissedProductIds] = useState<Set<string>>(new Set());

  const dismissAlert = (id: string) => {
    setDismissedProductIds(prev => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
  };

  const [cancelOpacity] = useState(new Animated.Value(0));

  useEffect(() => {
    if (pdvSelectMode) {
      cancelOpacity.setValue(0);
      Animated.timing(cancelOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [pdvSelectMode]);

  // 1. Fetch sales, products for PDV, and load sangrias on mounts/refreshes
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1.1 Fetch Orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*, order_items( quantity, unit_price )')
        .eq('status', 'completed');

      if (!ordersError && ordersData) {
        setAllOrders(ordersData);
      }

      // 1.2 Load Local Transactions (Sangria/Suprimento)
      const storedTransactions = await SecureStore.getItemAsync('agropet_sangrias');
      if (storedTransactions) {
        const parsed: CaixaTransaction[] = JSON.parse(storedTransactions);
        const normalized = parsed.filter(t => (t.type as string) !== 'venda' && t.description !== 'Venda PDV' && t.description !== 'Venda PDV (Cancelada)');
        setTransactions(normalized);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.log('Error fetching dashboard data:', err);
    }
    setLoading(false);
  };

  const fetchPdvProducts = async () => {
    setPdvLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('active', true)
      .order('name', { ascending: true });

    if (!error && data) {
      setPdvProducts(data);
    }
    setPdvLoading(false);
  };

  React.useLayoutEffect(() => {
    const display = isPDVMode ? 'none' : 'flex';
    navigation.setOptions({ tabBarStyle: { display } });
    navigation.getParent()?.setOptions({ tabBarStyle: { display } });
  }, [isPDVMode, navigation]);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (isPDVMode) {
          setIsPDVMode(false);
          setPdvSelectMode(false);
          setPdvCart({});
          return true;
        }
        return false;
      };

      if (BackHandler && BackHandler.addEventListener) {
        const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => {
          if (subscription && subscription.remove) {
            subscription.remove();
          } else if ((BackHandler as any).removeEventListener) {
            (BackHandler as any).removeEventListener('hardwareBackPress', onBackPress);
          }
        };
      }
    }, [isPDVMode])
  );

  // Load persisted dates from AsyncStorage on mount
  useEffect(() => {
    const loadPersistedDates = async () => {
      try {
        const storedStart = await AsyncStorage.getItem('admin_dashboard_startDate');
        const storedEnd = await AsyncStorage.getItem('admin_dashboard_endDate');
        const storedIsRange = await AsyncStorage.getItem('admin_dashboard_isRange');
        const storedHasFiltered = await AsyncStorage.getItem('admin_dashboard_hasFiltered');

        if (storedStart) setStartDate(new Date(storedStart));
        if (storedEnd) setEndDate(new Date(storedEnd));
        if (storedIsRange) setIsRange(storedIsRange === 'true');
        if (storedHasFiltered) setHasFiltered(storedHasFiltered === 'true');
      } catch (error) {
        console.error('Error loading persisted dashboard dates:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadPersistedDates();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchDashboardData();
      setDismissedProductIds(new Set());
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (isPDVMode && pdvProducts.length === 0) {
      fetchPdvProducts();
    }
  }, [isPDVMode]);

  useEffect(() => {
    if (!isLoaded) return;

    const saveDates = async () => {
      try {
        await AsyncStorage.setItem('admin_dashboard_startDate', startDate.toISOString());
        await AsyncStorage.setItem('admin_dashboard_endDate', endDate.toISOString());
        await AsyncStorage.setItem('admin_dashboard_isRange', String(isRange));
        await AsyncStorage.setItem('admin_dashboard_hasFiltered', String(hasFiltered));
      } catch (error) {
        console.error('Error persisting dashboard dates:', error);
      }
    };
    saveDates();

    fetchSalesData();
    loadSangrias();
  }, [startDate, endDate, isRange, hasFiltered, isLoaded]);

  const loadSangrias = async () => {
    try {
      const stored = await SecureStore.getItemAsync('agropet_sangrias');
      if (stored) {
        setTransactions(JSON.parse(stored));
      } else {
        setTransactions([]);
      }
    } catch (e) {
      console.error('Erro ao ler sangrias do SecureStore:', e);
    }
  };

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('orders')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: true }); // ascending to plot in order on chart!

      if (hasFiltered) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query = query.gte('created_at', start.toISOString()).lte('created_at', end.toISOString());
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        query = query.gte('created_at', today.toISOString()).lte('created_at', end.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      setOrders(data || []);

      // Fetch all completed orders for Caixa
      const { data: allData, error: allErr } = await supabase
        .from('orders')
        .select('total, payment_method')
        .eq('status', 'completed');
      if (allErr) throw allErr;
      setAllOrders(allData || []);
    } catch (error) {
      console.error('Erro ao buscar dados do painel:', error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Transaction math & filters
  const activeTransactions = transactions.filter((t) => {
    // Date Filter
    if (cashFlowStartDate && cashFlowEndDate) {
      const start = new Date(cashFlowStartDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(cashFlowEndDate);
      end.setHours(23, 59, 59, 999);

      const tDate = new Date(t.date);
      if (tDate.getTime() < start.getTime() || tDate.getTime() > end.getTime()) {
        return false;
      }
    }
    // Type Filter
    if (cashFlowFilter !== 'all') {
      if ((t.type || 'sangria') !== cashFlowFilter) {
        return false;
      }
    }
    return true;
  });

  // Helper to calculate total value given paymentMethod and type
  const getTransactionSum = (method: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix', type: 'sangria' | 'suprimento') => {
    return transactions.reduce((acc, t) => {
      if (t.description === 'Venda PDV') return acc;
      const isMatch = (t.paymentMethod || 'dinheiro') === method && (t.type || 'sangria') === type;
      return acc + (isMatch ? t.amount : 0);
    }, 0);
  };

  // Lifetime Caixa calculations (ignoring date filter)
  const totalCreditoGeral = allOrders.reduce((acc, o) => acc + (o.payment_method === 'cartao_credito' ? (o.total ?? 0) : 0), 0) + getTransactionSum('cartao_credito', 'suprimento') - getTransactionSum('cartao_credito', 'sangria');
  const totalDebitoGeral = allOrders.reduce((acc, o) => acc + (o.payment_method === 'cartao_debito' ? (o.total ?? 0) : 0), 0) + getTransactionSum('cartao_debito', 'suprimento') - getTransactionSum('cartao_debito', 'sangria');
  const totalPixGeral = allOrders.reduce((acc, o) => acc + (o.payment_method === 'pix' ? (o.total ?? 0) : 0), 0) + getTransactionSum('pix', 'suprimento') - getTransactionSum('pix', 'sangria');
  const totalDinheiroVendasGeral = allOrders.reduce((acc, o) => acc + (o.payment_method === 'dinheiro' ? (o.total ?? 0) : 0), 0);

  // Dinheiro pós-sangria/suprimento geral (can go negative!)
  const totalDinheiroCaixaGeral = totalDinheiroVendasGeral + getTransactionSum('dinheiro', 'suprimento') - getTransactionSum('dinheiro', 'sangria');

  // Saldo total do caixa geral
  const saldoTotalCaixaGeral = totalCreditoGeral + totalDebitoGeral + totalPixGeral + totalDinheiroCaixaGeral;

  // Key metrics (Filtered by active dates)
  const volumeVendas = orders.length;
  const ticketMedio = volumeVendas > 0 ? (orders.reduce((acc, o) => acc + (o.total ?? 0), 0) / volumeVendas) : 0;

  // Determine top payment method
  const getTopPaymentMethod = () => {
    if (volumeVendas === 0) return 'Nenhum';
    const counts = { credito: 0, debito: 0, pix: 0, dinheiro: 0 };
    orders.forEach(o => {
      if (o.payment_method === 'cartao_credito') counts.credito++;
      else if (o.payment_method === 'cartao_debito') counts.debito++;
      else if (o.payment_method === 'pix') counts.pix++;
      else if (o.payment_method === 'dinheiro') counts.dinheiro++;
    });
    const maxVal = Math.max(counts.credito, counts.debito, counts.pix, counts.dinheiro);
    if (maxVal === 0) return 'Nenhum';
    if (maxVal === counts.pix) return 'Pix 📱';
    if (maxVal === counts.dinheiro) return 'Dinheiro 💵';
    if (maxVal === counts.credito) return 'Crédito 💳';
    return 'Débito 💳';
  };

  const topMethod = getTopPaymentMethod();

  // Helper formats
  const formatCurrency = (val: number) => {
    return `R$ ${val.toFixed(2).replace('.', ',')}`;
  };

  // Date change handler
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
      } else if (pickerMode === 'range_end') {
        setLocalEndDate(selectedDate);
      } else if (pickerMode === 'cash_range_start') {
        setCashLocalStartDate(selectedDate);
      } else if (pickerMode === 'cash_range_end') {
        setCashLocalEndDate(selectedDate);
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
    if (!hasFiltered) return "Ganhos:";
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
      return "No Período:";
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

  // Sangria input mask handler
  const handleAmountChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '');
    if (clean === '') {
      setRawAmount(0);
      setFormattedAmount('');
      return;
    }
    const val = parseInt(clean, 10) / 100;
    setRawAmount(val);
    setFormattedAmount(
      val.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      })
    );
  };

  const handleSaveTransaction = async () => {
    if (rawAmount <= 0) {
      Alert.alert('Valor Inválido', 'Por favor, insira um valor maior que R$ 0,00.');
      return;
    }
    if (!transactionDesc.trim()) {
      Alert.alert('Descrição Obrigatória', `Por favor, preencha o motivo d${modalTransactionType === 'sangria' ? 'a sangria' : 'o suprimento'}.`);
      return;
    }

    const newTransaction: CaixaTransaction = {
      id: Math.random().toString(36).substr(2, 9),
      amount: rawAmount,
      description: transactionDesc.trim(),
      date: new Date().toISOString(),
      type: modalTransactionType,
      paymentMethod: modalPaymentMethod,
    };

    const updatedLedger = [newTransaction, ...transactions];
    try {
      await SecureStore.setItemAsync('agropet_sangrias', JSON.stringify(updatedLedger));
      setTransactions(updatedLedger);
      setShowTransactionModal(false);
      setRawAmount(0);
      setFormattedAmount('');
      setTransactionDesc('');
      Alert.alert('Sucesso!', `${modalTransactionType === 'sangria' ? 'Sangria' : 'Suprimento'} realizad${modalTransactionType === 'sangria' ? 'a' : 'o'} e caixa atualizado!`);
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', `Não foi possível salvar a transação no dispositivo.`);
    }
  };

  // PDV Helpers
  const togglePdvCart = (item: any) => {
    setPdvCart(prev => {
      const newCart = { ...prev };
      if (!newCart[item.id]) {
        newCart[item.id] = { qty: 1, checked: true };
      } else {
        newCart[item.id].checked = !newCart[item.id].checked;
      }
      return newCart;
    });
  };

  const updatePdvCartQty = (id: string, delta: number) => {
    setPdvCart(prev => {
      const newCart = { ...prev };
      if (!newCart[id]) {
        newCart[id] = { qty: Math.max(1, delta), checked: true };
      } else {
        newCart[id].qty = Math.max(1, newCart[id].qty + delta);
      }
      return newCart;
    });
  };

  const handleConfirmPdvSale = async () => {
    const selectedItems = pdvProducts.filter(p => pdvCart[p.id]?.checked);
    if (selectedItems.length === 0) return;

    for (const item of selectedItems) {
      if (item.stock < pdvCart[item.id].qty) {
        Alert.alert('Erro', `Estoque insuficiente para ${item.name}. (Disponível: ${item.stock})`);
        return;
      }
    }

    setPdvLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || null;

      let totalVenda = 0;
      for (const item of selectedItems) {
        totalVenda += pdvCart[item.id].qty * item.price;
      }

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          status: 'completed',
          payment_method: checkoutPaymentMethod,
          delivery_type: 'retirada',
          delivery_address: 'Venda Física PDV',
          total: totalVenda
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderId = orderData.id;

      for (const item of selectedItems) {
        const qty = pdvCart[item.id].qty;

        await supabase.from('order_items').insert({
          order_id: orderId,
          product_id: item.id,
          quantity: qty,
          unit_price: item.price
        });

        await supabase.from('products')
          .update({ stock: item.stock - qty })
          .eq('id', item.id);
      }

      Alert.alert('Sucesso', 'Venda registrada com sucesso!');
      setIsPDVMode(false);
      setPdvSelectMode(false);
      setPdvCart({});
      setShowCheckoutModal(false);
      fetchDashboardData();
    } catch (err: any) {
      Alert.alert('Erro', 'Ocorreu um erro ao registrar a venda.');
      console.log(err);
    }
    setPdvLoading(false);
  };

  // 3. Dynamic SVG Bezier Chart Math
  const generateChartPoints = () => {
    const GRAPH_WIDTH = SCREEN_WIDTH - 32;
    const GRAPH_HEIGHT = 180;
    const paddingLeft = 35;
    const paddingRight = 15;
    const paddingTop = 20;
    const paddingBottom = 20;

    const chartWidth = GRAPH_WIDTH - paddingLeft - paddingRight;
    const chartHeight = GRAPH_HEIGHT - paddingTop - paddingBottom;

    if (!isRange || startDate.getTime() === endDate.getTime()) {
      // Dia Único view: Plot completed orders by 2-hour segments (08:00 to 18:00)
      const slots = [
        { label: '08h', sales: 0 },
        { label: '10h', sales: 0 },
        { label: '12h', sales: 0 },
        { label: '14h', sales: 0 },
        { label: '16h', sales: 0 },
        { label: '18h', sales: 0 },
      ];

      orders.forEach((o) => {
        const orderHour = new Date(o.created_at).getHours();
        if (orderHour < 9) slots[0].sales += o.total ?? 0;
        else if (orderHour < 11) slots[1].sales += o.total ?? 0;
        else if (orderHour < 13) slots[2].sales += o.total ?? 0;
        else if (orderHour < 15) slots[3].sales += o.total ?? 0;
        else if (orderHour < 17) slots[4].sales += o.total ?? 0;
        else slots[5].sales += o.total ?? 0;
      });

      const maxVal = Math.max(...slots.map((s) => s.sales), 100);

      const points = slots.map((s, idx) => {
        const x = paddingLeft + (idx / (slots.length - 1)) * chartWidth;
        const y = GRAPH_HEIGHT - paddingBottom - (s.sales / maxVal) * chartHeight;
        return { x, y, label: s.label, value: s.sales };
      });

      return { points, maxVal, width: GRAPH_WIDTH, height: GRAPH_HEIGHT, paddingBottom, paddingLeft };
    } else {
      // Period/Range view: Plot sales grouped by date
      const daysCount = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // Group sales by day
      const daySales: Record<string, number> = {};

      // Initialize slots
      for (let i = 0; i < Math.min(daysCount, 10); i++) {
        const current = new Date(startDate);
        current.setDate(startDate.getDate() + i);
        const key = current.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        daySales[key] = 0;
      }

      orders.forEach((o) => {
        const key = new Date(o.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        if (daySales[key] !== undefined) {
          daySales[key] += o.total ?? 0;
        } else {
          // Fallback just in case
          daySales[key] = o.total ?? 0;
        }
      });

      const keys = Object.keys(daySales);
      const maxVal = Math.max(...Object.values(daySales), 100);

      const points = keys.map((k, idx) => {
        const x = paddingLeft + (idx / (keys.length - 1)) * chartWidth;
        const y = GRAPH_HEIGHT - paddingBottom - (daySales[k] / maxVal) * chartHeight;
        return { x, y, label: k, value: daySales[k] };
      });

      return { points, maxVal, width: GRAPH_WIDTH, height: GRAPH_HEIGHT, paddingBottom, paddingLeft };
    }
  };

  const { points, maxVal, width: gWidth, height: gHeight, paddingBottom, paddingLeft } = generateChartPoints();

  // Create Bezier Path D and Fill D
  let pathD = '';
  let areaD = '';
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];
      const cpX1 = p0.x + (p1.x - p0.x) / 3;
      const cpY1 = p0.y;
      const cpX2 = p0.x + 2 * (p1.x - p0.x) / 3;
      const cpY2 = p1.y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    // Fill Area under the Bezier Curve
    areaD = pathD + ` L ${points[points.length - 1].x} ${gHeight - paddingBottom} L ${points[0].x} ${gHeight - paddingBottom} Z`;
  }

  const iconColorInactive = isDarkMode ? '#FFFFFF' : undefined;

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.white }]}>
      <AdminHeader title="painel_vendas" />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isPDVMode && {
            paddingBottom: Platform.OS === 'ios' ? 160 : 140
          }
        ]}
        showsVerticalScrollIndicator={false}
      >

        {/* ========== SISTEMA DE CAIXA E PDV ========== */}
        {!isPDVMode ? (
          <>
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

            {/* ========== BOTOES DE SUPRIMENTO E SANGRIA ========== */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.sangriaTriggerBtn, { backgroundColor: '#2D8CE5', borderColor: '#2D8CE5', marginBottom: 12 }]}
              onPress={() => {
                navigation.navigate('AdminConsultSalesScreen');
              }}
            >
              <Feather name="list" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={[styles.sangriaTriggerText, { color: '#FFFFFF' }]}>
                Ver Vendas
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.sangriaTriggerBtn, { backgroundColor: '#FF5C00', borderColor: '#FF5C00', marginBottom: 12 }]}
              onPress={() => {
                setIsPDVMode(true);
                setDismissedProductIds(new Set());
              }}
            >
              <Feather name="shopping-cart" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={[styles.sangriaTriggerText, { color: '#FFFFFF' }]}>
                Registrar Venda
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.sangriaTriggerBtn, { backgroundColor: isDarkMode ? '#1E1E24' : '#E8F5E9', borderColor: isDarkMode ? '#3E3E4A' : '#C8E6C9', marginBottom: 12 }]}
              onPress={() => {
                setModalTransactionType('suprimento');
                setShowTransactionModal(true);
              }}
            >
              <Feather name="plus-circle" size={20} color="#4CAF50" style={{ marginRight: 8 }} />
              <Text style={[styles.sangriaTriggerText, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>
                Realizar Suprimento (Entrada de Caixa)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.sangriaTriggerBtn, { backgroundColor: isDarkMode ? '#1E1E24' : '#FFEBEE', borderColor: isDarkMode ? '#3E3E4A' : '#FFCDD2', marginBottom: 20 }]}
              onPress={() => {
                setModalTransactionType('sangria');
                setShowTransactionModal(true);
              }}
            >
              <Feather name="minus-circle" size={20} color="#FF3B30" style={{ marginRight: 8 }} />
              <Text style={[styles.sangriaTriggerText, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>
                Realizar Sangria (Retirada de Caixa)
              </Text>
            </TouchableOpacity>

            {/* Title Row with Date Picker Button (Moved here below Sangria and before Curves!) */}
            <View style={styles.filterRow}>
              <Text style={{
                fontSize: isDarkMode ? 30 : 25,
                fontWeight: 'bold',
                color: isDarkMode ? '#FFFFFF' : '#1C2434',
                flex: 1.2,
              }}>
                {getDynamicTitle()}
              </Text>

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
                      fontSize: isRange ? 11 : 14,
                      fontWeight: 'bold',
                      color: isDarkMode ? '#FFFFFF' : '#1C2434',
                      textAlign: 'center',
                      flex: 1
                    }}>
                      {isRange
                        ? `${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`
                        : startDate.toLocaleDateString('pt-BR')
                      }
                    </Text>
                  ) : (
                    <Text style={{
                      fontSize: 14,
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

            {/* ========== GRÁFICO DE DESEMPENHO (Bezier Curves SVG) ========== */}
            <View style={styles.graphContainer}>
              <Text style={[styles.graphTitle, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>
                Curva de Desempenho de Vendas
              </Text>

              {loading ? (
                <View style={{ height: 180, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color="#F97D01" />
                </View>
              ) : points.length === 0 ? (
                <View style={{ height: 180, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: isDarkMode ? '#A8A8B3' : '#767676' }}>Sem transações para plotar.</Text>
                </View>
              ) : (
                <View style={[styles.svgWrapper, { backgroundColor: isDarkMode ? '#2E2E38' : '#F5F6FA', borderColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]}>
                  <Svg width={gWidth} height={gHeight}>
                    <Defs>
                      <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#00BFA5" stopOpacity="0.4" />
                        <Stop offset="1" stopColor="#00BFA5" stopOpacity="0.0" />
                      </LinearGradient>
                    </Defs>

                    {/* Y Axis Grid Lines */}
                    <Line x1={paddingLeft} y1={20} x2={gWidth - 15} y2={20} stroke={isDarkMode ? '#3E3E4A' : '#E3E4EB'} strokeWidth={1} strokeDasharray="3,3" />
                    <Line x1={paddingLeft} y1={80} x2={gWidth - 15} y2={80} stroke={isDarkMode ? '#3E3E4A' : '#E3E4EB'} strokeWidth={1} strokeDasharray="3,3" />
                    <Line x1={paddingLeft} y1={140} x2={gWidth - 15} y2={140} stroke={isDarkMode ? '#3E3E4A' : '#E3E4EB'} strokeWidth={1} strokeDasharray="3,3" />

                    {/* Area under bezier */}
                    {areaD ? <Path d={areaD} fill="url(#grad)" /> : null}

                    {/* Bezier Path Line */}
                    {pathD ? <Path d={pathD} fill="none" stroke="#00BFA5" strokeWidth={3} /> : null}

                    {/* Circle peaks & Labels */}
                    {points.map((p, idx) => (
                      <G key={idx}>
                        <Circle cx={p.x} cy={p.y} r={5} fill="#FFFFFF" stroke="#00BFA5" strokeWidth={2} />

                        {/* Value peak text on hover/rendered always if not crowded */}
                        {p.value > 0 && (
                          <SvgText
                            x={p.x}
                            y={p.y - 10}
                            fontSize="9"
                            fontWeight="bold"
                            fill={isDarkMode ? '#FFE082' : '#00BFA5'}
                            textAnchor="middle"
                          >
                            {`R$${Math.round(p.value)}`}
                          </SvgText>
                        )}

                        {/* X Axis label */}
                        <SvgText
                          x={p.x}
                          y={gHeight - 5}
                          fontSize="9"
                          fill={isDarkMode ? '#A8A8B3' : '#767676'}
                          textAnchor="middle"
                        >
                          {p.label}
                        </SvgText>
                      </G>
                    ))}

                    {/* Left Y Axis Labels */}
                    <SvgText x={8} y={23} fontSize="9" fill={isDarkMode ? '#A8A8B3' : '#767676'}>{`R$${Math.round(maxVal)}`}</SvgText>
                    <SvgText x={8} y={83} fontSize="9" fill={isDarkMode ? '#A8A8B3' : '#767676'}>{`R$${Math.round(maxVal / 2)}`}</SvgText>
                    <SvgText x={8} y={143} fontSize="9" fill={isDarkMode ? '#A8A8B3' : '#767676'}>R$0</SvgText>
                  </Svg>
                </View>
              )}
            </View>

            {/* ========== MÉTRICAS DE VENDAS ========== */}
            <View style={styles.metricsGrid}>
              <View style={[styles.metricCard, { backgroundColor: isDarkMode ? '#2E2E38' : '#F5F6FA', borderColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]}>
                <Text style={styles.metricLabel}>Ticket Médio</Text>
                <Text style={[styles.metricValue, { color: ticketMedio === 0 ? '#919191' : '#339914' }]}>
                  {formatCurrency(ticketMedio)}
                </Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: isDarkMode ? '#2E2E38' : '#F5F6FA', borderColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]}>
                <Text style={styles.metricLabel}>Qtd. Pedidos</Text>
                <Text style={[styles.metricValue, { color: volumeVendas === 0 ? '#FF5252' : (isDarkMode ? '#FFE082' : '#00BFA5') }]}>
                  {volumeVendas}
                </Text>
              </View>
              <View style={[styles.metricCard, { backgroundColor: isDarkMode ? '#2E2E38' : '#F5F6FA', borderColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]}>
                <Text style={styles.metricLabel}>Método Preferido</Text>
                <Text style={[styles.metricValue, { color: '#F97D01', fontSize: 13, marginTop: 6 }]}>
                  {topMethod}
                </Text>
              </View>
            </View>

            {/* ========== LEDGER HISTÓRICO DE CAIXA ========== */}
            <View style={styles.sangriaLedgerContainer}>
              <View style={styles.ledgerTitleRow}>
                <Text style={[styles.ledgerSectionTitle, { color: isDarkMode ? '#FFFFFF' : '#1C2434', marginBottom: 0 }]}>
                  Fluxo de Caixa no Período
                </Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.cashFlowFilterBtn, { backgroundColor: isDarkMode ? '#2E2E38' : '#F5F6FA', borderColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]}
                  onPress={() => {
                    setCashLocalFilter(cashFlowFilter);
                    setCashLocalStartDate(cashFlowStartDate);
                    setCashLocalEndDate(cashFlowEndDate);
                    setShowCashFlowFilterModal(true);
                  }}
                >
                  <Feather name="filter" size={14} color={isDarkMode ? '#FFE082' : '#F97D01'} style={{ marginRight: 6 }} />
                  <Text style={[styles.cashFlowFilterBtnText, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>
                    {cashFlowFilter === 'all' ? 'Ver tudo' : cashFlowFilter === 'sangria' ? 'Sangrias' : 'Suprimentos'}
                  </Text>
                  <Feather name="chevron-down" size={14} color={isDarkMode ? '#A8A8B3' : '#767676'} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>

              {activeTransactions.length === 0 ? (
                <Text style={[styles.emptyLedgerText, { color: isDarkMode ? '#A8A8B3' : '#767676' }]}>
                  Nenhuma movimentação realizada neste período.
                </Text>
              ) : (
                activeTransactions.map((t) => {
                  const isSangria = (t.type || 'sangria') === 'sangria';
                  const pMethod = t.paymentMethod || 'dinheiro';
                  let iconName: any = 'dollar-sign';
                  if (pMethod === 'pix') iconName = 'smartphone';
                  else if (pMethod === 'cartao_credito' || pMethod === 'cartao_debito') iconName = 'credit-card';

                  return (
                    <View key={t.id} style={[styles.ledgerRow, { backgroundColor: isDarkMode ? '#2E2E38' : '#F5F6FA', borderColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]}>
                      <View style={{ marginRight: 12, width: 36, height: 36, borderRadius: 18, backgroundColor: isSangria ? 'rgba(255, 59, 48, 0.1)' : 'rgba(76, 175, 80, 0.1)', justifyContent: 'center', alignItems: 'center' }}>
                        <Feather name={iconName} size={16} color={isSangria ? '#FF3B30' : '#4CAF50'} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.ledgerRowTitle, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>
                          {t.description}
                        </Text>
                        <Text style={styles.ledgerRowTime}>
                          {isSangria ? 'Sangria' : 'Suprimento'} • {new Date(t.date).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(t.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                      <View style={[styles.ledgerRowValueCard, { backgroundColor: isSangria ? 'rgba(255, 59, 48, 0.1)' : 'rgba(76, 175, 80, 0.1)' }]}>
                        <Text style={[styles.ledgerRowValueText, { color: isSangria ? '#FF3B30' : '#4CAF50' }]}>
                          {isSangria ? '-' : '+'} {formatCurrency(t.amount)}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </>
        ) : (
          <View style={{ flex: 1, paddingTop: 0, paddingBottom: 20 }}>
            {/* Search Bar no Topo */}
            <View style={{
              height: 40,
              backgroundColor: isDarkMode ? '#1E1E24' : '#F5F6FA',
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              borderRadius: 20,
              marginBottom: 16,
              marginTop: -6,
              width: '100%',
            }}>
              <Feather name="search" size={16} color={isDarkMode ? '#A8A8B3' : '#767676'} style={{ marginRight: 8 }} />
              <TextInput
                style={{
                  flex: 1,
                  color: isDarkMode ? '#FFFFFF' : '#1C2434',
                  fontSize: 14,
                  textAlign: 'left',
                  paddingVertical: 0,
                }}
                placeholder="Pesquisar produto..."
                placeholderTextColor={isDarkMode ? '#A8A8B3' : '#767676'}
                value={pdvSearchText}
                onChangeText={setPdvSearchText}
              />
            </View>

            {/* Filter Pill (Igual ManageProductsScreen) */}
            <View style={{ marginBottom: 16 }}>
              <View style={[{ backgroundColor: isDarkMode ? '#2E2E38' : '#E3E4EB', flexDirection: 'row', alignItems: 'center', borderRadius: 24, paddingVertical: 4, paddingHorizontal: 6, minHeight: 46 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 }}>
                  <Feather name="sliders" size={12} color={isDarkMode ? '#FFFFFF' : '#8A7268'} />
                  <Text style={{ fontSize: 12, fontWeight: 'bold', color: isDarkMode ? '#FFFFFF' : '#8A7268', marginLeft: 4 }}>Filtro</Text>
                </View>

                <View style={{ width: 1, height: 20, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#8A7268', marginHorizontal: 4 }} />

                <Text style={{ fontSize: 12, fontWeight: 'bold', color: isDarkMode ? '#FFFFFF' : '#8A7268', marginHorizontal: 8 }}>Categoria</Text>

                <View style={{ width: 1, height: 20, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#8A7268', marginHorizontal: 4 }} />

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4, gap: 8, alignItems: 'center' }}>
                  {['Ração', 'Pesca', 'Sementes', 'Adubo'].map(cat => {
                    const isSelected = pdvActiveCategories.includes(cat);
                    return (
                      <TouchableOpacity
                        key={cat}
                        activeOpacity={0.7}
                        onPress={() => setPdvActiveCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 20,
                          backgroundColor: isSelected ? (isDarkMode ? '#5B86E5' : '#E3DAD9') : 'transparent'
                        }}
                      >
                        <Text style={{
                          color: isSelected ? (isDarkMode ? '#FFFFFF' : '#9C3F07') : (isDarkMode ? '#FFFFFF' : '#8A7268'),
                          fontWeight: isSelected ? 'bold' : 'normal',
                          fontSize: 12
                        }}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>



            {/* Botões de Registrar / Cancelar */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16, width: '100%' }}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  backgroundColor: '#339914',
                  borderRadius: 15,
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  height: 46,
                }}
                onPress={() => {
                  if (!pdvSelectMode) {
                    setPdvSelectMode(true);
                  } else {
                    const selectedItems = pdvProducts.filter(p => pdvCart[p.id]?.checked);
                    if (selectedItems.length === 0) {
                      Alert.alert('Nenhum produto selecionado', 'Por favor, selecione pelo menos um produto com o checkbox para registrar.');
                      return;
                    }
                    setShowCheckoutModal(true);
                  }
                }}
              >
                <CheckIcon width={34} height={34} fill={isDarkMode ? '#FFFFFF' : undefined} stroke={isDarkMode ? '#FFFFFF' : undefined} />
                <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#FFFFFF', marginLeft: 4 }}>
                  Registrar venda
                </Text>
              </TouchableOpacity>

              {pdvSelectMode ? (
                <Animated.View style={{ flex: 1, opacity: cancelOpacity }}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={{
                      width: '100%',
                      backgroundColor: '#E3E4EB',
                      borderRadius: 15,
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 46,
                    }}
                    onPress={() => {
                      setPdvSelectMode(false);
                      setPdvCart({});
                    }}
                  >
                    <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#A72424' }}>
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              ) : (
                <View style={{ flex: 1 }} />
              )}
            </View>

            {/* Produtos List */}
            {pdvLoading ? (
              <ActivityIndicator size="large" color="#FF5C00" style={{ marginTop: 40 }} />
            ) : (
              pdvProducts
                .filter(p => {
                  const query = pdvSearchText.toLowerCase();
                  const nameMatches = (p.name || '').toLowerCase().includes(query);
                  const descMatches = (p.description || '').toLowerCase().includes(query);
                  return !pdvSearchText || nameMatches || descMatches;
                })
                .map(item => {
                  const inCart = pdvCart[item.id] || { qty: 1, checked: false };
                  const stock = item.stock || 0;
                  const stockColor = stock < 10 ? '#FF3B30' : (stock <= 29 ? '#FFE082' : '#00BFA5');

                  return (
                    <View key={item.id} style={{
                      flexDirection: 'column',
                      backgroundColor: isDarkMode ? '#2E2E38' : '#1C2434',
                      borderRadius: 15,
                      marginBottom: 15,
                      minHeight: 100,
                      justifyContent: 'center',
                      paddingHorizontal: 8,
                    }}>
                      <View style={{
                        flexDirection: 'row',
                        height: 100,
                        alignItems: 'center',
                        width: '100%',
                      }}>
                        {/* Coluna 1: Foto do produto */}
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                          <View style={{
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
                            overflow: 'hidden',
                          }}>
                            {item.image_url ? (
                              <Image source={{ uri: getFirstImageUrl(item.image_url) || '' }} style={{ width: 58, height: 58 }} resizeMode="contain" />
                            ) : (
                              <View style={{ width: 58, height: 58, backgroundColor: '#E0E0E0', borderRadius: 8 }} />
                            )}
                          </View>
                        </View>

                        {/* Separador 1 */}
                        <View style={{ width: 1, height: 100, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#F5F5F5' }} />

                        {/* Coluna 2: Nome do produto */}
                        <View style={{ flex: 1.2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', marginBottom: 4, marginTop: -4 }}>
                            Nome do{"\n"}produto
                          </Text>
                          <Text style={{ fontSize: 12, color: '#FFE082', fontWeight: 'bold', textAlign: 'center' }} numberOfLines={2}>
                            {item.name}
                          </Text>
                        </View>

                        {/* Separador 2 */}
                        <View style={{ width: 1, height: 100, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#F5F5F5' }} />

                        {/* Coluna 3: Estoque do produto */}
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', marginBottom: 4, marginTop: -4 }}>
                            Estoque
                          </Text>
                          <Text style={{ fontSize: 14, fontWeight: 'bold', color: stockColor, textAlign: 'center' }}>
                            {stock}
                          </Text>
                        </View>

                        {/* Separador 3 */}
                        <View style={{ width: 1, height: 100, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#F5F5F5' }} />

                        {/* Coluna 4: Ações (Quantidade + Checkbox se pdvSelectMode estiver ativo, senão apenas o valor) */}
                        <View style={{ flex: 1.2, alignItems: 'center', justifyContent: 'center' }}>
                          {!pdvSelectMode ? (
                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#00E676', textAlign: 'center' }}>
                              {formatCurrency(item.price)}
                            </Text>
                          ) : (
                            <>
                              {/* Valor em cima */}
                              <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#00E676', marginBottom: 4, textAlign: 'center' }}>
                                {formatCurrency(item.price * inCart.qty)}
                              </Text>

                              {/* Selecionar quantidade */}
                              <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: isDarkMode ? '#1E1E24' : 'rgba(255,255,255,0.15)',
                                borderRadius: 10,
                                padding: 3,
                                marginBottom: 6
                              }}>
                                <TouchableOpacity onPress={() => updatePdvCartQty(item.id, -1)} style={{ padding: 4 }}>
                                  <Feather name="minus" size={12} color="#FF3B30" />
                                </TouchableOpacity>
                                <Text style={{ marginHorizontal: 6, color: '#FFFFFF', fontWeight: 'bold', fontSize: 12, minWidth: 14, textAlign: 'center' }}>
                                  {inCart.qty}
                                </Text>
                                <TouchableOpacity onPress={() => updatePdvCartQty(item.id, 1)} style={{ padding: 4 }}>
                                  <Feather name="plus" size={12} color="#4CAF50" />
                                </TouchableOpacity>
                              </View>

                              {/* Checkbox embaixo */}
                              <TouchableOpacity onPress={() => togglePdvCart(item)} activeOpacity={0.7} style={{ padding: 2 }}>
                                <View style={{
                                  width: 20,
                                  height: 20,
                                  borderRadius: 6,
                                  borderWidth: 1.2,
                                  borderColor: '#A8A8B3',
                                  backgroundColor: inCart.checked ? '#00E676' : 'transparent',
                                  justifyContent: 'center',
                                  alignItems: 'center'
                                }}>
                                  {inCart.checked && <Feather name="check" size={13} color="#FFFFFF" />}
                                </View>
                              </TouchableOpacity>
                            </>
                          )}
                        </View>
                      </View>

                      {/* Warning alerts directly under the card row */}
                      {!dismissedProductIds.has(item.id) && (
                        stock < 10 ? (
                          <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            borderWidth: 1,
                            borderRadius: 10,
                            backgroundColor: 'rgba(255, 59, 48, 0.15)',
                            borderColor: '#FF3B30',
                            marginHorizontal: 8,
                            marginBottom: 8,
                            marginTop: 4,
                            position: 'relative',
                          }}>
                            <Feather name="alert-circle" size={14} color="#FF3B30" style={{ marginRight: 6 }} />
                            <Text style={{
                              fontSize: 11,
                              fontWeight: 'bold',
                              color: '#FF8A8A',
                              flexShrink: 1,
                              lineHeight: 15,
                              paddingRight: 16,
                            }}>
                              {`${item.name} está esgotando, adicione mais ao estoque para manter ativo ou espere acabar para auto-desativação.`}
                            </Text>
                            <TouchableOpacity
                              onPress={() => dismissAlert(item.id)}
                              style={{
                                position: 'absolute',
                                right: 8,
                                top: 8,
                                padding: 2,
                              }}
                            >
                              <Feather name="x" size={14} color="#FF8A8A" />
                            </TouchableOpacity>
                          </View>
                        ) : stock <= 29 ? (
                          <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            borderWidth: 1,
                            borderRadius: 10,
                            backgroundColor: 'rgba(255, 179, 0, 0.15)',
                            borderColor: '#FFB300',
                            marginHorizontal: 8,
                            marginBottom: 8,
                            marginTop: 4,
                            position: 'relative',
                          }}>
                            <Feather name="alert-triangle" size={14} color="#FFB300" style={{ marginRight: 6 }} />
                            <Text style={{
                              fontSize: 11,
                              fontWeight: 'bold',
                              color: '#FFE082',
                              flexShrink: 1,
                              lineHeight: 15,
                              paddingRight: 16,
                            }}>
                              {`${item.name} está com estoque moderado (${stock} unidades). Considere reabastecer em breve.`}
                            </Text>
                            <TouchableOpacity
                              onPress={() => dismissAlert(item.id)}
                              style={{
                                position: 'absolute',
                                right: 8,
                                top: 8,
                                padding: 2,
                              }}
                            >
                              <Feather name="x" size={14} color="#FFE082" />
                            </TouchableOpacity>
                          </View>
                        ) : null
                      )}
                    </View>
                  );
                })
            )}
          </View>
        )}
      </ScrollView>

      {/* ========== MODAL: CHECKOUT PDV ========== */}
      <Modal visible={showCheckoutModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.whiteModalContainer, { backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF', width: SCREEN_WIDTH * 0.95, maxHeight: '85%' }]}>
            <Text style={[styles.whiteModalTitle, { color: isDarkMode ? '#FFFFFF' : '#1C2434', marginBottom: 16 }]}>
              Resumo da venda
            </Text>

            <Text style={[styles.inputHeading, { color: isDarkMode ? '#FFFFFF' : '#1C2434', marginBottom: 8 }]}>
              Forma de Pagamento:
            </Text>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: isDarkMode ? '#3E3E4A' : '#E3E4EB',
                backgroundColor: isDarkMode ? '#1E1E24' : '#F5F6FA',
                marginBottom: 12,
              }}
              onPress={() => setDropdownExpanded(!dropdownExpanded)}
              activeOpacity={0.7}
            >
              <Text style={{
                fontSize: 14,
                fontWeight: 'bold',
                color: checkoutPaymentMethod === 'dinheiro'
                  ? (isDarkMode ? '#00E676' : '#1b5e20')
                  : checkoutPaymentMethod === 'cartao_credito'
                    ? '#A72424'
                    : checkoutPaymentMethod === 'cartao_debito'
                      ? '#4CAF50'
                      : '#00BFA5',
              }}>
                {checkoutPaymentMethod === 'dinheiro' ? 'Dinheiro' :
                  checkoutPaymentMethod === 'cartao_credito' ? 'Cartão de Crédito' :
                    checkoutPaymentMethod === 'cartao_debito' ? 'Débito' : 'Pix'}
              </Text>
              <Feather name={dropdownExpanded ? "chevron-up" : "chevron-down"} size={16} color={isDarkMode ? '#FFFFFF' : '#1C2434'} />
            </TouchableOpacity>

            {dropdownExpanded && (
              <View style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: isDarkMode ? '#3E3E4A' : '#E3E4EB',
                backgroundColor: isDarkMode ? '#1E1E24' : '#F5F6FA',
                padding: 6,
                marginBottom: 16,
                gap: 4
              }}>
                {(['dinheiro', 'cartao_credito', 'cartao_debito', 'pix'] as const).map((method) => {
                  const isSelected = checkoutPaymentMethod === method;
                  const label = method === 'dinheiro' ? 'Dinheiro' :
                    method === 'cartao_credito' ? 'Cartão de Crédito' :
                      method === 'cartao_debito' ? 'Débito' : 'Pix';
                  const textColor = method === 'dinheiro'
                    ? (isDarkMode ? '#00E676' : '#1b5e20')
                    : method === 'cartao_credito'
                      ? '#A72424'
                      : method === 'cartao_debito'
                        ? '#4CAF50'
                        : '#00BFA5';

                  return (
                    <TouchableOpacity
                      key={method}
                      activeOpacity={0.7}
                      onPress={() => {
                        setCheckoutPaymentMethod(method);
                        setDropdownExpanded(false);
                      }}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        borderRadius: 8,
                        backgroundColor: isSelected ? (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'transparent',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: 'bold', color: textColor }}>
                        {label}
                      </Text>
                      {isSelected && <Feather name="check" size={16} color={textColor} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <Text style={[styles.inputHeading, { color: isDarkMode ? '#FFFFFF' : '#1C2434', marginBottom: 8 }]}>
              Produtos:
            </Text>
            <ScrollView style={{ maxHeight: 260, marginBottom: 16 }}>
              {pdvProducts.filter(p => pdvCart[p.id]?.checked).map(item => {
                const qty = pdvCart[item.id].qty;
                return (
                  <View key={item.id} style={{
                    flexDirection: 'row',
                    backgroundColor: isDarkMode ? '#2E2E38' : '#1C2434',
                    borderRadius: 15,
                    marginBottom: 12,
                    height: 100,
                    alignItems: 'center',
                    paddingHorizontal: 8,
                  }}>
                    {/* Coluna 1: Foto do produto */}
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <View style={{
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
                        overflow: 'hidden',
                      }}>
                        {item.image_url ? (
                          <Image source={{ uri: getFirstImageUrl(item.image_url) || '' }} style={{ width: 58, height: 58 }} resizeMode="contain" />
                        ) : (
                          <View style={{ width: 58, height: 58, backgroundColor: '#E0E0E0', borderRadius: 8 }} />
                        )}
                      </View>
                    </View>

                    {/* Separador 1 */}
                    <View style={{ width: 1, height: 100, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#F5F5F5' }} />

                    {/* Coluna 2: Nome do produto */}
                    <View style={{ flex: 1.2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', marginBottom: 4, marginTop: -4 }}>
                        Nome do{"\n"}produto
                      </Text>
                      <Text style={{ fontSize: 12, color: '#FFE082', fontWeight: 'bold', textAlign: 'center' }} numberOfLines={2}>
                        {item.name}
                      </Text>
                    </View>

                    {/* Separador 2 */}
                    <View style={{ width: 1, height: 100, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#F5F5F5' }} />

                    {/* Coluna 3: Quantidade selecionada */}
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', marginBottom: 4, marginTop: -4 }}>
                        Qtd
                      </Text>
                      <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#00E676', textAlign: 'center' }}>
                        {qty}
                      </Text>
                    </View>

                    {/* Separador 3 */}
                    <View style={{ width: 1, height: 100, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#F5F5F5' }} />

                    {/* Coluna 4: Valor Total do produto */}
                    <View style={{ flex: 1.2, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', marginBottom: 4, marginTop: -4 }}>
                        Total
                      </Text>
                      <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' }}>
                        {formatCurrency(item.price * qty)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
              paddingHorizontal: 8,
            }}>
              <Text style={{ color: '#00BFA5', fontSize: 16, fontWeight: 'bold' }}>
                Total da Venda:
              </Text>
              <Text style={{ color: '#00BFA5', fontSize: 22, fontWeight: 'bold' }}>
                {formatCurrency(pdvProducts.filter(p => pdvCart[p.id]?.checked).reduce((acc, curr) => acc + (curr.price * pdvCart[curr.id].qty), 0))}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#E3E4EB',
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: 'center'
                }}
                onPress={() => {
                  setShowCheckoutModal(false);
                  setDropdownExpanded(false);
                }}
              >
                <Text style={{ color: '#A72424', fontWeight: 'bold', fontSize: 15 }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  backgroundColor: '#25BE36',
                  paddingVertical: 14,
                  borderRadius: 12,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center'
                }}
                onPress={handleConfirmPdvSale}
                disabled={pdvLoading}
              >
                {pdvLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 }}>Confirmar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========== MODAL: FILTRO FLUXO DE CAIXA ========== */}
      <Modal visible={showCashFlowFilterModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCashFlowFilterModal(false)}
        >
          <TouchableOpacity activeOpacity={1} style={[styles.cashFlowModalContainer, { backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF' }]}>
            <Text style={[styles.cashFlowModalTitle, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>Filtrar Fluxo de Caixa</Text>

            {(['all', 'sangria', 'suprimento'] as const).map((option) => {
              const label = option === 'all' ? 'Ver tudo' : option === 'sangria' ? 'Sangrias' : 'Suprimentos';
              const icon = option === 'all' ? 'list' : option === 'sangria' ? 'minus-circle' : 'plus-circle';
              const iconColor = option === 'all' ? (isDarkMode ? '#FFE082' : '#F97D01') : option === 'sangria' ? '#FF3B30' : '#4CAF50';
              const isSelected = cashLocalFilter === option;

              return (
                <TouchableOpacity
                  key={option}
                  activeOpacity={0.7}
                  style={[
                    styles.cashFlowOption,
                    {
                      backgroundColor: isSelected
                        ? (isDarkMode ? 'rgba(255, 224, 130, 0.15)' : 'rgba(249, 125, 1, 0.1)')
                        : 'transparent',
                      borderColor: isSelected
                        ? (isDarkMode ? '#FFE082' : '#F97D01')
                        : (isDarkMode ? '#3E3E4A' : '#E3E4EB'),
                    },
                  ]}
                  onPress={() => setCashLocalFilter(option)}
                >
                  <Feather name={icon} size={18} color={iconColor} style={{ marginRight: 10 }} />
                  <Text style={[styles.cashFlowOptionText, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>{label}</Text>
                  {isSelected && (
                    <Feather name="check" size={18} color={isDarkMode ? '#FFE082' : '#F97D01'} style={{ marginLeft: 'auto' }} />
                  )}
                </TouchableOpacity>
              );
            })}

            <View style={[styles.filterPeriodContainer, { borderColor: isDarkMode ? '#3E3E4A' : '#E3E4EB', marginTop: 12 }]}>
              <Text style={[styles.filterModeTitle, { color: colors.textDark, marginBottom: 12 }]}>
                Período Personalizado
              </Text>
              <View style={styles.rangeRowContainer}>
                {/* Botão Data Início */}
                <TouchableOpacity
                  style={[styles.datePickRow, { backgroundColor: isDarkMode ? '#1E1E24' : '#F5F6FA' }]}
                  activeOpacity={0.7}
                  onPress={() => {
                    setPickerMode('cash_range_start');
                    setShowPicker(true);
                  }}
                >
                  <Text style={styles.datePickLabel}>Início</Text>
                  <Text style={[styles.datePickVal, { color: colors.textDark }]}>
                    {cashLocalStartDate ? cashLocalStartDate.toLocaleDateString('pt-BR') : '--/--/----'}
                  </Text>
                </TouchableOpacity>

                <Feather name="arrow-right" size={16} color={isDarkMode ? '#FFFFFF' : '#1C2434'} style={{ alignSelf: 'center' }} />

                {/* Botão Data Fim */}
                <TouchableOpacity
                  style={[styles.datePickRow, { backgroundColor: isDarkMode ? '#1E1E24' : '#F5F6FA' }]}
                  activeOpacity={0.7}
                  onPress={() => {
                    setPickerMode('cash_range_end');
                    setShowPicker(true);
                  }}
                >
                  <Text style={styles.datePickLabel}>Fim</Text>
                  <Text style={[styles.datePickVal, { color: colors.textDark }]}>
                    {cashLocalEndDate ? cashLocalEndDate.toLocaleDateString('pt-BR') : '--/--/----'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, alignItems: 'center' }}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setShowCashFlowFilterModal(false)}
                style={{ marginRight: 20 }}
              >
                <Text style={{ color: '#FF3B30', fontWeight: 'bold' }}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.whiteModalBtnConfirm, { backgroundColor: '#25BE36', paddingHorizontal: 20 }]}
                activeOpacity={0.7}
                onPress={() => {
                  if (cashLocalStartDate && cashLocalEndDate) {
                    let start = new Date(cashLocalStartDate);
                    let end = new Date(cashLocalEndDate);
                    if (start.getTime() > end.getTime()) {
                      const t = start; start = end; end = t;
                    }
                    setCashFlowStartDate(start);
                    setCashFlowEndDate(end);
                  } else {
                    setCashFlowStartDate(null);
                    setCashFlowEndDate(null);
                  }
                  setCashFlowFilter(cashLocalFilter);
                  setShowCashFlowFilterModal(false);
                }}
              >
                <Text style={styles.whiteModalBtnTextConfirm}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ========== DATE PICKERS ========== */}
      {showPicker && (
        <DateTimePicker
          value={
            pickerMode === 'range_end' ? endDate :
              pickerMode === 'range_start' ? startDate :
                pickerMode === 'cash_range_start' ? (cashLocalStartDate || new Date()) :
                  pickerMode === 'cash_range_end' ? (cashLocalEndDate || new Date()) :
                    startDate
          }
          mode="date"
          display="default"
          onChange={onChangeDate}
          themeVariant={isDarkMode ? 'dark' : 'light'}
        />
      )}

      {/* ========== MODAL: OPÇÕES DE FILTRO ========== */}
      <Modal visible={showFilterOptionModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.whiteModalContainer, { backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF' }]}>
            <Text style={[styles.whiteModalTitle, { color: colors.textDark }]}>
              Filtrar Dashboard
            </Text>
            <Text style={[styles.whiteModalDesc, { color: isDarkMode ? '#A8A8B3' : '#767676' }]}>
              Escolha como deseja consultar os ganhos da loja:
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
                <Feather name="calendar" size={20} color="#F97D01" style={{ marginRight: 10 }} />
                <View>
                  <Text style={[styles.filterModeTitle, { color: colors.textDark }]}>Dia Único</Text>
                  <Text style={{ fontSize: 12, color: isDarkMode ? '#A8A8B3' : '#767676' }}>
                    Consultar ganhos de uma data específica
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

      {/* ========== MODAL: DOMINGO E FERIADO REVERSION ========== */}
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
              Este dia foi domingo/feriado, portanto seus ganhos foram 0.
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

      {/* ========== MODAL: TRANSAÇÃO (SANGRIA / SUPRIMENTO) ========== */}
      <Modal visible={showTransactionModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.whiteModalContainer, { backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF', width: SCREEN_WIDTH * 0.9 }]}>
            <Text style={[styles.whiteModalTitle, { color: colors.textDark, textAlign: 'left', marginBottom: 8 }]}>
              {modalTransactionType === 'sangria' ? 'Realizar Sangria' : 'Realizar Suprimento'}
            </Text>
            <Text style={[styles.whiteModalDesc, { color: isDarkMode ? '#A8A8B3' : '#767676', textAlign: 'left', marginBottom: 16 }]}>
              {modalTransactionType === 'sangria'
                ? 'Retirada de dinheiro do caixa da loja para despesas.'
                : 'Entrada extra de dinheiro no caixa da loja.'}
            </Text>

            <Text style={[styles.inputHeading, { color: colors.textDark }]}>Meio de Pagamento:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {(['dinheiro', 'pix', 'cartao_credito', 'cartao_debito'] as const).map((method) => {
                const isSelected = modalPaymentMethod === method;
                const labels = {
                  dinheiro: 'Dinheiro',
                  pix: 'Pix',
                  cartao_credito: 'Crédito',
                  cartao_debito: 'Débito'
                };
                return (
                  <TouchableOpacity
                    key={method}
                    activeOpacity={0.7}
                    onPress={() => setModalPaymentMethod(method)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: isSelected ? (modalTransactionType === 'sangria' ? '#FF3B30' : '#4CAF50') : (isDarkMode ? '#3E3E4A' : '#E3E4EB'),
                      backgroundColor: isSelected
                        ? (modalTransactionType === 'sangria' ? 'rgba(255, 59, 48, 0.1)' : 'rgba(76, 175, 80, 0.1)')
                        : (isDarkMode ? '#1E1E24' : '#F5F6FA'),
                    }}
                  >
                    <Text style={{
                      fontSize: 12,
                      fontWeight: 'bold',
                      color: isSelected ? (modalTransactionType === 'sangria' ? '#FF3B30' : '#4CAF50') : (isDarkMode ? '#A8A8B3' : '#767676')
                    }}>
                      {labels[method]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.inputHeading, { color: colors.textDark }]}>Valor da {modalTransactionType === 'sangria' ? 'Retirada' : 'Entrada'}:</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: isDarkMode ? '#1E1E24' : '#F5F6FA', color: colors.textDark }]}
              placeholder="R$ 0,00"
              placeholderTextColor={isDarkMode ? '#767676' : '#A8A8B3'}
              keyboardType="numeric"
              value={formattedAmount}
              onChangeText={handleAmountChange}
            />

            <Text style={[styles.inputHeading, { color: colors.textDark, marginTop: 12 }]}>Motivo / Descrição:</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: isDarkMode ? '#1E1E24' : '#F5F6FA', color: colors.textDark }]}
              placeholder={modalTransactionType === 'sangria' ? "Ex: Conta de água, Luz..." : "Ex: Troco inicial..."}
              placeholderTextColor={isDarkMode ? '#767676' : '#A8A8B3'}
              value={transactionDesc}
              onChangeText={setTransactionDesc}
              maxLength={40}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, gap: 12 }}>
              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: isDarkMode ? '#3E3E4A' : '#E0E0E0', flex: 1 }]}
                activeOpacity={0.7}
                onPress={() => {
                  setShowTransactionModal(false);
                  setRawAmount(0);
                  setFormattedAmount('');
                  setTransactionDesc('');
                }}
              >
                <Text style={[styles.modalActionBtnText, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalActionBtn, { backgroundColor: modalTransactionType === 'sangria' ? '#FF3B30' : '#4CAF50', flex: 1 }]}
                activeOpacity={0.7}
                onPress={handleSaveTransaction}
              >
                <Text style={[styles.modalActionBtnText, { color: '#FFFFFF' }]}>
                  Confirmar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========== BARRA INFERIOR INATIVA (PARIDADE) ========== */}
      {!isPDVMode && (
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
      )}

      {/* ========== FIXO: BOTÃO VOLTAR PDV (SEMPRE VISÍVEL NO RODAPÉ CENTRALIZADO E ELEVADO) ========== */}
      {isPDVMode && (
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
            onPress={() => setIsPDVMode(false)}
            activeOpacity={0.8}
          >
            <Ionicons name="caret-back" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#FFFFFF' }}>Painel de vendas</Text>
          </TouchableOpacity>
        </View>
      )}

      <AdminUserMenu />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 120, // Bottom space for tab bar
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 10,
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

  // top caixa card styles
  caixaCard: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  caixaTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caixaTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.75)',
  },
  caixaValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  pulseContainer: {
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00E676',
    zIndex: 2,
  },
  pulseRing: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#00E676',
    opacity: 0.4,
  },
  caixaDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 12,
  },
  caixaSubGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  caixaSubItem: {
    flex: 1,
    alignItems: 'center',
  },
  caixaSubLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginVertical: 2,
  },
  caixaSubValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Sangria trigger button styles
  sangriaTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sangriaTriggerText: {
    fontSize: 13,
    fontWeight: 'bold',
  },

  // Graph Area styles
  graphContainer: {
    marginBottom: 20,
  },
  graphTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  svgWrapper: {
    borderRadius: 18,
    padding: 8,
    borderWidth: 1,
    alignItems: 'center',
  },

  // metrics section styles
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  metricLabel: {
    fontSize: 10,
    color: '#767676',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
    textAlign: 'center',
  },

  // Sangria Ledger ledger styles
  sangriaLedgerContainer: {
    marginBottom: 10,
  },
  ledgerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ledgerSectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  cashFlowFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  cashFlowFilterBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  cashFlowModalContainer: {
    width: SCREEN_WIDTH * 0.75,
    borderRadius: 18,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  cashFlowModalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 14,
  },
  cashFlowOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  cashFlowOptionText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyLedgerText: {
    fontSize: 12,
    textAlign: 'center',
    marginVertical: 15,
  },
  ledgerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  ledgerRowTitle: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  ledgerRowTime: {
    fontSize: 10,
    color: '#767676',
    marginTop: 2,
  },
  ledgerRowValueCard: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ledgerRowValueText: {
    color: '#FF3B30',
    fontWeight: 'bold',
    fontSize: 12,
  },

  // Modal overlays & structures
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  whiteModalContainer: {
    width: SCREEN_WIDTH * 0.85,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  whiteModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  whiteModalDesc: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  filterModeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  filterModeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  filterPeriodContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  rangeRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  datePickRow: {
    flex: 1.2,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  datePickLabel: {
    fontSize: 9,
    color: '#767676',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  datePickVal: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  whiteModalBtnConfirm: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whiteModalBtnTextConfirm: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },

  // Sangria input custom modal styles
  inputHeading: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  modalInput: {
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalActionBtn: {
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalActionBtnText: {
    fontWeight: 'bold',
    fontSize: 14,
  },

  // Bottom Tab Bar
  tabBarOuter: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 24,
    left: 16,
    right: 16,
  },
  tabBarInner: {
    flexDirection: 'row',
    borderRadius: 30,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabSeparator: {
    width: 1,
    height: 49,
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
