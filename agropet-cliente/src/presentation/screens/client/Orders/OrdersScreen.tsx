import React from 'react';
import { View, ScrollView, RefreshControl, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { CatalogHeader } from '../../../components/CatalogHeader';
import { Ionicons } from '@expo/vector-icons';

import PedidosEmEntregaSvg from '../../../assets/tela11/Pedidos em entrega_.svg';
import HistoricoDeComprasSvg from '../../../assets/tela11/Histórico de compras_.svg';
import VerTudoSvg from '../../../assets/tela11/Ver tudo.svg';

import { useOrdersScreen } from './useOrdersScreen';
import { styles } from './OrdersScreen.styles';
import { OrderCard } from './OrderCard';
import { OrderCancelModal } from './OrderCancelModal';
import { OrderAlertModal } from './OrderAlertModal';
import { BottomTabBar } from './BottomTabBar';

export default function OrdersScreen({ navigation }: any) {
  const { isDarkMode, colors } = useTheme();
  const {
    searchText, setSearchText,
    loading, refreshing,
    activeDropdownId, setActiveDropdownId,
    activeCancelDropdownId, setActiveCancelDropdownId,
    showCancelModal, setShowCancelModal,
    cancellingOrderId, setCancellingOrderId,
    showDeliveryOnly, setShowDeliveryOnly,
    showHistoryOnly, setShowHistoryOnly,
    alertVisible, setAlertVisible,
    alertTitle, alertMessage,
    deliveryActive, trackingErrors,
    onRefresh, toggleDropdown,
    toggleCancelDropdown, handleCancelOrder,
    activeOrders, pastOrders,
    getFirstImageUrl,
  } = useOrdersScreen({ navigation });

  const renderOrders = (orders: any[], isPast: boolean) =>
    orders.map(order => (
      <OrderCard
        key={order.id}
        order={order}
        isPast={isPast}
        navigation={navigation}
        isDarkMode={isDarkMode}
        activeDropdownId={activeDropdownId}
        activeCancelDropdownId={activeCancelDropdownId}
        trackingErrors={trackingErrors}
        onToggleDropdown={toggleDropdown}
        onToggleCancelDropdown={toggleCancelDropdown}
        onCloseDropdown={() => setActiveDropdownId(null)}
        onCloseCancelDropdown={() => setActiveCancelDropdownId(null)}
        onRequestCancel={(id) => {
          setActiveCancelDropdownId(null);
          setCancellingOrderId(id);
          setShowCancelModal(true);
        }}
        getFirstImageUrl={getFirstImageUrl}
      />
    ));

  const renderSection = (title: 'delivery' | 'history', orders: any[], isPast: boolean, showAll: boolean, onShowAll: () => void) => {
    const headerSvg = title === 'delivery'
      ? <PedidosEmEntregaSvg width={180} height={20} />
      : <HistoricoDeComprasSvg width={180} height={20} />;
    const emptyMsg = isPast
      ? 'Você não fez nenhuma compra ainda!'
      : 'Não há pedidos em entrega.';

    return (
      <>
        <View style={styles.sectionHeader}>
          {isDarkMode
            ? <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>
                {title === 'delivery' ? 'Pedidos em entrega' : 'Histórico de compras'}
              </Text>
            : headerSvg}
          {showAll && (
            <TouchableOpacity onPress={onShowAll}>
              {isDarkMode
                ? <Text style={[styles.verTudoText, { color: '#FFE082' }]}>Ver tudo</Text>
                : <VerTudoSvg width={60} height={12} />}
            </TouchableOpacity>
          )}
        </View>
        {orders.length === 0
          ? <Text style={[styles.emptyText, { color: isDarkMode ? '#A8A8B3' : '#000000' }]}>{emptyMsg}</Text>
          : renderOrders(orders, isPast)}
      </>
    );
  };

  const renderBackButton = (onBack: () => void) => (
    <TouchableOpacity onPress={onBack} style={styles.voltarBtn} activeOpacity={0.7}>
      <Ionicons name="caret-back" size={16} color={isDarkMode ? '#FFE082' : '#1C2434'} style={{ marginRight: 4 }} />
      <Text style={[styles.voltarText, { color: isDarkMode ? '#FFE082' : '#1C2434' }]}>Voltar</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      <CatalogHeader title="Histórico de Pedidos" searchText={searchText} onSearchChange={setSearchText} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, (showDeliveryOnly || showHistoryOnly) && { paddingTop: 10 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#339914"]}
            tintColor={isDarkMode ? "#FFFFFF" : "#339914"}
          />
        }
      >
        {showDeliveryOnly ? (
          <View style={{ flex: 1, minHeight: 400 }}>
            {renderBackButton(() => setShowDeliveryOnly(false))}
            <View style={{ marginBottom: 20 }}>
              {isDarkMode
                ? <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Pedidos em entrega</Text>
                : <PedidosEmEntregaSvg width={180} height={20} />}
            </View>
            {activeOrders.length === 0
              ? <Text style={[styles.emptyText, { color: isDarkMode ? '#A8A8B3' : '#000000' }]}>
                  Não há pedidos em entrega no momento.
                </Text>
              : renderOrders(activeOrders, false)}
          </View>
        ) : showHistoryOnly ? (
          <View style={{ flex: 1, minHeight: 400 }}>
            {renderBackButton(() => setShowHistoryOnly(false))}
            <View style={{ marginBottom: 20 }}>
              {isDarkMode
                ? <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Histórico de compras</Text>
                : <HistoricoDeComprasSvg width={180} height={20} />}
            </View>
            {pastOrders.length === 0
              ? <Text style={[styles.emptyText, { color: isDarkMode ? '#A8A8B3' : '#000000' }]}>
                  Você não fez nenhuma compra ainda!
                </Text>
              : renderOrders(pastOrders, true)}
          </View>
        ) : (
          <>
            {loading
              ? <ActivityIndicator size="large" color="#339914" style={{ marginTop: 20 }} />
              : renderSection('delivery', activeOrders, false, true, () => setShowDeliveryOnly(true))}
            {!loading && (
              <>
                <View style={[styles.sectionHeader, { marginTop: 40 }]}>
                  {isDarkMode
                    ? <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Histórico de compras</Text>
                    : <HistoricoDeComprasSvg width={180} height={20} />}
                  <TouchableOpacity onPress={() => setShowHistoryOnly(true)}>
                    {isDarkMode
                      ? <Text style={[styles.verTudoText, { color: '#FFE082' }]}>Ver tudo</Text>
                      : <VerTudoSvg width={60} height={12} />}
                  </TouchableOpacity>
                </View>
                {pastOrders.length === 0
                  ? <Text style={[styles.emptyText, { color: isDarkMode ? '#A8A8B3' : '#000000' }]}>
                      Você não fez nenhuma compra ainda!
                    </Text>
                  : renderOrders(pastOrders, true)}
              </>
            )}
          </>
        )}
      </ScrollView>

      <OrderCancelModal
        visible={showCancelModal}
        isDarkMode={isDarkMode}
        onClose={() => setShowCancelModal(false)}
        onConfirm={async () => {
          if (cancellingOrderId) await handleCancelOrder(cancellingOrderId);
        }}
      />

      <OrderAlertModal
        visible={alertVisible}
        isDarkMode={isDarkMode}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />

      {(!showDeliveryOnly && !showHistoryOnly) && (
        <BottomTabBar navigation={navigation} isDarkMode={isDarkMode} deliveryActive={deliveryActive} />
      )}
    </View>
  );
}
