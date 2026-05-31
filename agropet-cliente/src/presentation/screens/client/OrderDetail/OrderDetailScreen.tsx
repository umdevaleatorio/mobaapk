import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StatusBar, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';

import { useOrderDetailScreen } from './useOrderDetailScreen';
import { styles } from './OrderDetailScreen.styles';

export default function OrderDetailScreen({ route, navigation }: any) {
  const h = useOrderDetailScreen(route);

  return (
    <View style={[styles.mainContainer, { backgroundColor: h.isDarkMode ? '#121212' : '#F5F5F5' }]}>
      <StatusBar backgroundColor={h.isDarkMode ? '#1E1E24' : '#1C2434'} barStyle="light-content" />

      <View style={[styles.header, { backgroundColor: h.isDarkMode ? '#1E1E24' : '#1C2434' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes do Pedido</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.subHeader, { backgroundColor: h.isDarkMode ? '#1A1A22' : '#E8E9F0' }]}>
        <Text style={[styles.subHeaderLabel, { color: h.isDarkMode ? '#A8A8B3' : '#767676' }]}>N° do Pedido</Text>
        <Text style={[styles.subHeaderValue, { color: h.isDarkMode ? '#FFFFFF' : '#1C2434' }]}>
          #{h.order.id.slice(0, 8).toUpperCase()}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionListTitle, { color: h.isDarkMode ? '#FFFFFF' : '#1C2434' }]}>
          Produtos do Pedido
        </Text>

        {h.orderItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="package" size={48} color={h.isDarkMode ? '#3E3E4A' : '#CCC'} />
            <Text style={[styles.emptyText, { color: h.isDarkMode ? '#A8A8B3' : '#767676' }]}>
              Nenhum produto encontrado neste pedido.
            </Text>
          </View>
        ) : (
          h.orderItems.map((item: any, index: number) => {
            const product = item.products || {};
            const quantity = item.quantity || 1;
            const unitPrice = item.unit_price || 0;
            const subtotal = quantity * unitPrice;

            return (
              <View key={item.product_id || index} style={[styles.productCard, { backgroundColor: h.isDarkMode ? '#2E2E38' : '#E3E4EB' }]}>
                <View style={[styles.photoContainer, { backgroundColor: h.isDarkMode ? '#1E1E24' : '#FFFFFF' }]}>
                  {product.image_url ? (
                    <Image source={{ uri: h.getFirstImageUrl(product.image_url) || '' }} style={styles.productImage} resizeMode="cover" />
                  ) : (
                    <View style={[styles.placeholderImage, { backgroundColor: h.isDarkMode ? '#3A3A44' : '#EAEAEA' }]}>
                      <Feather name="image" size={24} color={h.isDarkMode ? '#555' : '#BBB'} />
                    </View>
                  )}
                </View>

                <View style={styles.infoContainer}>
                  <Text style={[styles.productName, { color: h.isDarkMode ? '#FFFFFF' : '#1C2434' }]} numberOfLines={2}>
                    {product.name || 'Produto'}
                  </Text>

                  {product.description ? (
                    <Text style={[styles.productDescription, { color: h.isDarkMode ? '#A8A8B3' : '#767676' }]} numberOfLines={2}>
                      {product.description}
                    </Text>
                  ) : null}

                  <View style={styles.priceRow}>
                    <View style={[styles.qtyBadge, { backgroundColor: h.isDarkMode ? '#3E3E4A' : '#D4D5DC' }]}>
                      <Text style={[styles.qtyText, { color: h.isDarkMode ? '#FFE082' : '#1C2434' }]}>Qtd: {quantity}</Text>
                    </View>
                    <Text style={[styles.unitPrice, { color: h.isDarkMode ? '#A8A8B3' : '#767676' }]}>R$ {unitPrice.toFixed(2)} un.</Text>
                  </View>

                  <Text style={[styles.subtotal, { color: h.isDarkMode ? '#81C784' : '#2A7420' }]}>
                    Subtotal: R$ {subtotal.toFixed(2)}
                  </Text>
                </View>
              </View>
            );
          })
        )}

        <View style={[styles.dateContainer, { marginTop: 20 }]}>
          <Text style={[styles.dateText, { color: h.isDarkMode ? '#A8A8B3' : '#767676' }]}>
            Data da compra: {h.formattedDate}
          </Text>
        </View>

        <View style={[styles.statusCard, { backgroundColor: h.isDarkMode ? '#2E2E38' : '#F8F8F8' }]}>
          <Text style={[styles.statusTitle, { color: h.isDarkMode ? '#FFFFFF' : '#1C2434' }]}>
            Situação da entrega
          </Text>

          <View style={styles.trackContainer}>
            <Animated.View style={[styles.glowLine, { backgroundColor: h.lineColor, shadowColor: h.lineColor, opacity: h.glowAnim }]} />
            <View style={[styles.baseLine, { backgroundColor: h.lineColor }]} />
            <View style={[styles.circleOuter, h.isRightAligned ? { right: -5 } : { left: -5 }]}>
              <View style={[styles.circleInner, { borderColor: h.textColor }]} />
            </View>
          </View>

          <View style={[styles.statusTextRow, { justifyContent: h.isRightAligned ? 'flex-end' : 'flex-start' }]}>
            <Text style={[styles.statusLabelText, { color: h.textColor }]}>{h.statusText}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: h.isDarkMode ? '#1E1E24' : '#FFFFFF', borderTopColor: h.isDarkMode ? '#2D2D35' : '#E0E0E0' }]}>
        <View style={styles.footerContent}>
          <Text style={[styles.totalLabel, { color: h.isDarkMode ? '#A8A8B3' : '#767676' }]}>Valor Total do Pedido</Text>
          <Text style={[styles.totalValue, { color: h.isDarkMode ? '#81C784' : '#2A7420' }]}>
            R$ {Number(h.orderTotal).toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity style={[styles.footerBackBtn, { backgroundColor: h.isDarkMode ? '#FFE082' : '#1C2434' }]} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={16} color={h.isDarkMode ? '#1C2434' : '#FFFFFF'} style={{ marginRight: 6 }} />
          <Text style={[styles.footerBackText, { color: h.isDarkMode ? '#1C2434' : '#FFFFFF' }]}>Voltar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
