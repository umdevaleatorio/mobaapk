import React from 'react';
import { View, Text, TouchableOpacity, Dimensions, ActivityIndicator, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Line, G, Text as SvgText } from 'react-native-svg';
import { styles } from './DashboardOverview.styles';
import FundoBtnFiltro from '../../../../../assets/tela6/selecionar data/Fundo.svg';
import SetaBaixo from '../../../../../assets/tela6/selecionar data/Upside Down.svg';
import DashboardOverviewGraph from './DashboardOverviewGraph';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DashboardOverviewProps {
  isDarkMode: boolean;
  colors: any;
  saldoTotalCaixaGeral: number;
  totalCreditoGeral: number;
  totalDebitoGeral: number;
  totalPixGeral: number;
  totalDinheiroCaixaGeral: number;
  formatCurrency: (val: number) => string;
  pulseAnim: any;
  onNavigateConsultSales: () => void;
  onEnterPDV: () => void;
  onOpenSuprimento: () => void;
  onOpenSangria: () => void;
  getDynamicTitle: () => string;
  hasFiltered: boolean;
  isRange: boolean;
  startDate: Date;
  endDate: Date;
  onFilterPress: () => void;
  loading: boolean;
  points: any[];
  maxVal: number;
  gWidth: number;
  gHeight: number;
  paddingBottom: number;
  paddingLeft: number;
  pathD: string;
  areaD: string;
  ticketMedio: number;
  volumeVendas: number;
  topMethod: string;
  activeTransactions: any[];
  cashFlowFilter: 'all' | 'sangria' | 'suprimento';
  cashFlowStartDate: Date | null;
  cashFlowEndDate: Date | null;
  onCashFlowFilterPress: () => void;
}

export default function DashboardOverview({
  isDarkMode, colors, saldoTotalCaixaGeral, totalCreditoGeral,
  totalDebitoGeral, totalPixGeral, totalDinheiroCaixaGeral,
  formatCurrency, pulseAnim, onNavigateConsultSales, onEnterPDV,
  onOpenSuprimento, onOpenSangria, getDynamicTitle, hasFiltered,
  isRange, startDate, endDate, onFilterPress, loading, points,
  maxVal, gWidth, gHeight, paddingBottom, paddingLeft, pathD, areaD,
  ticketMedio, volumeVendas, topMethod, activeTransactions,
  cashFlowFilter, onCashFlowFilterPress
}: DashboardOverviewProps) {
  return (
    <>
      <View style={[styles.caixaCard, { backgroundColor: isDarkMode ? '#2E2E38' : '#1C2434' }]}>
        <View style={styles.caixaTopRow}>
          <View>
            <Text style={styles.caixaTitle}>Saldo Total em Caixa</Text>
            <Text style={[styles.caixaValue, { color: saldoTotalCaixaGeral >= 0 ? '#00E676' : '#FF5252' }]}>
              {formatCurrency(saldoTotalCaixaGeral)}
            </Text>
          </View>
          <View style={styles.pulseContainer}>
            <View style={[styles.pulseDot, { backgroundColor: totalDinheiroCaixaGeral >= 0 ? '#00E676' : '#FF5252' }]} />
            <Animated.View style={[
              styles.pulseRing,
              { borderColor: totalDinheiroCaixaGeral >= 0 ? '#00E676' : '#FF5252' },
              {
                transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }],
                opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] })
              }
            ]} />
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

      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.sangriaTriggerBtn, { backgroundColor: '#2D8CE5', borderColor: '#2D8CE5', marginBottom: 12 }]}
        onPress={onNavigateConsultSales}
      >
        <Feather name="list" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
        <Text style={[styles.sangriaTriggerText, { color: '#FFFFFF' }]}>Ver Vendas</Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.sangriaTriggerBtn, { backgroundColor: '#FF5C00', borderColor: '#FF5C00', marginBottom: 12 }]}
        onPress={onEnterPDV}
      >
        <Feather name="shopping-cart" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
        <Text style={[styles.sangriaTriggerText, { color: '#FFFFFF' }]}>Registrar Venda</Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.sangriaTriggerBtn, { backgroundColor: isDarkMode ? '#1E1E24' : '#E8F5E9', borderColor: isDarkMode ? '#3E3E4A' : '#C8E6C9', marginBottom: 12 }]}
        onPress={onOpenSuprimento}
      >
        <Feather name="plus-circle" size={20} color="#4CAF50" style={{ marginRight: 8 }} />
        <Text style={[styles.sangriaTriggerText, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>Realizar Suprimento (Entrada de Caixa)</Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.sangriaTriggerBtn, { backgroundColor: isDarkMode ? '#1E1E24' : '#FFEBEE', borderColor: isDarkMode ? '#3E3E4A' : '#FFCDD2', marginBottom: 20 }]}
        onPress={onOpenSangria}
      >
        <Feather name="minus-circle" size={20} color="#FF3B30" style={{ marginRight: 8 }} />
        <Text style={[styles.sangriaTriggerText, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>Realizar Sangria (Retirada de Caixa)</Text>
      </TouchableOpacity>

      <View style={styles.filterRow}>
        <Text style={{
          fontSize: isDarkMode ? 30 : 25, fontWeight: 'bold',
          color: isDarkMode ? '#FFFFFF' : '#1C2434', flex: 1.2,
        }}>
          {getDynamicTitle()}
        </Text>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.filterBtn, isDarkMode && { backgroundColor: '#1E1E24', borderRadius: 10 }]}
          onPress={onFilterPress}
        >
          {!isDarkMode && (
            <FundoBtnFiltro width={170} height={42} style={{ position: 'absolute' }} />
          )}
          <View style={styles.filterBtnContent}>
            {hasFiltered ? (
              <Text style={{
                fontSize: isRange ? 11 : 14, fontWeight: 'bold',
                color: isDarkMode ? '#FFFFFF' : '#1C2434', textAlign: 'center', flex: 1
              }}>
                {isRange
                  ? `${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`
                  : startDate.toLocaleDateString('pt-BR')
                }
              </Text>
            ) : (
              <Text style={{
                fontSize: 14, fontWeight: 'bold',
                color: isDarkMode ? '#FFFFFF' : '#1C2434', textAlign: 'center', flex: 1
              }}>
                Selecionar data
              </Text>
            )}
            <SetaBaixo width={15} height={10} color={isDarkMode ? '#FFE082' : '#1C2434'} />
          </View>
        </TouchableOpacity>
      </View>

      <DashboardOverviewGraph
        isDarkMode={isDarkMode}
        loading={loading}
        points={points}
        maxVal={maxVal}
        gWidth={gWidth}
        gHeight={gHeight}
        paddingBottom={paddingBottom}
        paddingLeft={paddingLeft}
        pathD={pathD}
        areaD={areaD}
      />

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

      <View style={styles.sangriaLedgerContainer}>
        <View style={styles.ledgerTitleRow}>
          <Text style={[styles.ledgerSectionTitle, { color: isDarkMode ? '#FFFFFF' : '#1C2434', marginBottom: 0 }]}>
            Fluxo de Caixa no Período
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.cashFlowFilterBtn, { backgroundColor: isDarkMode ? '#2E2E38' : '#F5F6FA', borderColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]}
            onPress={onCashFlowFilterPress}
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
          activeTransactions.map((t: any) => {
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
                  <Text style={[styles.ledgerRowTitle, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>{t.description}</Text>
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
  );
}
