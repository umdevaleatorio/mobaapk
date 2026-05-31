import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import AdminHeader from '../../../components/AdminHeader';
import { AdminUserMenu } from '../../../components/AdminUserMenu';
import HojeLabelSvg from '../../../assets/tela6/resumos/Hoje_.svg';
import FundoBtnFiltro from '../../../assets/tela6/selecionar data/Fundo.svg';
import SetaBaixo from '../../../assets/tela6/selecionar data/Upside Down.svg';
import HomeIcon8 from '../../../assets/tela5/barra de baixo/Home.svg';
import HomeIcon8Dark from '../../../assets/tela4/barra/HomeDark.svg';
import MapIcon8 from '../../../assets/tela5/barra de baixo/Map.svg';
import MapIcon8Dark from '../../../assets/tela4/barra/MapDark.svg';
import ManageIcon8 from '../../../assets/tela2/barra/Manage.svg';
import ManageIcon8Dark from '../../../assets/tela2/barra/ManageDark.svg';
import GearIcon8 from '../../../assets/tela5/barra de baixo/Gear.svg';
import GearIcon8Dark from '../../../assets/tela4/barra/GearDark.svg';
import MenuLabel8 from '../../../assets/tela5/barra de baixo/Menu.svg';
import MapaLabel8 from '../../../assets/tela5/barra de baixo/Mapa.svg';
import GerenciarLabel8 from '../../../assets/tela2/barra/Gerenciar.svg';
import OpcoesLabel8 from '../../../assets/tela5/barra de baixo/Opções.svg';
import { useAdminSalesHistoryScreen } from './useAdminSalesHistoryScreen';
import { styles } from './styles';

