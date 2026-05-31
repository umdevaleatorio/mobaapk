import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { supabase } from '../../../../data/datasources/supabase/client';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { useAdminDashboardStats } from './useAdminDashboardStats';
import { useAdminDashboardCharts } from './useAdminDashboardCharts';
import { useAdminDashboardPdv } from './useAdminDashboardPdv';

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Ração': ['ração', 'racao', 'dog chow', 'pedigree', 'besser', 'purina', 'whiskas', 'granplus', 'premium', 'cão', 'cães', 'gato', 'gatos', 'vaca', 'porco'],
  'Pesca': ['pesca', 'vara', 'anzol', 'linha', 'molinete', 'boia', 'bóia', 'isca', 'carretilha'],
  'Sementes': ['semente', 'semeadura', 'sementes', 'girassol', 'milho', 'alpiste'],
  'Adubo': ['adubo', 'fertilizante', 'terra', 'substrato', 'humus', 'húmus', 'calpiso', 'calcario']
};

export function getFirstImageUrl(url: string | null | undefined): string | null {
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

export const isProductInCategories = (product: any, categories: string[]) => {
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

export interface CaixaTransaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  type?: 'sangria' | 'suprimento';
  paymentMethod?: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix';
}

export function useAdminDashboard() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<CaixaTransaction[]>([]);
  const [modalTransactionType, setModalTransactionType] = useState<'sangria' | 'suprimento'>('sangria');
  const [modalPaymentMethod, setModalPaymentMethod] = useState<'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix'>('dinheiro');
  const [rawAmount, setRawAmount] = useState<number>(0);
  const [formattedAmount, setFormattedAmount] = useState<string>('');
  const [transactionDesc, setTransactionDesc] = useState<string>('');
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showCashFlowFilterModal, setShowCashFlowFilterModal] = useState(false);
  const [cashFlowFilter, setCashFlowFilter] = useState<'all' | 'sangria' | 'suprimento'>('all');
  const [cashFlowStartDate, setCashFlowStartDate] = useState<Date | null>(null);
  const [cashFlowEndDate, setCashFlowEndDate] = useState<Date | null>(null);
  const [cashLocalFilter, setCashLocalFilter] = useState<'all' | 'sangria' | 'suprimento'>('all');
  const [cashLocalStartDate, setCashLocalStartDate] = useState<Date | null>(null);
  const [cashLocalEndDate, setCashLocalEndDate] = useState<Date | null>(null);

  const pdv = useAdminDashboardPdv(() => fetchDashboardData());
  const charts = useAdminDashboardCharts(orders);
  const stats = useAdminDashboardStats(orders, allOrders, transactions, cashFlowFilter, cashFlowStartDate, cashFlowEndDate);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('total, payment_method, status')
        .eq('status', 'completed');
      /* istanbul ignore next */
      if (!ordersError && ordersData) {
        setAllOrders(ordersData);
      }
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

  /* istanbul ignore next */
  const fetchSalesData = async (sDate: Date, eDate: Date, filtered: boolean) => {
    try {
      setLoading(true);
      let query = supabase
        .from('orders')
        .select('id, created_at, total, payment_method')
        .eq('status', 'completed')
        .order('created_at', { ascending: true });
      if (filtered) {
        const start = new Date(sDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(eDate);
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

  const loadSangrias = async () => {
    try {
      const stored = await SecureStore.getItemAsync('agropet_sangrias');
      if (stored) {
        const parsed: CaixaTransaction[] = JSON.parse(stored);
        const normalized = parsed.filter(t => (t.type as string) !== 'venda' && t.description !== 'Venda PDV' && t.description !== 'Venda PDV (Cancelada)');
        setTransactions(normalized);
      } else {
        setTransactions([]);
      }
    } catch (e) {
      console.error('Erro ao ler sangrias do SecureStore:', e);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchDashboardData();
      pdv.setDismissedProductIds(new Set());
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (!charts.isLoaded) return;
    const saveDates = async () => {
      try {
        await AsyncStorage.setItem('admin_dashboard_startDate', charts.startDate.toISOString());
        await AsyncStorage.setItem('admin_dashboard_endDate', charts.endDate.toISOString());
        await AsyncStorage.setItem('admin_dashboard_isRange', String(charts.isRange));
        await AsyncStorage.setItem('admin_dashboard_hasFiltered', String(charts.hasFiltered));
      } catch (error) {
        console.error('Error persisting dashboard dates:', error);
      }
    };
    saveDates();
    fetchSalesData(charts.startDate, charts.endDate, charts.hasFiltered);
    loadSangrias();
  }, [charts.startDate, charts.endDate, charts.isRange, charts.hasFiltered, charts.isLoaded]);

  const onChangeDate = (event: any, selectedDate?: Date) => {
    charts.setShowPicker(false);
    if (event?.type === 'dismissed') return;
    if (!selectedDate) return;
    if (charts.pickerMode === 'cash_range_start') {
      setCashLocalStartDate(selectedDate);
    } else if (charts.pickerMode === 'cash_range_end') {
      setCashLocalEndDate(selectedDate);
    } else {
      charts.handleChartDateSelect(charts.pickerMode, selectedDate);
    }
  };

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

  const { handleChartDateSelect: _, ...chartsRest } = charts;

  return {
    loading,
    ...chartsRest,
    ...stats,
    ...pdv,
    orders, allOrders, transactions,
    showTransactionModal, setShowTransactionModal,
    showCashFlowFilterModal, setShowCashFlowFilterModal,
    cashFlowFilter, setCashFlowFilter,
    cashFlowStartDate, setCashFlowStartDate,
    cashFlowEndDate, setCashFlowEndDate,
    cashLocalFilter, setCashLocalFilter,
    cashLocalStartDate, setCashLocalStartDate,
    cashLocalEndDate, setCashLocalEndDate,
    modalTransactionType, setModalTransactionType,
    modalPaymentMethod, setModalPaymentMethod,
    rawAmount, setRawAmount,
    formattedAmount, setFormattedAmount,
    transactionDesc, setTransactionDesc,
    fetchDashboardData,
    onChangeDate,
    handleAmountChange,
    handleSaveTransaction,
  };
}
