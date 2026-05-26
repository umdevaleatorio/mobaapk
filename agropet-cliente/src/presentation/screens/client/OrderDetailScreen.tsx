import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
  Animated,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Feather } from '@expo/vector-icons';

function getFirstImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
    } catch (_) {}
  }
  return url;
}

export default function OrderDetailScreen({ route, navigation }: any) {
  const { isDarkMode, colors } = useTheme();
  const { order } = route.params;

  const orderItems = order.order_items || [];
  const orderTotal = order.total || 0;

  // Animação de brilho do status
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [glowAnim]);

  // Data
  const orderDateObj = new Date(order.created_at);
  const formattedDate = `${orderDateObj.getDate().toString().padStart(2, '0')}/${(orderDateObj.getMonth() + 1).toString().padStart(2, '0')}/${orderDateObj.getFullYear()}`;

  // Situação
  const isDelivered = order.status === 'completed';
  const isCancelled = order.status === 'cancelled';
  
  let lineColor = '#FF8A80'; 
  let textColor = '#D32F2F'; 
  let statusText = 'Em entrega';
  let isRightAligned = false;

  if (isDelivered) {
    lineColor = '#42A5F5'; 
    textColor = '#1976D2'; 
    statusText = 'Entregue';
    isRightAligned = true;
  } else if (isCancelled) {
    lineColor = '#BDBDBD';
    textColor = '#757575';
    statusText = 'Cancelado';
    isRightAligned = false;
  }

  return (
    <View style={[styles.mainContainer, { backgroundColor: isDarkMode ? '#121212' : '#F5F5F5' }]}>
      <StatusBar backgroundColor={isDarkMode ? '#1E1E24' : '#1C2434'} barStyle="light-content" />

      {/* ========== HEADER ========== */}
      <View style={[styles.header, { backgroundColor: isDarkMode ? '#1E1E24' : '#1C2434' }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Detalhes do Pedido
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ========== SUB-HEADER: Nº do Pedido ========== */}
      <View style={[styles.subHeader, { backgroundColor: isDarkMode ? '#1A1A22' : '#E8E9F0' }]}>
        <Text style={[styles.subHeaderLabel, { color: isDarkMode ? '#A8A8B3' : '#767676' }]}>
          Nº do Pedido
        </Text>
        <Text style={[styles.subHeaderValue, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>
          #{order.id.slice(0, 8).toUpperCase()}
        </Text>
      </View>

      {/* ========== LISTA DE PRODUTOS E STATUS ========== */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionListTitle, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>
          Produtos do Pedido
        </Text>

        {orderItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="package" size={48} color={isDarkMode ? '#3E3E4A' : '#CCC'} />
            <Text style={[styles.emptyText, { color: isDarkMode ? '#A8A8B3' : '#767676' }]}>
              Nenhum produto encontrado neste pedido.
            </Text>
          </View>
        ) : (
          orderItems.map((item: any, index: number) => {
            const product = item.products || {};
            const quantity = item.quantity || 1;
            const unitPrice = item.unit_price || 0;
            const subtotal = quantity * unitPrice;

            return (
              <View
                key={item.product_id || index}
                style={[
                  styles.productCard,
                  { backgroundColor: isDarkMode ? '#2E2E38' : '#E3E4EB' }
                ]}
              >
                {/* Foto do Produto */}
                <View style={[styles.photoContainer, { backgroundColor: isDarkMode ? '#1E1E24' : '#FFFFFF' }]}>
                  {product.image_url ? (
                    <Image
                      source={{ uri: getFirstImageUrl(product.image_url) || '' }}
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.placeholderImage, { backgroundColor: isDarkMode ? '#3A3A44' : '#EAEAEA' }]}>
                      <Feather name="image" size={24} color={isDarkMode ? '#555' : '#BBB'} />
                    </View>
                  )}
                </View>

                {/* Informações do Produto */}
                <View style={styles.infoContainer}>
                  {/* Nome */}
                  <Text
                    style={[styles.productName, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}
                    numberOfLines={2}
                  >
                    {product.name || 'Produto'}
                  </Text>

                  {/* Descrição */}
                  {product.description ? (
                    <Text
                      style={[styles.productDescription, { color: isDarkMode ? '#A8A8B3' : '#767676' }]}
                      numberOfLines={2}
                    >
                      {product.description}
                    </Text>
                  ) : null}

                  {/* Quantidade e Preço */}
                  <View style={styles.priceRow}>
                    <View style={[styles.qtyBadge, { backgroundColor: isDarkMode ? '#3E3E4A' : '#D4D5DC' }]}>
                      <Text style={[styles.qtyText, { color: isDarkMode ? '#FFE082' : '#1C2434' }]}>
                        Qtd: {quantity}
                      </Text>
                    </View>
                    <Text style={[styles.unitPrice, { color: isDarkMode ? '#A8A8B3' : '#767676' }]}>
                      R$ {unitPrice.toFixed(2)} un.
                    </Text>
                  </View>

                  {/* Subtotal */}
                  <Text style={[styles.subtotal, { color: isDarkMode ? '#81C784' : '#2A7420' }]}>
                    Subtotal: R$ {subtotal.toFixed(2)}
                  </Text>
                </View>
              </View>
            );
          })
        )}

        {/* ========== DATA DA COMPRA ========== */}
        <View style={[styles.dateContainer, { marginTop: 20 }]}>
          <Text style={[styles.dateText, { color: isDarkMode ? '#A8A8B3' : '#767676' }]}>
            Data da compra: {formattedDate}
          </Text>
        </View>

        {/* ========== STATUS CARD ========== */}
        <View style={[styles.statusCard, { backgroundColor: isDarkMode ? '#2E2E38' : '#F8F8F8' }]}>
          <Text style={[styles.statusTitle, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>
            Situação da entrega
          </Text>

          <View style={styles.trackContainer}>
            {/* Glow Line */}
            <Animated.View style={[
              styles.glowLine, 
              { 
                backgroundColor: lineColor, 
                shadowColor: lineColor,
                opacity: glowAnim 
              }
            ]} />
            
            {/* Base Line */}
            <View style={[styles.baseLine, { backgroundColor: lineColor }]} />

            {/* Circle */}
            <View style={[
              styles.circleOuter, 
              isRightAligned ? { right: -5 } : { left: -5 }
            ]}>
              <View style={[styles.circleInner, { borderColor: textColor }]} />
            </View>
          </View>

          {/* Label below track */}
          <View style={[styles.statusTextRow, { justifyContent: isRightAligned ? 'flex-end' : 'flex-start' }]}>
            <Text style={[styles.statusLabelText, { color: textColor }]}>
              {statusText}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ========== RODAPÉ: VALOR TOTAL ========== */}
      <View style={[styles.footer, { backgroundColor: isDarkMode ? '#1E1E24' : '#FFFFFF', borderTopColor: isDarkMode ? '#2D2D35' : '#E0E0E0' }]}>
        <View style={styles.footerContent}>
          <Text style={[styles.totalLabel, { color: isDarkMode ? '#A8A8B3' : '#767676' }]}>
            Valor Total do Pedido
          </Text>
          <Text style={[styles.totalValue, { color: isDarkMode ? '#81C784' : '#2A7420' }]}>
            R$ {Number(orderTotal).toFixed(2)}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.footerBackBtn, { backgroundColor: isDarkMode ? '#FFE082' : '#1C2434' }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={16} color={isDarkMode ? '#1C2434' : '#FFFFFF'} style={{ marginRight: 6 }} />
          <Text style={[styles.footerBackText, { color: isDarkMode ? '#1C2434' : '#FFFFFF' }]}>
            Voltar
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },

  // ========== HEADER ==========
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 54 : StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // ========== SUB-HEADER ==========
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  subHeaderLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  subHeaderValue: {
    fontSize: 15,
    fontWeight: 'bold',
  },

  // ========== SCROLL CONTENT ==========
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 180,
  },

  // ========== STATUS CARD ==========
  statusCard: {
    minHeight: 160,
    borderRadius: 16,
    marginBottom: 12,
    paddingVertical: 30,
    paddingHorizontal: 20,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
  },
  trackContainer: {
    height: 4,
    justifyContent: 'center',
    position: 'relative',
    marginHorizontal: 15,
  },
  baseLine: {
    height: 4,
    borderRadius: 2,
    width: '100%',
    position: 'absolute',
  },
  glowLine: {
    height: 12, 
    borderRadius: 6,
    width: '100%',
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: 4, 
  },
  circleOuter: {
    width: 24, 
    height: 24, 
    borderRadius: 12, 
    backgroundColor: '#FFFFFF', 
    alignItems: 'center', 
    justifyContent: 'center',
    position: 'absolute',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  circleInner: {
    width: 16, 
    height: 16, 
    borderRadius: 8, 
    borderWidth: 3, 
    backgroundColor: '#FFFFFF'
  },
  statusTextRow: {
    flexDirection: 'row', 
    marginTop: 18,
    marginHorizontal: 10,
  },
  statusLabelText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  
  // ========== DATA E SESSÃO ==========
  dateContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    marginLeft: 4,
  },

  // ========== EMPTY STATE ==========
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },

  // ========== PRODUCT CARD ==========
  productCard: {
    flexDirection: 'row',
    borderRadius: 15,
    marginBottom: 14,
    padding: 12,
    overflow: 'hidden',
  },
  photoContainer: {
    width: 90,
    height: 90,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  productName: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  productDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  qtyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  qtyText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  unitPrice: {
    fontSize: 12,
  },
  subtotal: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },

  // ========== FOOTER ==========
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerContent: {
    gap: 2,
  },
  totalLabel: {
    fontSize: 12,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  footerBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  footerBackText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
});
