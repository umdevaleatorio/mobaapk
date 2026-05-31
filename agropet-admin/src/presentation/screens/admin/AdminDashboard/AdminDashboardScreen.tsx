import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AdminHeader from '../../../components/AdminHeader';
import { AdminUserMenu } from '../../../components/AdminUserMenu';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './AdminDashboardScreen.styles';
import { useAdminDashboard } from './useAdminDashboard';
import DashboardOverview from './components/DashboardOverview';
import PDVSection from './components/PDVSection';
import CheckoutModal from './components/CheckoutModal';
import CashFlowFilterModal from './components/CashFlowFilterModal';
import FilterOptionModal from './components/FilterOptionModal';
import SundayHolidayModal from './components/SundayHolidayModal';
import TransactionModal from './components/TransactionModal';

import AdminBottomTabBar from './components/AdminBottomTabBar';
import AdminPDVBottomBar from './components/AdminPDVBottomBar';

export default function AdminDashboardScreen() {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<any>();
  const d = useAdminDashboard();

  const chartData = d.generateChartPoints();
  const { points, maxVal, width: gWidth, height: gHeight, paddingBottom, paddingLeft } = chartData;

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
    areaD = pathD + ` L ${points[points.length - 1].x} ${gHeight - paddingBottom} L ${points[0].x} ${gHeight - paddingBottom} Z`;
  }

  const iconColorInactive = isDarkMode ? '#FFFFFF' : undefined;

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.white }]}>
      <AdminHeader title="painel_vendas" />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          d.isPDVMode && { paddingBottom: Platform.OS === 'ios' ? 160 : 140 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {!d.isPDVMode ? (
          <DashboardOverview
            isDarkMode={isDarkMode}
            colors={colors}
            saldoTotalCaixaGeral={d.saldoTotalCaixaGeral}
            totalCreditoGeral={d.totalCreditoGeral}
            totalDebitoGeral={d.totalDebitoGeral}
            totalPixGeral={d.totalPixGeral}
            totalDinheiroCaixaGeral={d.totalDinheiroCaixaGeral}
            formatCurrency={d.formatCurrency}
            pulseAnim={d.pulseAnim}
            onNavigateConsultSales={() => navigation.navigate('AdminConsultSalesScreen')}
            onEnterPDV={() => { d.setIsPDVMode(true); d.setDismissedProductIds(new Set()); }}
            onOpenSuprimento={() => { d.setModalTransactionType('suprimento'); d.setShowTransactionModal(true); }}
            onOpenSangria={() => { d.setModalTransactionType('sangria'); d.setShowTransactionModal(true); }}
            getDynamicTitle={d.getDynamicTitle}
            hasFiltered={d.hasFiltered}
            isRange={d.isRange}
            startDate={d.startDate}
            endDate={d.endDate}
            onFilterPress={() => {
              d.setLocalStartDate(d.startDate);
              d.setLocalEndDate(d.endDate);
              d.setShowFilterOptionModal(true);
            }}
            loading={d.loading}
            points={points}
            maxVal={maxVal}
            gWidth={gWidth}
            gHeight={gHeight}
            paddingBottom={paddingBottom}
            paddingLeft={paddingLeft}
            pathD={pathD}
            areaD={areaD}
            ticketMedio={d.ticketMedio}
            volumeVendas={d.volumeVendas}
            topMethod={d.topMethod}
            activeTransactions={d.activeTransactions}
            cashFlowFilter={d.cashFlowFilter}
            cashFlowStartDate={d.cashFlowStartDate}
            cashFlowEndDate={d.cashFlowEndDate}
            onCashFlowFilterPress={() => {
              d.setCashLocalFilter(d.cashFlowFilter);
              d.setCashLocalStartDate(d.cashFlowStartDate);
              d.setCashLocalEndDate(d.cashFlowEndDate);
              d.setShowCashFlowFilterModal(true);
            }}
          />
        ) : (
          <PDVSection
            pdvSearchText={d.pdvSearchText}
            onSearchChange={d.setPdvSearchText}
            pdvActiveCategories={d.pdvActiveCategories}
            onCategoryToggle={(cat) =>
              d.setPdvActiveCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
            }
            pdvSelectMode={d.pdvSelectMode}
            pdvCart={d.pdvCart}
            pdvProducts={d.pdvProducts}
            pdvLoading={d.pdvLoading}
            onRegisterPress={() => {
              if (!d.pdvSelectMode) {
                d.setPdvSelectMode(true);
              } else {
                const selectedItems = d.pdvProducts.filter(p => d.pdvCart[p.id]?.checked);
                if (selectedItems.length === 0) {
                  Alert.alert('Nenhum produto selecionado', 'Por favor, selecione pelo menos um produto com o checkbox para registrar.');
                  return;
                }
                d.setShowCheckoutModal(true);
              }
            }}
            onCancelPress={() => { d.setPdvSelectMode(false); d.setPdvCart({}); }}
            onToggleCart={d.togglePdvCart}
            onUpdateQty={d.updatePdvCartQty}
            onDismissAlert={d.dismissAlert}
            dismissedProductIds={d.dismissedProductIds}
            cancelOpacity={d.cancelOpacity}
            isDarkMode={isDarkMode}
            formatCurrency={d.formatCurrency}
          />
        )}
      </ScrollView>

      <CheckoutModal
        visible={d.showCheckoutModal}
        pdvProducts={d.pdvProducts}
        pdvCart={d.pdvCart}
        checkoutPaymentMethod={d.checkoutPaymentMethod}
        pdvLoading={d.pdvLoading}
        isDarkMode={isDarkMode}
        onClose={() => { d.setShowCheckoutModal(false); d.setDropdownExpanded(false); }}
        onPaymentMethodChange={d.setCheckoutPaymentMethod}
        onConfirm={d.handleConfirmPdvSale}
      />

      <CashFlowFilterModal
        visible={d.showCashFlowFilterModal}
        cashLocalFilter={d.cashLocalFilter}
        cashLocalStartDate={d.cashLocalStartDate}
        cashLocalEndDate={d.cashLocalEndDate}
        isDarkMode={isDarkMode}
        colors={colors}
        onClose={() => d.setShowCashFlowFilterModal(false)}
        onFilterChange={d.setCashLocalFilter}
        onStartDatePress={() => { d.setPickerMode('cash_range_start'); d.setShowPicker(true); }}
        onEndDatePress={() => { d.setPickerMode('cash_range_end'); d.setShowPicker(true); }}
        onConfirm={() => {
          if (d.cashLocalStartDate && d.cashLocalEndDate) {
            let start = new Date(d.cashLocalStartDate);
            let end = new Date(d.cashLocalEndDate);
            if (start.getTime() > end.getTime()) { const t = start; start = end; end = t; }
            d.setCashFlowStartDate(start);
            d.setCashFlowEndDate(end);
          } else {
            d.setCashFlowStartDate(null);
            d.setCashFlowEndDate(null);
          }
          d.setCashFlowFilter(d.cashLocalFilter);
          d.setShowCashFlowFilterModal(false);
        }}
        onCancel={() => d.setShowCashFlowFilterModal(false)}
      />

      <FilterOptionModal
        visible={d.showFilterOptionModal}
        localStartDate={d.localStartDate}
        localEndDate={d.localEndDate}
        isDarkMode={isDarkMode}
        colors={colors}
        onClose={() => d.setShowFilterOptionModal(false)}
        onSingleDayPress={() => { d.setPickerMode('single'); d.setShowPicker(true); }}
        onRangeStartPress={() => { d.setPickerMode('range_start'); d.setShowPicker(true); }}
        onRangeEndPress={() => { d.setPickerMode('range_end'); d.setShowPicker(true); }}
        onRangeConfirm={() => {
          let start = new Date(d.localStartDate);
          let end = new Date(d.localEndDate);
          if (start.getTime() > end.getTime()) { const t = start; start = end; end = t; }
          d.setPrevStartDate(d.startDate);
          d.setPrevEndDate(d.endDate);
          d.setPrevIsRange(d.isRange);
          d.setPrevHasFiltered(d.hasFiltered);
          d.setStartDate(start);
          d.setEndDate(end);
          d.setIsRange(true);
          d.setHasFiltered(true);
          d.setShowFilterOptionModal(false);
        }}
      />

      <SundayHolidayModal
        visible={d.showSundayHolidayModal}
        onClose={d.handleCloseSundayHolidayModal}
      />

      <TransactionModal
        visible={d.showTransactionModal}
        modalTransactionType={d.modalTransactionType}
        modalPaymentMethod={d.modalPaymentMethod}
        formattedAmount={d.formattedAmount}
        transactionDesc={d.transactionDesc}
        isDarkMode={isDarkMode}
        colors={colors}
        onClose={() => {
          d.setShowTransactionModal(false);
          d.setRawAmount(0);
          d.setFormattedAmount('');
          d.setTransactionDesc('');
        }}
        onPaymentMethodChange={d.setModalPaymentMethod}
        onAmountChange={d.handleAmountChange}
        onDescChange={d.setTransactionDesc}
        onConfirm={d.handleSaveTransaction}
      />

      {d.showPicker && (
        <DateTimePicker
          value={
            d.pickerMode === 'range_end' ? d.endDate :
              d.pickerMode === 'range_start' ? d.startDate :
                d.pickerMode === 'cash_range_start' ? (d.cashLocalStartDate || new Date()) :
                  d.pickerMode === 'cash_range_end' ? (d.cashLocalEndDate || new Date()) :
                    d.startDate
          }
          mode="date"
          display="default"
          onChange={d.onChangeDate}
          themeVariant={isDarkMode ? 'dark' : 'light'}
        />
      )}

      {!d.isPDVMode && (
        <AdminBottomTabBar isDarkMode={isDarkMode} iconColorInactive={iconColorInactive} />
      )}

      {d.isPDVMode && (
        <AdminPDVBottomBar isDarkMode={isDarkMode} onClose={() => d.setIsPDVMode(false)} />
      )}

      <AdminUserMenu />
    </View>
  );
}
