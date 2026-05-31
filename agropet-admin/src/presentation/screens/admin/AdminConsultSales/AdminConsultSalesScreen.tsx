import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  Platform, Modal, RefreshControl, Animated,
} from 'react-native';
import AdminHeader from '../../../components/AdminHeader';
import { AdminUserMenu } from '../../../components/AdminUserMenu';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useAdminConsultSales } from './useAdminConsultSales';
import { styles } from './AdminConsultSalesScreen.styles';
import { CaixaGlobalPanel } from './components/CaixaGlobalPanel';
import { ConsultFilterModal } from './components/ConsultFilterModal';
import { OrderListItem } from './components/OrderListItem';

import FundoBtnFiltro from '../../../assets/tela6/selecionar data/Fundo.svg';
import SetaBaixo from '../../../assets/tela6/selecionar data/Upside Down.svg';

export default function AdminConsultSalesScreen() {
  const h = useAdminConsultSales();

  return (
    <View style={[styles.mainContainer, { backgroundColor: h.colors.white }]}>
      <AdminHeader title="consultar_vendas" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={h.refreshing}
            onRefresh={h.onRefresh}
            colors={["#339914"]}
            tintColor={h.isDarkMode ? "#FFFFFF" : "#339914"}
          />
        }
      >
        <CaixaGlobalPanel
          isDarkMode={h.isDarkMode}
          saldoTotalCaixaGeral={h.saldoTotalCaixaGeral}
          totalDinheiroCaixaGeral={h.totalDinheiroCaixaGeral}
          pulseAnim={h.pulseAnim}
          formatCurrency={h.formatCurrency}
          totalCreditoGeral={h.totalCreditoGeral}
          totalDebitoGeral={h.totalDebitoGeral}
          totalPixGeral={h.totalPixGeral}
        />

        <View style={styles.filterSectionContainer}>
          <View style={styles.filterLeftRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.originFilterBtn, { backgroundColor: h.isDarkMode ? '#2E2E38' : '#F5F6FA', borderColor: h.isDarkMode ? '#3E3E4A' : '#E3E4EB' }]}
              onPress={h.handleOpenFilterModal}
            >
              <Feather name="sliders" size={14} color={h.isDarkMode ? '#FFE082' : '#F97D01'} style={{ marginRight: 6 }} />
              <Text style={[styles.originFilterText, { color: h.isDarkMode ? '#FFFFFF' : '#1C2434' }]} numberOfLines={1}>
                {h.originFilter === 'tudo' ? 'Filtrar vendas' : h.originFilter === 'fisica' ? 'Vendas físicas' : 'Pedidos concluídos'}
              </Text>
              {h.selectedPayMethods.length < 4 && (
                <View style={styles.filterCountBadge}>
                  <Text style={styles.filterCountText}>{h.selectedPayMethods.length}</Text>
                </View>
              )}
              <Feather name="chevron-down" size={14} color={h.isDarkMode ? '#A8A8B3' : '#767676'} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>

          <View style={styles.filterRightRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.filterBtn, h.isDarkMode && { backgroundColor: '#1E1E24', borderRadius: 10 }]}
              onPress={() => {
                h.setLocalStartDate(h.startDate);
                h.setLocalEndDate(h.endDate);
                h.setShowFilterOptionModal(true);
              }}
            >
              {!h.isDarkMode && (
                <FundoBtnFiltro width={170} height={42} style={{ position: 'absolute' }} />
              )}
              <View style={styles.filterBtnContent}>
                {h.hasFiltered ? (
                  <Text style={{
                    fontSize: h.isRange ? 11 : 13,
                    fontWeight: 'bold',
                    color: h.isDarkMode ? '#FFFFFF' : '#1C2434',
                    textAlign: 'center',
                    flex: 1
                  }}>
                    {h.isRange
                      ? `${h.startDate.getDate()}/${h.startDate.getMonth() + 1} - ${h.endDate.getDate()}/${h.endDate.getMonth() + 1}`
                      : h.startDate.toLocaleDateString('pt-BR')
                    }
                  </Text>
                ) : (
                  <Text style={{
                    fontSize: 13,
                    fontWeight: 'bold',
                    color: h.isDarkMode ? '#FFFFFF' : '#1C2434',
                    textAlign: 'center',
                    flex: 1
                  }}>
                    Selecionar data
                  </Text>
                )}
                <SetaBaixo width={15} height={10} color={h.isDarkMode ? '#FFE082' : '#1C2434'} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {h.showPicker && (
          <DateTimePicker
            value={h.pickerMode === 'range_end' ? h.endDate : h.startDate}
            mode="date"
            display="default"
            onChange={h.onChangeDate}
            themeVariant={h.isDarkMode ? 'dark' : 'light'}
          />
        )}

        <ConsultFilterModal
          showFilterModal={h.showFilterModal}
          isDarkMode={h.isDarkMode}
          colors={h.colors}
          tempOriginFilter={h.tempOriginFilter as any}
          setTempOriginFilter={h.setTempOriginFilter}
          tempPayMethods={h.tempPayMethods}
          getPaymentDisplayPortuguese={h.getPaymentDisplayPortuguese}
          getPayMethodColor={h.getPayMethodColor}
          handleToggleTempPayMethod={h.handleToggleTempPayMethod}
          tempStatusFilter={h.tempStatusFilter as any}
          setTempStatusFilter={h.setTempStatusFilter}
          setTempPayMethods={h.setTempPayMethods}
          handleApplyFilters={h.handleApplyFilters}
          setShowFilterModal={h.setShowFilterModal}
        />

        <Modal visible={h.showPaymentEditModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.whiteModalContainer, { backgroundColor: h.isDarkMode ? '#2E2E38' : '#FFFFFF' }]}>
              <Text style={[styles.whiteModalTitle, { color: h.colors.textDark }]}>Mudar Forma de Pagamento</Text>
              <Text style={[styles.whiteModalDesc, { color: h.isDarkMode ? '#A8A8B3' : '#767676' }]}>
                Escolha o novo método de pagamento para esta venda:
              </Text>
              {['dinheiro', 'cartao_credito', 'cartao_debito', 'pix'].map((method) => (
                <TouchableOpacity
                  key={method}
                  activeOpacity={0.7}
                  style={[styles.modalFilterRow, { borderBottomColor: h.isDarkMode ? '#3E3E4A' : '#E3E4EB' }]}
                  onPress={() => h.confirmPaymentEdit(method as any)}
                >
                  <Text style={[styles.modalFilterLabel, { color: h.getPayMethodColor(method), fontWeight: 'bold' }]}>
                    {h.getPaymentDisplayPortuguese(method)}
                  </Text>
                  {h.selectedOrder?.payment_method === method && <Feather name="check" size={18} color="#25BE36" />}
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={{ alignSelf: 'center', marginTop: 16 }} activeOpacity={0.7} onPress={() => { h.setShowPaymentEditModal(false); h.setSelectedOrder(null); }}>
                <Text style={{ color: '#FF3B30', fontWeight: 'bold' }}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={h.showFilterOptionModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.whiteModalContainer, { backgroundColor: h.isDarkMode ? '#2E2E38' : '#FFFFFF' }]}>
              <Text style={[styles.whiteModalTitle, { color: h.colors.textDark }]}>Filtrar Ganhos</Text>
              <Text style={[styles.whiteModalDesc, { color: h.isDarkMode ? '#A8A8B3' : '#767676' }]}>
                Escolha como deseja consultar as vendas da loja:
              </Text>
              <TouchableOpacity
                style={[styles.filterModeHeader, { borderBottomColor: h.isDarkMode ? '#3E3E4A' : '#E3E4EB' }]}
                activeOpacity={0.7}
                onPress={() => { h.setPickerMode('single'); h.setShowPicker(true); }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Feather name="calendar" size={20} color={h.colors.primary} style={{ marginRight: 10 }} />
                  <View>
                    <Text style={[styles.filterModeTitle, { color: h.colors.textDark }]}>Dia Único</Text>
                    <Text style={{ fontSize: 12, color: h.isDarkMode ? '#A8A8B3' : '#767676' }}>Consultar vendas de uma data específica</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color={h.isDarkMode ? '#A8A8B3' : '#767676'} />
              </TouchableOpacity>

              <View style={[styles.filterPeriodContainer, { borderColor: h.isDarkMode ? '#3E3E4A' : '#E3E4EB' }]}>
                <Text style={[styles.filterModeTitle, { color: h.colors.textDark, marginBottom: 12 }]}>Período Personalizado</Text>
                <View style={styles.rangeRowContainer}>
                  <TouchableOpacity
                    style={[styles.datePickRow, { backgroundColor: h.isDarkMode ? '#1E1E24' : '#F5F6FA' }]}
                    activeOpacity={0.7}
                    onPress={() => { h.setPickerMode('range_start'); h.setShowPicker(true); }}
                  >
                    <Text style={styles.datePickLabel}>Início</Text>
                    <Text style={[styles.datePickVal, { color: h.colors.textDark }]}>{h.localStartDate.toLocaleDateString('pt-BR')}</Text>
                  </TouchableOpacity>
                  <Feather name="arrow-right" size={16} color={h.isDarkMode ? '#FFFFFF' : '#1C2434'} style={{ alignSelf: 'center' }} />
                  <TouchableOpacity
                    style={[styles.datePickRow, { backgroundColor: h.isDarkMode ? '#1E1E24' : '#F5F6FA' }]}
                    activeOpacity={0.7}
                    onPress={() => { h.setPickerMode('range_end'); h.setShowPicker(true); }}
                  >
                    <Text style={styles.datePickLabel}>Fim</Text>
                    <Text style={[styles.datePickVal, { color: h.colors.textDark }]}>{h.localEndDate.toLocaleDateString('pt-BR')}</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[styles.whiteModalBtnConfirm, { backgroundColor: '#25BE36', marginTop: 12 }]}
                  activeOpacity={0.7}
                  onPress={() => {
                    let start = new Date(h.localStartDate);
                    let end = new Date(h.localEndDate);
                    if (start.getTime() > end.getTime()) { const t = start; start = end; end = t; }
                    h.setPrevStartDate(h.startDate);
                    h.setPrevEndDate(h.endDate);
                    h.setPrevIsRange(h.isRange);
                    h.setPrevHasFiltered(h.hasFiltered);
                    h.setStartDate(start);
                    h.setEndDate(end);
                    h.setIsRange(true);
                    h.setHasFiltered(true);
                    h.setShowFilterOptionModal(false);
                  }}
                >
                  <Text style={styles.whiteModalBtnTextConfirm}>Filtrar Período</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={{ alignSelf: 'center', marginTop: 16 }} activeOpacity={0.7} onPress={() => h.setShowFilterOptionModal(false)}>
                <Text style={{ color: '#FF3B30', fontWeight: 'bold' }}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={h.showSundayHolidayModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.whiteModalContainer, { backgroundColor: '#FFFFFF' }]}>
              <View style={{ alignSelf: 'center', marginBottom: 16 }}>
                <Feather name="alert-triangle" size={48} color="#FF3B30" />
              </View>
              <Text style={[styles.whiteModalTitle, { color: '#1C2434' }]}>Aviso de Fechamento</Text>
              <Text style={[styles.whiteModalDesc, { color: '#767676', fontSize: 15, lineHeight: 22 }]}>
                Este dia foi domingo/feriado, portanto a loja esteve fechada.
              </Text>
              <TouchableOpacity style={[styles.whiteModalBtnConfirm, { backgroundColor: '#FF3B30', marginTop: 8 }]} activeOpacity={0.7} onPress={h.handleCloseSundayHolidayModal}>
                <Text style={styles.whiteModalBtnTextConfirm}>Entendido</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Text style={[styles.sectionTitle, { color: h.isDarkMode ? '#FFFFFF' : '#1C2434', marginLeft: 4, marginBottom: 12 }]}>
          {h.getDynamicTitle()}
        </Text>

        {h.loading ? (
          <ActivityIndicator size="large" color="#339914" style={{ marginTop: 20 }} />
        ) : h.filteredOrders.length === 0 ? (
          <Text style={[styles.emptyText, { color: h.colors.textDark }]}>Nenhuma venda registrada neste período.</Text>
        ) : (
          h.filteredOrders.map((order: any) => (
            <OrderListItem
              key={order.id}
              order={order}
              isDarkMode={h.isDarkMode}
              colors={h.colors}
              getPaymentDisplay={h.getPaymentDisplay}
              formatCurrency={h.formatCurrency}
              navigation={h.navigation}
              handleEditPaymentMethod={h.handleEditPaymentMethod}
              handleCancelOrder={h.handleCancelOrder}
            />
          ))
        )}
      </ScrollView>

      <View style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: Platform.OS === 'ios' ? 110 : 90,
        backgroundColor: h.isDarkMode ? '#1E1E24' : '#ECECEC',
        borderTopWidth: 1,
        borderTopColor: h.isDarkMode ? '#3E3E4A' : '#D2D2D2',
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
          onPress={() => h.navigation.goBack()}
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
