import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from './OrderListItem.styles';

interface OrderListItemProps {
  order: any;
  isDarkMode: boolean;
  colors: any;
  getPaymentDisplay: (method: string) => React.ReactNode;
  formatCurrency: (val: number) => string;
  navigation: any;
  handleEditPaymentMethod: (order: any) => void;
  handleCancelOrder: (order: any) => void;
}

export const OrderListItem = ({
  order,
  isDarkMode,
  colors,
  getPaymentDisplay,
  formatCurrency,
  navigation,
  handleEditPaymentMethod,
  handleCancelOrder,
}: OrderListItemProps) => {
  const isCancelled = order.status === 'cancelled';
  const shortId = order.id.slice(0, 8).toUpperCase();
  const clientName = order.delivery_address === 'Venda Física PDV' ? 'Venda Física (PDV)' : (order.users?.name || 'Cliente');

  return (
    <View style={[styles.saleCard, { backgroundColor: isDarkMode ? '#2E2E38' : '#1C2434' }, isCancelled && { opacity: 0.6 }]}>
      <View style={styles.cardHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Feather name="shopping-bag" size={14} color="#FFE082" />
          <Text style={styles.orderIdText}>Pedido #{shortId}</Text>
        </View>
        <View style={styles.badgeContainer}>
          {isCancelled ? (
            <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,82,82,0.15)' }]}>
              <Text style={[styles.statusBadgeText, { color: '#FF5252' }]}>Cancelado</Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: 'rgba(0,230,118,0.15)' }]}>
              <Text style={[styles.statusBadgeText, { color: '#00E676' }]}>Concluído</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.cardInfoGrid}>
        <View style={styles.infoCol}>
          <Text style={styles.colHeader}>Cliente</Text>
          <Text style={styles.colVal} numberOfLines={1}>{clientName}</Text>
        </View>
        <View style={[styles.infoCol, { alignItems: 'center' }]}>
          <Text style={styles.colHeader}>Forma de Pagamento</Text>
          {getPaymentDisplay(order.payment_method)}
        </View>
        <View style={[styles.infoCol, { alignItems: 'flex-end' }]}>
          <Text style={styles.colHeader}>Total da Venda</Text>
          <Text style={styles.totalValText}>{formatCurrency(order.total ?? 0)}</Text>
        </View>
      </View>
      <View style={styles.actionRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.actionBtn, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
          onPress={() => navigation.navigate('AdminOrderDetailScreen', { order })}
        >
          <Feather name="eye" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={styles.actionBtnText}>Ver Detalhes</Text>
        </TouchableOpacity>
        {!isCancelled && (
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.actionBtn, { backgroundColor: 'rgba(255, 224, 130, 0.15)' }]}
            onPress={() => handleEditPaymentMethod(order)}
          >
            <Feather name="edit" size={14} color="#FFE082" style={{ marginRight: 4 }} />
            <Text style={[styles.actionBtnText, { color: '#FFE082' }]}>Mudar Pgto</Text>
          </TouchableOpacity>
        )}
        {!isCancelled && (
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.actionBtn, { backgroundColor: 'rgba(255, 82, 82, 0.15)' }]}
            onPress={() => handleCancelOrder(order)}
          >
            <Feather name="trash-2" size={14} color="#FF5252" style={{ marginRight: 4 }} />
            <Text style={[styles.actionBtnText, { color: '#FF5252' }]}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
