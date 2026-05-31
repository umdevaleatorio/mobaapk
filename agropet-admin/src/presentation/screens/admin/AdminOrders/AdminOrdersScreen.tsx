import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import AdminHeader from '../../../components/AdminHeader';
import { AdminUserMenu } from '../../../components/AdminUserMenu';

import RastrearSvg from '../../../assets/tela5/Rastrear.svg';
import AdminBottomTabBar from '../AdminDashboard/components/AdminBottomTabBar';

import { useAdminOrders } from './useAdminOrders';
import { styles } from './AdminOrdersScreen.styles';

export default function AdminOrdersScreen() {
  const h = useAdminOrders();

  const renderOrderCard = (order: any, isCancelled: boolean) => {
    const cardBgColor = h.isDarkMode ? '#2E2E38' : '#E3E4EB';
    const separatorColor = h.isDarkMode ? '#18181C' : '#F5F5F5';
    const labelColor = h.isDarkMode ? '#4A90E2' : '#2B6CB0';
    const payment = h.getPaymentDisplay(order.payment_method);

    return (
      <View key={order.id} style={[styles.orderCard, { backgroundColor: cardBgColor }, isCancelled && { opacity: 0.6 }]}>
        <View style={styles.colContainer}>
          <Text style={[styles.columnLabel, { color: labelColor }]}>N° do pedido</Text>
          <Text style={[styles.valText, { color: h.colors.textDark, fontWeight: 'bold' }]}>{order.id.slice(0, 8).toUpperCase()}</Text>
        </View>
        <View style={{ width: 1, height: '100%', backgroundColor: separatorColor }} />
        <View style={styles.colContainer}>
          <Text style={[styles.columnLabel, { color: labelColor }]}>Forma de{"\n"}pagamento</Text>
          <Text style={[styles.valText, { color: payment.color, fontWeight: 'bold' }]}>{payment.label}</Text>
        </View>
        <View style={{ width: 1, height: '100%', backgroundColor: separatorColor }} />
        <View style={styles.colContainer}>
          <Text style={[styles.columnLabel, { color: labelColor }]}>Situação do{"\n"}pagamento</Text>
          {order.status === 'cancelled' ? (
            <Text style={[styles.valText, { color: '#FF6B6B', fontWeight: 'bold' }]}>Cancelado</Text>
          ) : order.status === 'confirmed' || order.status === 'completed' ? (
            <Text style={[styles.valText, { color: h.isDarkMode ? '#4ADE80' : '#339914', fontWeight: 'bold' }]}>Aprovado</Text>
          ) : (
            <Text style={[styles.valText, { color: '#e69900', fontWeight: 'bold' }]}>Pendente</Text>
          )}
        </View>
        <View style={{ width: 1, height: '100%', backgroundColor: separatorColor }} />
        <View style={[styles.colContainer, { gap: 6 }]}>
          <TouchableOpacity
            testID="track-order-btn"
            activeOpacity={0.7}
            style={[isCancelled && { opacity: 0.3 }]}
            onPress={() => !isCancelled && h.handleTrackOrder(order)}
            disabled={isCancelled}
          >
            <RastrearSvg width={57} height={14} />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.verProdutosBtn}
            onPress={() => h.navigation.navigate('AdminOrderDetailScreen', { order })}
          >
            <Text style={{ color: h.isDarkMode ? '#FFE082' : '#042A7D', fontSize: 11, fontWeight: 'bold', textAlign: 'center' }}>Ver produtos</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const iconColorInactive = h.isDarkMode ? '#FFFFFF' : undefined;

  return (
    <View style={[styles.mainContainer, { backgroundColor: h.isDarkMode ? '#18181C' : '#F5F5F5' }]}>
      <AdminHeader title="ver_pedidos" />
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
        <View style={styles.sectionHeader}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: h.isDarkMode ? '#FFFFFF' : '#1C2434', marginLeft: 4 }}>Pedidos de hoje:</Text>
        </View>

        {h.loading ? (
          <ActivityIndicator size="large" color="#339914" style={{ marginTop: 20 }} />
        ) : h.activeOrders.length === 0 ? (
          <Text style={[styles.emptyText, { color: h.colors.textDark }]}>Não há pedidos ativos registrados.</Text>
        ) : (
          h.activeOrders.map(order => renderOrderCard(order, false))
        )}

        {!h.loading && (
          <View style={{ marginTop: 25 }}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.cancelledSectionTitle, { color: h.isDarkMode ? '#FFFFFF' : '#1C2434' }]}>Pedidos cancelados:</Text>
            </View>
            {h.cancelledOrders.length === 0 ? (
              <Text style={[styles.emptyText, { color: h.colors.textDark }]}>Não há pedidos cancelados, Uhuu 🥳</Text>
            ) : (
              h.cancelledOrders.map(order => renderOrderCard(order, true))
            )}
          </View>
        )}
      </ScrollView>

      <AdminBottomTabBar isDarkMode={h.isDarkMode} iconColorInactive={iconColorInactive} />

      <AdminUserMenu />
    </View>
  );
}
