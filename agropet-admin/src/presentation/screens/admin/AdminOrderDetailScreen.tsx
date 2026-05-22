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
import { Feather, Ionicons } from '@expo/vector-icons';
import AdminHeader from '../../components/AdminHeader';
import { useTheme } from '../../contexts/ThemeContext';

export default function AdminOrderDetailScreen({ route, navigation }: any) {
  const { order } = route.params;
  const { colors, isDarkMode } = useTheme();

  const orderItems = order.order_items || [];
  const orderTotal = order.total || 0;
  const userData = order.users || {};

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

  // Data da compra
  const orderDateObj = new Date(order.created_at);
  const formattedDate = `${orderDateObj.getDate().toString().padStart(2, '0')}/${(orderDateObj.getMonth() + 1).toString().padStart(2, '0')}/${orderDateObj.getFullYear()}`;

  // Situação
  const isDelivered = order.status === 'completed';
  const isCancelled = order.status === 'cancelled';
  
  let lineColor = '#FF8A80'; 
  let textColor = '#D32F2F'; 
  let statusText = 'Pendente';
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

  // Endereço formatado
  const clientAddress = [
    userData.rua,
    userData.numero ? `Nº ${userData.numero}` : null,
    userData.bairro,
    userData.cep,
  ].filter(Boolean).join(', ');

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.white }]}>
      <StatusBar backgroundColor={colors.headerBackground} barStyle="light-content" />

      {/* ========== HEADER ========== */}
      <AdminHeader title="detalhes_pedido" />

      {/* ========== SUB-HEADER: Nº do Pedido ========== */}
      <View style={[styles.subHeader, { backgroundColor: isDarkMode ? '#18181C' : '#E8E9F0' }]}>
        <Text style={[styles.subHeaderLabel, { color: colors.textGray }]}>
          Nº do Pedido
        </Text>
        <Text style={[styles.subHeaderValue, { color: colors.textDark, fontWeight: 'bold' }]}>
          #{order.id.slice(0, 8).toUpperCase()}
        </Text>
      </View>

      {/* ========== LISTA DE PRODUTOS E STATUS ========== */}
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionListTitle, { color: colors.textDark, fontWeight: 'bold' }]}>
          Produtos do Pedido
        </Text>

        {orderItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="package" size={48} color={isDarkMode ? '#555' : '#CCC'} />
            <Text style={[styles.emptyText, { color: colors.textGray }]}>
              Nenhum produto encontrado neste pedido.
            </Text>
          </View>
        ) : (
          orderItems.map((item: any, index: number) => {
            const product = item.products || {};
            const quantity = item.quantity || 1;
            const unitPrice = item.unit_price || 0;

            return (
              <View
                key={item.product_id || index}
                style={[styles.productCard, { backgroundColor: isDarkMode ? '#2E2E38' : '#E3E4EB' }]}
              >
                {/* Foto do Produto */}
                <View style={[styles.photoContainer, { backgroundColor: isDarkMode ? '#18181C' : '#FFFFFF' }]}>
                  {product.image_url ? (
                    <Image
                      source={{ uri: product.image_url }}
                      style={styles.productImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.placeholderImage, { backgroundColor: isDarkMode ? '#2E2E38' : '#EAEAEA' }]}>
                      <Feather name="image" size={24} color={isDarkMode ? '#666' : '#BBB'} />
                    </View>
                  )}
                </View>

                {/* Informações do Produto */}
                <View style={styles.infoContainer}>
                  {/* Nome */}
                  <Text
                    style={[styles.productName, { color: colors.textDark, fontWeight: 'bold' }]}
                    numberOfLines={2}
                  >
                    {product.name || 'Produto'}
                  </Text>

                  {/* Quantidade e Preço Unitário */}
                  <View style={styles.priceRow}>
                    <View style={[styles.qtyBadge, { backgroundColor: isDarkMode ? '#1E1E24' : '#D4D5DC' }]}>
                      <Text style={[styles.qtyText, { color: colors.textDark }]}>
                        Qtd: {quantity}
                      </Text>
                    </View>
                    <Text style={[styles.unitPrice, { color: colors.textGray }]}>
                      R$ {unitPrice.toFixed(2)} un.
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}

        {/* ========== DATA DA COMPRA ========== */}
        <View style={styles.dateContainer}>
          <Text style={[styles.dateText, { color: colors.textGray }]}>
            Data da compra: {formattedDate}
          </Text>
        </View>

        {/* ========== STATUS CARD ========== */}
        <View style={[styles.statusCard, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.statusTitle, { color: colors.textDark, fontWeight: 'bold' }]}>
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
              isRightAligned ? { right: -5 } : { left: -5 },
              { backgroundColor: isDarkMode ? '#1E1E24' : '#FFFFFF' }
            ]}>
              <View style={[styles.circleInner, { borderColor: textColor, backgroundColor: isDarkMode ? '#1E1E24' : '#FFFFFF' }]} />
            </View>
          </View>

          {/* Label below track */}
          <View style={[styles.statusTextRow, { justifyContent: isRightAligned ? 'flex-end' : 'flex-start' }]}>
            <Text style={[styles.statusLabelText, { color: textColor }]}>
              {statusText}
            </Text>
          </View>
        </View>

        {/* ========== DADOS DO CLIENTE ========== */}
        <View style={[styles.clientCard, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.clientCardTitle, { color: colors.textDark, fontWeight: 'bold' }]}>Dados do Cliente</Text>
          
          <View style={styles.clientRow}>
            <Feather name="user" size={16} color={colors.textGray} />
            <Text style={[styles.clientLabel, { color: colors.textGray }]}>Nome:</Text>
            <Text style={[styles.clientValue, { color: colors.textDark, fontWeight: 'bold' }]} numberOfLines={1}>
              {userData.name || 'Não informado'}
            </Text>
          </View>

          <View style={styles.clientRow}>
            <Feather name="phone" size={16} color={colors.textGray} />
            <Text style={[styles.clientLabel, { color: colors.textGray }]}>Telefone:</Text>
            <Text style={[styles.clientValue, { color: colors.textDark, fontWeight: 'bold' }]} numberOfLines={1}>
              {userData.phone || 'Não informado'}
            </Text>
          </View>

          <View style={styles.clientRow}>
            <Feather name="map-pin" size={16} color={colors.textGray} />
            <Text style={[styles.clientLabel, { color: colors.textGray }]}>Endereço:</Text>
            <Text style={[styles.clientValue, { color: colors.textDark, fontWeight: 'bold' }]} numberOfLines={2}>
              {clientAddress || 'Não informado'}
            </Text>
          </View>
        </View>

        {/* ========== TOTAL DA VENDA ========== */}
        <View style={[styles.totalCard, { backgroundColor: isDarkMode ? '#1E1E24' : '#FAFAFA' }]}>
          <Text style={[styles.totalLabel, { color: colors.textDark, fontWeight: 'bold' }]}>Total de vendas</Text>
          <Text style={styles.totalValue}>
            R$ {Number(orderTotal).toFixed(2).replace('.', ',')}
          </Text>
        </View>

        {/* ========== BOTÃO VOLTAR ========== */}
        <TouchableOpacity
          style={styles.voltarBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="caret-back" size={16} color={colors.textDark} style={{ marginRight: 4 }} />
          <Text style={[styles.voltarText, { color: colors.textDark, fontWeight: 'bold' }]}>Voltar</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#E8E9F0',
  },
  subHeaderLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#767676',
  },
  subHeaderValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1C2434',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  statusCard: {
    minHeight: 160,
    borderRadius: 16,
    marginBottom: 12,
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
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
    color: '#1C2434',
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
  sectionListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C2434',
    marginBottom: 12,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#767676',
    textAlign: 'center',
  },
  productCard: {
    flexDirection: 'row',
    borderRadius: 15,
    marginBottom: 14,
    padding: 12,
    backgroundColor: '#E3E4EB',
    overflow: 'hidden',
  },
  photoContainer: {
    width: 90,
    height: 90,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#EAEAEA',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  productName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1C2434',
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
    backgroundColor: '#D4D5DC',
  },
  qtyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1C2434',
  },
  unitPrice: {
    fontSize: 12,
    color: '#767676',
  },

  // ========== DATA DA COMPRA ==========
  dateContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#767676',
  },

  // ========== DADOS DO CLIENTE ==========
  clientCard: {
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  clientCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C2434',
    marginBottom: 14,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  clientLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#767676',
  },
  clientValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1C2434',
  },

  // ========== TOTAL DA VENDA ==========
  totalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 16,
    marginBottom: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    backgroundColor: '#FAFAFA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C2434',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#339914',
  },

  // ========== BOTÃO VOLTAR ==========
  voltarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 15,
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  voltarText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1C2434',
  },
});
