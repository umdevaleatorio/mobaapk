import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions, Image, Platform, Modal } from 'react-native';
import AdminHeader from '../../components/AdminHeader';
import { AdminUserMenu } from '../../components/AdminUserMenu';
import { supabase } from '../../../data/datasources/supabase/client';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../contexts/ThemeContext';
import { isHoliday } from '../../../utils/shopHours';
import { Feather } from '@expo/vector-icons';

// Top SVGs
import HojeLabelSvg from '../../assets/tela6/resumos/Hoje_.svg';
import FundoBtnFiltro from '../../assets/tela6/selecionar data/Fundo.svg';
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
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);

  // Date and Range filter states
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isRange, setIsRange] = useState(false);
  const [hasFiltered, setHasFiltered] = useState(true); // Default to filtered today

  // Backup states for Sunday/Holiday automatic reversion
  const [prevStartDate, setPrevStartDate] = useState<Date>(new Date());
  const [prevEndDate, setPrevEndDate] = useState<Date>(new Date());
  const [prevIsRange, setPrevIsRange] = useState(false);
  const [prevHasFiltered, setPrevHasFiltered] = useState(true);

  // Modals visibility
  const [showFilterOptionModal, setShowFilterOptionModal] = useState(false);
  const [showSundayHolidayModal, setShowSundayHolidayModal] = useState(false);

  // DateTimePicker flow
  const [pickerMode, setPickerMode] = useState<'single' | 'range_start' | 'range_end'>('single');
  const [showPicker, setShowPicker] = useState(false);

  // Local picker state before confirming range
  const [localStartDate, setLocalStartDate] = useState<Date>(new Date());
  const [localEndDate, setLocalEndDate] = useState<Date>(new Date());

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
  }, [startDate, endDate, isRange, hasFiltered]);

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
      case 'pix': return <Text style={[styles.pgtoText, { color: '#00BFA5' }]}>Pix</Text>;
      case 'cartao_credito': return <Text style={[styles.pgtoText, { color: '#FF0000' }]}>Cartão/Crédito</Text>;
      case 'cartao_debito': return <Text style={[styles.pgtoText, { color: '#4CAF50' }]}>Cartão/Débito</Text>;
      case 'dinheiro': return <Text style={[styles.pgtoText, { color: '#1B5E20' }]}>Dinheiro</Text>;
      default: return <Text style={styles.pgtoText}>{paymentMethod}</Text>;
    }
  };

    const iconColorInactive = isDarkMode ? '#FFFFFF' : undefined;

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.white }]}>
      {/* Header */}
      <AdminHeader title="historico_vendas" />

      {/* Body */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Title: Histórico de Vendas removed (now in header) */}

        {/* Filter Row: Hoje: [Selecionar data v] */}
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

        {/* Totals Summary Card (Branco-neve) */}
        <View style={[styles.summaryCard, { backgroundColor: isDarkMode ? colors.cardBackground : '#E3E4EB', borderColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]}>
          <View style={[styles.summaryTotalRow, { borderBottomColor: isDarkMode ? '#3E3E4A' : '#FFFFFF' }]}>
            <Text style={[styles.summaryTotalLabel, { color: colors.textDark }]}>
              {isRange ? "Venda Total no Período" : "Venda Total do Dia"}
            </Text>
            <Text style={[styles.summaryTotalValue, { color: colors.textDark }]}>{formatCurrency(totalGeral)}</Text>
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
            value={pickerMode === 'range_end' ? endDate : startDate}
            mode="date"
            display="default"
            onChange={onChangeDate}
            themeVariant={isDarkMode ? 'dark' : 'light'}
          />
        )}

        {/* Modal de Opções de Filtro */}
        <Modal visible={showFilterOptionModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.whiteModalContainer, { backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF' }]}>
              <Text style={[styles.whiteModalTitle, { color: colors.textDark }]}>
                Filtrar Ganhos
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
                  <Feather name="calendar" size={20} color={colors.primary} style={{ marginRight: 10 }} />
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

        {/* Modal de Alerta de Domingo/Feriado (Telinha Branca Informativa) */}
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

        {/* List of Sales */}
        {loading ? (
          <ActivityIndicator size="large" color="#339914" style={{ marginTop: 20 }} />
        ) : orders.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textDark }]}>Nenhuma venda registrada neste período.</Text>
        ) : (
          orders.map((order, index) => {
            const firstItem = order.order_items?.[0];
            const productImg = firstItem?.products?.image_url;

            return (
              <View key={order.id} style={[styles.orderCard, { backgroundColor: isDarkMode ? '#2E2E38' : '#1C2434' }]}>
                
                {/* Coluna 1: Foto do produto */}
                <View style={styles.colContainer}>
                  <View style={[styles.productImageContainer, { backgroundColor: isDarkMode ? '#1E1E24' : '#FFFFFF' }]}>
                    {productImg ? (
                      <Image source={{ uri: productImg }} style={styles.productImage} resizeMode="contain" />
                    ) : (
                      <View style={[styles.placeholderImg, { backgroundColor: isDarkMode ? '#2E2E38' : '#E0E0E0' }]} />
                    )}
                  </View>
                </View>

                {/* Separador 1 */}
                <View style={[styles.cardSeparator, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#F5F5F5' }]} />

                {/* Coluna 2: Forma de pagamento */}
                <View style={styles.colContainer}>
                  <Text style={styles.headerTextWhite}>Forma de{"\n"}pagamento</Text>
                  {getPaymentDisplay(order.payment_method)}
                </View>

                {/* Separador 2 */}
                <View style={[styles.cardSeparator, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#F5F5F5' }]} />

                {/* Coluna 3: Valor total da venda */}
                <View style={styles.colContainer}>
                  <Text style={styles.headerTextWhite}>Valor de{"\n"}venda</Text>
                  <Text style={styles.valorText}>R$ {(order.total ?? 0).toFixed(2).replace('.', ',')}</Text>
                </View>

                {/* Separador 3 */}
                <View style={[styles.cardSeparator, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#F5F5F5' }]} />

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
    color: '#FFE082',
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
    marginBottom: 8,
    textAlign: 'center',
  },
  whiteModalDesc: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
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
  whiteModalBtnCancel: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  whiteModalBtnTextCancel: {
    fontWeight: 'bold',
    fontSize: 15,
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
});
