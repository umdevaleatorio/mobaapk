import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import NumPedidoSvg from '../../../assets/tela11/em entrega 1/Nº do pedido.svg';
import RastrearSvg from '../../../assets/tela11/em entrega 1/Rastrear.svg';
import PixSvg from '../../../assets/tela11/em entrega 1/PIX.svg';
import DropMapa from '../../../assets/tela11/em entrega 1/selecionar rastreio/Ver pelo mapa.svg';
import DropSitua from '../../../assets/tela11/em entrega 1/selecionar rastreio/Ver pela situação.svg';
import { styles } from './OrdersScreen.styles';

const getPaymentDisplay = (paymentMethod: string, isDarkMode: boolean) => {
  switch (paymentMethod) {
    case 'pix':
      return <PixSvg width={30} height={13} />;
    case 'cartao_credito':
      return <Text style={[styles.pgtoText, { color: '#FF0000' }]}>Cartão/{'\n'}Crédito</Text>;
    case 'cartao_debito':
      return <Text style={[styles.pgtoText, { color: '#2A7420' }]}>Cartão/{'\n'}Débito</Text>;
    case 'dinheiro':
      return <Text style={[styles.pgtoText, { color: isDarkMode ? '#81C784' : '#164610' }]}>Dinheiro</Text>;
    default:
      return <Text style={styles.pgtoText}>{paymentMethod}</Text>;
  }
};

interface OrderCardProps {
  order: any;
  isPast?: boolean;
  navigation: any;
  isDarkMode: boolean;
  activeDropdownId: string | null;
  activeCancelDropdownId: string | null;
  trackingErrors: Record<string, string>;
  onToggleDropdown: (orderId: string) => void;
  onToggleCancelDropdown: (orderId: string) => void;
  onRequestCancel: (orderId: string) => void;
  getFirstImageUrl: (url: string | null | undefined) => string | null;
  onCloseDropdown: () => void;
  onCloseCancelDropdown: () => void;
}

export function OrderCard({
  order,
  isPast = false,
  navigation,
  isDarkMode,
  activeDropdownId,
  activeCancelDropdownId,
  trackingErrors,
  onToggleDropdown,
  onToggleCancelDropdown,
  onRequestCancel,
  getFirstImageUrl,
  onCloseDropdown,
  onCloseCancelDropdown,
}: OrderCardProps) {
  const firstItem = order.order_items?.[0];
  const imageUrl = getFirstImageUrl(firstItem?.products?.image_url);
  const isDropdownOpen = activeDropdownId === order.id;
  const isCancelDropdownOpen = activeCancelDropdownId === order.id;

  return (
    <View
      key={order.id}
      style={[
        styles.orderCard,
        {
          backgroundColor: isDarkMode ? '#2E2E38' : '#E3E4EB',
          zIndex: isDropdownOpen || isCancelDropdownOpen ? 9999 : 10,
        },
      ]}
    >
      <View style={styles.photoCol}>
        <View style={styles.photoBox}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.productImage} />
          ) : (
            <View style={styles.placeholderImg} />
          )}
        </View>
      </View>

      <View style={styles.numCol}>
        {isDarkMode ? (
          <Text style={[styles.cardTitleText, { color: '#FFFFFF', marginBottom: 15 }]}>N° do pedido</Text>
        ) : (
          <NumPedidoSvg width={68} height={12} style={{ marginBottom: 15 }} />
        )}
        <Text style={[styles.orderIdText, { color: isDarkMode ? '#FFFFFF' : '#000000' }]}>
          {order.id.slice(0, 8).toUpperCase()}
        </Text>
      </View>

      <View style={styles.pgtoCol}>
        <Text style={[styles.cardTitleText, { color: isDarkMode ? '#FFFFFF' : '#1C2434', marginBottom: 10, fontSize: 14.5 }]}>
          Forma de pagamento
        </Text>
        {getPaymentDisplay(order.payment_method, isDarkMode)}
      </View>

      <View style={styles.actionCol}>
        {isPast ? (
          <>
            <Text style={[styles.cardTitleText, { color: '#66BB6A', marginBottom: 15, fontSize: 13, textAlign: 'center' }]}>
              Pedido concluído
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('OrderDetailScreen', { order })}>
              <Text style={{ color: isDarkMode ? '#FFE082' : '#1C2434', fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>
                Detalhes
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity onPress={() => onToggleDropdown(order.id)}>
              <RastrearSvg width={57} height={14} />
            </TouchableOpacity>
            {trackingErrors[order.id] && (
              <Text style={{ color: '#FF3B30', fontSize: 9, fontWeight: 'bold', marginTop: 4, width: 85, textAlign: 'center', lineHeight: 12 }}>
                {trackingErrors[order.id]}
              </Text>
            )}
            <TouchableOpacity onPress={() => navigation.navigate('OrderDetailScreen', { order })} style={{ marginTop: 6 }}>
              <Text style={{ color: isDarkMode ? '#FFE082' : '#1C2434', fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>
                Detalhes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onToggleCancelDropdown(order.id)} style={{ marginTop: 6 }}>
              <Text style={{ color: isDarkMode ? '#FF8A80' : '#D32F2F', fontSize: 12, fontWeight: 'bold', textAlign: 'center' }}>
                Cancelar
              </Text>
            </TouchableOpacity>
            {isDropdownOpen && (
              <View style={[styles.dropdownBox, { backgroundColor: isDarkMode ? '#1E1E24' : '#E3E4EB', borderColor: isDarkMode ? '#3E3E4A' : '#CCC' }]}>
                <TouchableOpacity
                  style={styles.dropItemBtn}
                  onPress={() => {
                    onCloseDropdown();
                    navigation.navigate('ClientTabs', {
                      screen: 'Mapa',
                      params: { trackingOrderId: order.id },
                    });
                  }}
                >
                  {isDarkMode ? <Text style={styles.dropText}>Ver pelo mapa</Text> : <DropMapa width={83} height={10} />}
                </TouchableOpacity>
                <View style={[styles.dropSeparator, { backgroundColor: isDarkMode ? '#3E3E4A' : '#CCC' }]} />
                <TouchableOpacity
                  style={styles.dropItemBtn}
                  onPress={() => {
                    onCloseDropdown();
                    navigation.navigate('TrackingScreen');
                  }}
                >
                  {isDarkMode ? <Text style={styles.dropText}>Ver pela situação</Text> : <DropSitua width={93} height={12} />}
                </TouchableOpacity>
              </View>
            )}
            {isCancelDropdownOpen && (
              <View style={[styles.dropdownBox, { top: 95, backgroundColor: isDarkMode ? '#1E1E24' : '#E3E4EB', borderColor: isDarkMode ? '#3E3E4A' : '#CCC' }]}>
                <TouchableOpacity
                  style={styles.dropItemBtn}
                  onPress={() => onRequestCancel(order.id)}
                >
                  <Text style={{ fontSize: 11, fontWeight: 'bold', color: isDarkMode ? '#FF8A80' : '#D32F2F', textAlign: 'center' }}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>

      <View style={[styles.separatorLines, { left: 105, backgroundColor: isDarkMode ? '#3E3E4A' : '#F5F5F5' }]} />
      <View style={[styles.separatorLines, { left: 185, backgroundColor: isDarkMode ? '#3E3E4A' : '#F5F5F5' }]} />
      <View style={[styles.separatorLines, { left: 290, backgroundColor: isDarkMode ? '#3E3E4A' : '#F5F5F5' }]} />
    </View>
  );
}