export default function AdminSalesHistoryScreen() {
  const h = useAdminSalesHistoryScreen();

  const iconColorInactive = h.isDarkMode ? '#FFFFFF' : undefined;

  const renderSummaryRow = (label: string, value: string, color: string) => (
    <View style={styles.summaryRow}>
      <Text style={{ fontSize: 13, fontWeight: 'bold', color }}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );

  const renderOrderCard = (order: any, index: number) => {
    const firstItem = order.order_items?.[0];
    const productImg = h.getFirstImageUrl(firstItem?.products?.image_url);
    return (
      <View key={order.id} style={[styles.orderCard, { backgroundColor: h.isDarkMode ? '#2E2E38' : '#1C2434' }]}>
        <View style={styles.colContainer}>
          <View style={[styles.productImageContainer, { backgroundColor: h.isDarkMode ? '#1E1E24' : '#FFFFFF' }]}>
            {productImg ? (
              <Image source={{ uri: productImg }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <View style={[styles.placeholderImg, { backgroundColor: h.isDarkMode ? '#2E2E38' : '#E0E0E0' }]} />
            )}
          </View>
        </View>
        <View style={[styles.cardSeparator, { backgroundColor: h.isDarkMode ? 'rgba(255,255,255,0.2)' : '#F5F5F5' }]} />
        <View style={styles.colContainer}>
          <Text style={styles.headerTextWhite}>Forma de{"\n"}pagamento</Text>
          {h.getPaymentDisplay(order.payment_method)}
        </View>
        <View style={[styles.cardSeparator, { backgroundColor: h.isDarkMode ? 'rgba(255,255,255,0.2)' : '#F5F5F5' }]} />
        <View style={styles.colContainer}>
          <Text style={styles.headerTextWhite}>Valor de{"\n"}venda</Text>
          <Text style={styles.valorText}>R$ {(order.total ?? 0).toFixed(2).replace('.', ',')}</Text>
        </View>
        <View style={[styles.cardSeparator, { backgroundColor: h.isDarkMode ? 'rgba(255,255,255,0.2)' : '#F5F5F5' }]} />
        <View style={styles.colContainer}>
          <TouchableOpacity activeOpacity={0.7} style={styles.verResumoBtn} onPress={() => h.navigation.navigate('AdminOrderDetailScreen', { order })}>
            <Text style={styles.verResumoText}>Ver{"\n"}Resumo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: h.colors.white }]}>
      <AdminHeader title="historico_vendas" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.filterRow}>
          <Text style={{ fontSize: h.isDarkMode ? 30 : 25, fontWeight: 'bold', color: h.isDarkMode ? '#FFFFFF' : '#1C2434', flex: 1.2 }}>
            {h.getDynamicTitle()}
          </Text>
          <TouchableOpacity activeOpacity={0.8} style={[styles.filterBtn, h.isDarkMode && { backgroundColor: '#1E1E24', borderRadius: 10 }]} onPress={h.openFilterModal}>
            {!h.isDarkMode && <FundoBtnFiltro width={170} height={42} style={{ position: 'absolute' }} />}
            <View style={styles.filterBtnContent}>
              <Text style={{ fontSize: h.isRange ? 11 : 14, fontWeight: 'bold', color: h.isDarkMode ? '#FFFFFF' : '#1C2434', textAlign: 'center', flex: 1 }}>
                {h.hasFiltered
                  ? (h.isRange ? `${h.startDate.toLocaleDateString('pt-BR')} - ${h.endDate.toLocaleDateString('pt-BR')}` : h.startDate.toLocaleDateString('pt-BR'))
                  : "Selecionar data"}
              </Text>
              <SetaBaixo width={15} height={10} color={h.isDarkMode ? '#FFE082' : '#1C2434'} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: h.isDarkMode ? h.colors.cardBackground : '#E3E4EB', borderColor: h.isDarkMode ? '#3E3E4A' : '#E3E4EB' }]}>
          <View style={[styles.summaryTotalRow, { borderBottomColor: h.isDarkMode ? '#3E3E4A' : '#FFFFFF' }]}>
            <Text style={[styles.summaryTotalLabel, { color: h.colors.textDark }]}>
              {h.isRange ? "Venda Total no Período" : "Venda Total do Dia"}
            </Text>
            <Text style={[styles.summaryTotalValue, { color: h.colors.textDark }]}>{h.formatCurrency(h.totalGeral)}</Text>
          </View>
          {renderSummaryRow("Cartão de Crédito", h.formatCurrency(h.totalCredito), '#FF0000')}
          {renderSummaryRow("Cartão de Débito", h.formatCurrency(h.totalDebito), '#4CAF50')}
          {renderSummaryRow("Dinheiro", h.formatCurrency(h.totalDinheiro), '#1B5E20')}
          {renderSummaryRow("Pix", h.formatCurrency(h.totalPix), '#00BFA5')}
        </View>

        {h.showPicker && (
          <DateTimePicker
            value={h.pickerMode === 'range_end' ? h.endDate : h.startDate}
            mode="date" display="default" onChange={h.onChangeDate}
            themeVariant={h.isDarkMode ? 'dark' : 'light'}
          />
        )}

        <Modal visible={h.showFilterOptionModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.whiteModalContainer, { backgroundColor: h.isDarkMode ? '#2E2E38' : '#FFFFFF' }]}>
              <Text style={[styles.whiteModalTitle, { color: h.colors.textDark }]}>Filtrar Ganhos</Text>
              <Text style={[styles.whiteModalDesc, { color: h.isDarkMode ? '#A8A8B3' : '#767676' }]}>Escolha como deseja consultar os ganhos da loja:</Text>
              <TouchableOpacity style={[styles.filterModeHeader, { borderBottomColor: h.isDarkMode ? '#3E3E4A' : '#E3E4EB' }]} activeOpacity={0.7} onPress={() => { h.setPickerMode('single'); h.setShowPicker(true); }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Feather name="calendar" size={20} color={h.colors.primary} style={{ marginRight: 10 }} />
                  <View>
                    <Text style={[styles.filterModeTitle, { color: h.colors.textDark }]}>Dia Único</Text>
                    <Text style={{ fontSize: 12, color: h.isDarkMode ? '#A8A8B3' : '#767676' }}>Consultar ganhos de uma data específica</Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color={h.isDarkMode ? '#A8A8B3' : '#767676'} />
              </TouchableOpacity>
              <View style={[styles.filterPeriodContainer, { borderColor: h.isDarkMode ? '#3E3E4A' : '#E3E4EB' }]}>
                <Text style={[styles.filterModeTitle, { color: h.colors.textDark, marginBottom: 12 }]}>Período Personalizado</Text>
                <View style={styles.rangeRowContainer}>
                  <TouchableOpacity style={[styles.datePickRow, { backgroundColor: h.isDarkMode ? '#1E1E24' : '#F5F6FA' }]} activeOpacity={0.7} onPress={() => { h.setPickerMode('range_start'); h.setShowPicker(true); }}>
                    <Text style={styles.datePickLabel}>Início</Text>
                    <Text style={[styles.datePickVal, { color: h.colors.textDark }]}>{h.localStartDate.toLocaleDateString('pt-BR')}</Text>
                  </TouchableOpacity>
                  <Feather name="arrow-right" size={16} color={h.isDarkMode ? '#FFFFFF' : '#1C2434'} style={{ alignSelf: 'center' }} />
                  <TouchableOpacity style={[styles.datePickRow, { backgroundColor: h.isDarkMode ? '#1E1E24' : '#F5F6FA' }]} activeOpacity={0.7} onPress={() => { h.setPickerMode('range_end'); h.setShowPicker(true); }}>
                    <Text style={styles.datePickLabel}>Fim</Text>
                    <Text style={[styles.datePickVal, { color: h.colors.textDark }]}>{h.localEndDate.toLocaleDateString('pt-BR')}</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={[styles.whiteModalBtnConfirm, { backgroundColor: '#25BE36', marginTop: 12 }]} activeOpacity={0.7} onPress={h.confirmRangeFilter}>
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
              <Text style={[styles.whiteModalDesc, { color: '#767676', fontSize: 15, lineHeight: 22 }]}>Este dia foi domingo/feriado, portanto seus ganhos foram 0.</Text>
              <TouchableOpacity style={[styles.whiteModalBtnConfirm, { backgroundColor: '#FF3B30', marginTop: 8 }]} activeOpacity={0.7} onPress={h.handleCloseSundayHolidayModal}>
                <Text style={styles.whiteModalBtnTextConfirm}>Entendido</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {h.loading ? (
          <ActivityIndicator size="large" color="#339914" style={{ marginTop: 20 }} />
        ) : h.orders.length === 0 ? (
          <Text style={[styles.emptyText, { color: h.colors.textDark }]}>Nenhuma venda registrada neste período.</Text>
        ) : (
          h.orders.map(renderOrderCard)
        )}
      </ScrollView>

      <View style={styles.tabBarOuter}>
        <View style={[styles.tabBarInner, { backgroundColor: h.isDarkMode ? '#000000' : '#E3E4EB' }]}>
          <TouchableOpacity style={styles.tabItem} onPress={() => h.navigation.navigate('AdminTabs', { screen: 'Home' })}>
            <View style={styles.iconBgInactive}>
              {h.isDarkMode ? <HomeIcon8Dark width={32} height={32} fill={iconColorInactive} stroke={iconColorInactive} /> : <HomeIcon8 width={32} height={32} fill={iconColorInactive} stroke={iconColorInactive} />}
            </View>
            <MenuLabel8 width={33} height={9} fill={iconColorInactive} stroke={iconColorInactive} />
          </TouchableOpacity>
          <View style={[styles.tabSeparator, { backgroundColor: h.isDarkMode ? 'rgba(255,255,255,0.2)' : '#8A7268' }]} />
          <TouchableOpacity style={styles.tabItem} onPress={() => h.navigation.navigate('AdminTabs', { screen: 'Mapa' })}>
            <View style={styles.iconBgInactive}>
              {h.isDarkMode ? <MapIcon8Dark width={32} height={32} fill={iconColorInactive} stroke={iconColorInactive} /> : <MapIcon8 width={32} height={32} fill={iconColorInactive} stroke={iconColorInactive} />}
            </View>
            <MapaLabel8 width={32} height={12} fill={iconColorInactive} stroke={iconColorInactive} />
          </TouchableOpacity>
          <View style={[styles.tabSeparator, { backgroundColor: h.isDarkMode ? 'rgba(255,255,255,0.2)' : '#8A7268' }]} />
          <TouchableOpacity style={styles.tabItem} onPress={() => h.navigation.navigate('AdminTabs', { screen: 'Gerenciar' })}>
            <View style={styles.iconBgInactive}>
              {h.isDarkMode ? <ManageIcon8Dark width={32} height={32} fill={iconColorInactive} stroke={iconColorInactive} /> : <ManageIcon8 width={32} height={32} fill={iconColorInactive} stroke={iconColorInactive} />}
            </View>
            <GerenciarLabel8 width={55} height={10} fill={iconColorInactive} stroke={iconColorInactive} />
          </TouchableOpacity>
          <View style={[styles.tabSeparator, { backgroundColor: h.isDarkMode ? 'rgba(255,255,255,0.2)' : '#8A7268' }]} />
          <TouchableOpacity style={styles.tabItem} onPress={() => h.navigation.navigate('AdminTabs', { screen: 'Opções' })}>
            <View style={styles.iconBgInactive}>
              {h.isDarkMode ? <GearIcon8Dark width={32} height={32} fill={iconColorInactive} stroke={iconColorInactive} /> : <GearIcon8 width={32} height={32} fill={iconColorInactive} stroke={iconColorInactive} />}
            </View>
            <OpcoesLabel8 width={42} height={12} fill={iconColorInactive} stroke={iconColorInactive} />
          </TouchableOpacity>
        </View>
      </View>

      <AdminUserMenu />
    </View>
  );
}
