import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
  Animated,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import AdminHeader from '../../../components/AdminHeader';
import { useAdminOrderDetail } from './useAdminOrderDetail';
import { styles } from './styles';

export default function AdminOrderDetailScreen({ route, navigation }: any) {
  const h = useAdminOrderDetail({ route, navigation });

  return (
    <View style={[styles.mainContainer, { backgroundColor: h.colors.white }]}>
      <StatusBar backgroundColor={h.colors.headerBackground} barStyle="light-content" />

      <AdminHeader title="detalhes_pedido" />

      <View style={[styles.subHeader, { backgroundColor: h.isDarkMode ? '#18181C' : '#E8E9F0' }]}>
        <Text style={[styles.subHeaderLabel, { color: h.colors.textGray }]}>
          N° do Pedido
        </Text>
        <Text style={[styles.subHeaderValue, { color: h.colors.textDark, fontWeight: 'bold' }]}>
          #{h.order.id.slice(0, 8).toUpperCase()}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionListTitle, { color: h.colors.textDark, fontWeight: 'bold' }]}>
          Produtos do Pedido
        </Text>

        {h.orderItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="package" size={48} color={h.isDarkMode ? '#555' : '#CCC'} />
            <Text style={[styles.emptyText, { color: h.colors.textGray }]}>
              Nenhum produto encontrado neste pedido.
            </Text>
          </View>
        ) : (
          h.orderItems.map((item: any, index: number) => {
            const product = item.products || {};
            const quantity = item.quantity || 1;
            const unitPrice = item.unit_price || 0;

            return (
              <View
                key={item.product_id || index}
                style={[styles.productCard, { backgroundColor: h.isDarkMode ? '#2E2E38' : '#E3E4EB' }]}
              >
                <View style={[styles.photoContainer, { backgroundColor: h.isDarkMode ? '#18181C' : '#FFFFFF' }]}>
                  {product.image_url ? (
                    <Image
                      source={{ uri: h.getFirstImageUrl(product.image_url) || '' }}
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.placeholderImage, { backgroundColor: h.isDarkMode ? '#2E2E38' : '#EAEAEA' }]}>
                      <Feather name="image" size={24} color={h.isDarkMode ? '#666' : '#BBB'} />
                    </View>
                  )}
                </View>

                <View style={styles.infoContainer}>
                  <Text
                    style={[styles.productName, { color: h.colors.textDark, fontWeight: 'bold' }]}
                    numberOfLines={2}
                  >
                    {product.name || 'Produto'}
                  </Text>

                  <View style={styles.priceRow}>
                    <View style={[styles.qtyBadge, { backgroundColor: h.isDarkMode ? '#1E1E24' : '#D4D5DC' }]}>
                      <Text style={[styles.qtyText, { color: h.colors.textDark }]}>
                        Qtd: {quantity}
                      </Text>
                    </View>
                    <Text style={[styles.unitPrice, { color: h.colors.textGray }]}>
                      R$ {unitPrice.toFixed(2)} un.
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}

        <View style={styles.dateContainer}>
          <Text style={[styles.dateText, { color: h.colors.textGray }]}>
            Data da compra: {h.formattedDate}
          </Text>
        </View>

        <View style={[styles.statusCard, { backgroundColor: h.colors.cardBackground }]}>
          <Text style={[styles.statusTitle, { color: h.colors.textDark, fontWeight: 'bold' }]}>
            Situação da entrega
          </Text>

          <View style={styles.trackContainer}>
            <Animated.View style={[
              styles.glowLine,
              {
                backgroundColor: h.lineColor,
                shadowColor: h.lineColor,
                opacity: h.glowAnim,
              }
            ]} />

            <View style={[styles.baseLine, { backgroundColor: h.lineColor }]} />

            <View style={[
              styles.circleOuter,
              h.isRightAligned ? { right: -5 } : { left: -5 },
              { backgroundColor: h.isDarkMode ? '#1E1E24' : '#FFFFFF' }
            ]}>
              <View style={[styles.circleInner, { borderColor: h.textColor, backgroundColor: h.isDarkMode ? '#1E1E24' : '#FFFFFF' }]} />
            </View>
          </View>

          <View style={[styles.statusTextRow, { justifyContent: h.isRightAligned ? 'flex-end' : 'flex-start' }]}>
            <Text style={[styles.statusLabelText, { color: h.textColor }]}>
              {h.statusText}
            </Text>
          </View>
        </View>

        <View style={[styles.clientCard, { backgroundColor: h.colors.cardBackground }]}>
          <Text style={[styles.clientCardTitle, { color: h.colors.textDark, fontWeight: 'bold' }]}>Dados do Cliente</Text>

          <View style={styles.clientRow}>
            <Feather name="user" size={16} color={h.colors.textGray} />
            <Text style={[styles.clientLabel, { color: h.colors.textGray }]}>Nome:</Text>
            <Text style={[styles.clientValue, { color: h.colors.textDark, fontWeight: 'bold' }]} numberOfLines={1}>
              {h.isPhysicalPDV ? 'Venda Presencial (Balcão)' : (h.userData.name || 'Não informado')}
            </Text>
          </View>

          <View style={styles.clientRow}>
            <Feather name="phone" size={16} color={h.colors.textGray} />
            <Text style={[styles.clientLabel, { color: h.colors.textGray }]}>Telefone:</Text>
            <Text style={[styles.clientValue, { color: h.colors.textDark, fontWeight: 'bold' }]} numberOfLines={1}>
              {h.isPhysicalPDV ? 'Não aplicável' : (h.userData.phone || 'Não informado')}
            </Text>
          </View>

          <View style={styles.clientRow}>
            <Feather name="map-pin" size={16} color={h.colors.textGray} />
            <Text style={[styles.clientLabel, { color: h.colors.textGray }]}>Endereço:</Text>
            <Text style={[styles.clientValue, { color: h.colors.textDark, fontWeight: 'bold' }]} numberOfLines={2}>
              {h.clientAddress || 'Não informado'}
            </Text>
          </View>
        </View>

        <View style={[styles.totalCard, { backgroundColor: h.isDarkMode ? '#1E1E24' : '#FAFAFA' }]}>
          <Text style={[styles.totalLabel, { color: h.colors.textDark, fontWeight: 'bold' }]}>Total de vendas</Text>
          <Text style={styles.totalValue}>
            R$ {Number(h.orderTotal).toFixed(2).replace('.', ',')}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.voltarBtn}
          onPress={h.handleGoBack}
          activeOpacity={0.7}
        >
          <Ionicons name="caret-back" size={16} color={h.isDarkMode ? '#FFE082' : h.colors.textDark} style={{ marginRight: 4 }} />
          <Text style={[styles.voltarText, { color: h.isDarkMode ? '#FFE082' : h.colors.textDark, fontWeight: 'bold' }]}>Voltar</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}
