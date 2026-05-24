import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import AdminHeader from '../../components/AdminHeader';
import { AdminUserMenu } from '../../components/AdminUserMenu';
import { supabase } from '../../../data/datasources/supabase/client';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../contexts/ThemeContext';
import { isHoliday } from '../../../utils/shopHours';
import { Feather } from '@expo/vector-icons';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Sangria {
  id: string;
  amount: number;
  description: string;
  date: string; // ISO Date String
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

  // Backup states for Sundays/Holidays automatic reversion
  const [prevStartDate, setPrevStartDate] = useState<Date>(new Date());
  const [prevEndDate, setPrevEndDate] = useState<Date>(new Date());
  const [prevIsRange, setPrevIsRange] = useState(false);
  const [prevHasFiltered, setPrevHasFiltered] = useState(true);

  // Modals visibility
  const [showFilterOptionModal, setShowFilterOptionModal] = useState(false);
  const [showSundayHolidayModal, setShowSundayHolidayModal] = useState(false);
  const [showSangriaModal, setShowSangriaModal] = useState(false);

  // DatePicker flow states
  const [pickerMode, setPickerMode] = useState<'single' | 'range_start' | 'range_end'>('single');
  const [showPicker, setShowPicker] = useState(false);
  const [localStartDate, setLocalStartDate] = useState<Date>(new Date());
  const [localEndDate, setLocalEndDate] = useState<Date>(new Date());

  // Completed orders from Supabase
  const [orders, setOrders] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);

  // Sangrias local ledger state
  const [sangrias, setSangrias] = useState<Sangria[]>([]);

  // Sangria modal form state
  const [rawAmount, setRawAmount] = useState<number>(0);
  const [formattedAmount, setFormattedAmount] = useState<string>('');
  const [sangriaDesc, setSangriaDesc] = useState<string>('');

  // 1. Fetch sales and load sangrias on mounts/refreshes
  useEffect(() => {
    fetchSalesData();
    loadSangrias();
  }, [startDate, endDate, isRange, hasFiltered]);

  const loadSangrias = async () => {
    try {
      const stored = await SecureStore.getItemAsync('agropet_sangrias');
      if (stored) {
        setSangrias(JSON.parse(stored));
      } else {
        setSangrias([]);
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
        today.setHours(0,0,0,0);
        const end = new Date();
        end.setHours(23,59,59,999);
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

  // 2. Sangria math & filters
  const getSangriasInPeriod = () => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return sangrias.filter((s) => {
      const sDate = new Date(s.date);
      return sDate.getTime() >= start.getTime() && sDate.getTime() <= end.getTime();
    });
  };

  const activeSangrias = getSangriasInPeriod();
  const totalSangrado = activeSangrias.reduce((acc, s) => acc + s.amount, 0);

  // Lifetime Caixa calculations (ignoring date filter)
  const totalSangradoGeral = sangrias.reduce((acc, s) => acc + s.amount, 0);
  const totalCreditoGeral = allOrders.reduce((acc, o) => acc + (o.payment_method === 'cartao_credito' ? (o.total ?? 0) : 0), 0);
  const totalDebitoGeral = allOrders.reduce((acc, o) => acc + (o.payment_method === 'cartao_debito' ? (o.total ?? 0) : 0), 0);
  const totalPixGeral = allOrders.reduce((acc, o) => acc + (o.payment_method === 'pix' ? (o.total ?? 0) : 0), 0);
  const totalDinheiroVendasGeral = allOrders.reduce((acc, o) => acc + (o.payment_method === 'dinheiro' ? (o.total ?? 0) : 0), 0);

  // Dinheiro pós-sangria geral (can go negative!)
  const totalDinheiroCaixaGeral = totalDinheiroVendasGeral - totalSangradoGeral;
  
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

  const handleSaveSangria = async () => {
    if (rawAmount <= 0) {
      Alert.alert('Valor Inválido', 'Por favor, insira um valor maior que R$ 0,00.');
      return;
    }
    if (!sangriaDesc.trim()) {
      Alert.alert('Descrição Obrigatória', 'Por favor, preencha o motivo da sangria.');
      return;
    }

    // Physical sanity check: Removed by user request so that cash balance can go negative

    const newSangria: Sangria = {
      id: Math.random().toString(36).substr(2, 9),
      amount: rawAmount,
      description: sangriaDesc.trim(),
      date: new Date().toISOString(),
    };

    const updatedLedger = [newSangria, ...sangrias];
    try {
      await SecureStore.setItemAsync('agropet_sangrias', JSON.stringify(updatedLedger));
      setSangrias(updatedLedger);
      setShowSangriaModal(false);
      setRawAmount(0);
      setFormattedAmount('');
      setSangriaDesc('');
      Alert.alert('Sucesso!', 'Sangria realizada e caixa atualizado!');
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Não foi possível salvar a sangria no dispositivo.');
    }
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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* ========== SISTEMA DE CAIXA (Topo da Tela) ========== */}
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

        {/* ========== SISTEMA DE SANGRIA (Botão de Retirada) ========== */}
        <TouchableOpacity 
          activeOpacity={0.8}
          style={[styles.sangriaTriggerBtn, { backgroundColor: isDarkMode ? '#1E1E24' : '#E3E4EB', borderColor: isDarkMode ? '#3E3E4A' : '#D0D1D9' }]}
          onPress={() => setShowSangriaModal(true)}
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
            <Text style={[styles.metricValue, { color: '#339914' }]}>
              {formatCurrency(ticketMedio)}
            </Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: isDarkMode ? '#2E2E38' : '#F5F6FA', borderColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]}>
            <Text style={styles.metricLabel}>Qtd. Pedidos</Text>
            <Text style={[styles.metricValue, { color: isDarkMode ? '#FFE082' : '#00BFA5' }]}>
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

        {/* ========== LEDGER HISTÓRICO DE SANGRIA ========== */}
        <View style={styles.sangriaLedgerContainer}>
          <Text style={[styles.ledgerSectionTitle, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>
            Fluxo de Sangrias no Período
          </Text>

          {activeSangrias.length === 0 ? (
            <Text style={[styles.emptyLedgerText, { color: isDarkMode ? '#A8A8B3' : '#767676' }]}>
              Nenhuma sangria realizada neste período.
            </Text>
          ) : (
            activeSangrias.map((s) => (
              <View key={s.id} style={[styles.ledgerRow, { backgroundColor: isDarkMode ? '#2E2E38' : '#F5F6FA', borderColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.ledgerRowTitle, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>
                    {s.description}
                  </Text>
                  <Text style={styles.ledgerRowTime}>
                    {new Date(s.date).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(s.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <View style={styles.ledgerRowValueCard}>
                  <Text style={styles.ledgerRowValueText}>- {formatCurrency(s.amount)}</Text>
                </View>
              </View>
            ))
          )}
        </View>

      </ScrollView>

      {/* ========== DATE PICKERS ========== */}
      {showPicker && (
        <DateTimePicker
          value={pickerMode === 'range_end' ? endDate : startDate}
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

      {/* ========== MODAL: REALIZAR SANGRIA ========== */}
      <Modal visible={showSangriaModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.whiteModalContainer, { backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF', width: SCREEN_WIDTH * 0.9 }]}>
            <Text style={[styles.whiteModalTitle, { color: colors.textDark, textAlign: 'left', marginBottom: 8 }]}>
              Realizar Sangria
            </Text>
            <Text style={[styles.whiteModalDesc, { color: isDarkMode ? '#A8A8B3' : '#767676', textAlign: 'left', marginBottom: 20 }]}>
              Retirada de dinheiro físico (Papel-Moeda) do caixa da loja para despesas.
            </Text>

            <Text style={[styles.inputHeading, { color: colors.textDark }]}>Valor da Retirada:</Text>
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
              placeholder="Ex: Conta de água, Luz, Aluguel..."
              placeholderTextColor={isDarkMode ? '#767676' : '#A8A8B3'}
              value={sangriaDesc}
              onChangeText={setSangriaDesc}
              maxLength={40}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, gap: 12 }}>
              <TouchableOpacity 
                style={[styles.modalActionBtn, { backgroundColor: isDarkMode ? '#3E3E4A' : '#E0E0E0', flex: 1 }]}
                activeOpacity={0.7}
                onPress={() => {
                  setShowSangriaModal(false);
                  setRawAmount(0);
                  setFormattedAmount('');
                  setSangriaDesc('');
                }}
              >
                <Text style={[styles.modalActionBtnText, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalActionBtn, { backgroundColor: '#FF3B30', flex: 1 }]}
                activeOpacity={0.7}
                onPress={handleSaveSangria}
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
  ledgerSectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
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
