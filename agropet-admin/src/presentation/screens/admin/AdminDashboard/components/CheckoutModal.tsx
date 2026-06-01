import React, { useState } from 'react';
import {
  View, Text, Modal, ScrollView, TouchableOpacity,
  ActivityIndicator, Dimensions
} from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { styles } from '../AdminDashboardScreen.styles';
import { getFirstImageUrl } from '../../../../../utils/imageUtils';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface CheckoutModalProps {
  visible: boolean;
  pdvProducts: any[];
  pdvCart: Record<string, { qty: number; checked: boolean }>;
  checkoutPaymentMethod: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix';
  pdvLoading: boolean;
  isDarkMode: boolean;
  onClose: () => void;
  onPaymentMethodChange: (method: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix') => void;
  onConfirm: () => void;
}

export default function CheckoutModal({
  visible, pdvProducts, pdvCart, checkoutPaymentMethod,
  pdvLoading, isDarkMode, onClose, onPaymentMethodChange, onConfirm
}: CheckoutModalProps) {
  const [dropdownExpanded, setDropdownExpanded] = useState(false);

  const formatCurrency = (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.whiteModalContainer, { backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF', width: SCREEN_WIDTH * 0.95, maxHeight: '85%' }]}>
          <Text style={[styles.whiteModalTitle, { color: isDarkMode ? '#FFFFFF' : '#1C2434', marginBottom: 16 }]}>
            Resumo da venda
          </Text>

          <Text style={[styles.inputHeading, { color: isDarkMode ? '#FFFFFF' : '#1C2434', marginBottom: 8 }]}>
            Forma de Pagamento:
          </Text>
          <TouchableOpacity
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12,
              borderWidth: 1, borderColor: isDarkMode ? '#3E3E4A' : '#E3E4EB',
              backgroundColor: isDarkMode ? '#1E1E24' : '#F5F6FA', marginBottom: 12,
            }}
            onPress={() => setDropdownExpanded(!dropdownExpanded)}
            activeOpacity={0.7}
          >
            <Text style={{
              fontSize: 14, fontWeight: 'bold',
              color: checkoutPaymentMethod === 'dinheiro' ? (isDarkMode ? '#00E676' : '#1b5e20')
                : checkoutPaymentMethod === 'cartao_credito' ? '#A72424'
                : checkoutPaymentMethod === 'cartao_debito' ? '#4CAF50' : '#00BFA5',
            }}>
              {checkoutPaymentMethod === 'dinheiro' ? 'Dinheiro' :
                checkoutPaymentMethod === 'cartao_credito' ? 'Cartão de Crédito' :
                checkoutPaymentMethod === 'cartao_debito' ? 'Débito' : 'Pix'}
            </Text>
            <Feather name={dropdownExpanded ? "chevron-up" : "chevron-down"} size={16} color={isDarkMode ? '#FFFFFF' : '#1C2434'} />
          </TouchableOpacity>

          {dropdownExpanded && (
            <View style={{
              borderRadius: 12, borderWidth: 1, borderColor: isDarkMode ? '#3E3E4A' : '#E3E4EB',
              backgroundColor: isDarkMode ? '#1E1E24' : '#F5F6FA', padding: 6, marginBottom: 16, gap: 4
            }}>
              {(['dinheiro', 'cartao_credito', 'cartao_debito', 'pix'] as const).map((method) => {
                const isSelected = checkoutPaymentMethod === method;
                const label = method === 'dinheiro' ? 'Dinheiro' : method === 'cartao_credito' ? 'Cartão de Crédito' : method === 'cartao_debito' ? 'Débito' : 'Pix';
                const textColor = method === 'dinheiro' ? (isDarkMode ? '#00E676' : '#1b5e20') : method === 'cartao_credito' ? '#A72424' : method === 'cartao_debito' ? '#4CAF50' : '#00BFA5';
                return (
                  <TouchableOpacity
                    key={method} activeOpacity={0.7}
                    onPress={() => { onPaymentMethodChange(method); setDropdownExpanded(false); }}
                    style={{
                      paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8,
                      backgroundColor: isSelected ? (isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'transparent',
                      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: textColor }}>{label}</Text>
                    {isSelected && <Feather name="check" size={16} color={textColor} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <Text style={[styles.inputHeading, { color: isDarkMode ? '#FFFFFF' : '#1C2434', marginBottom: 8 }]}>Produtos:</Text>
          <ScrollView style={{ maxHeight: 260, marginBottom: 16 }}>
            {pdvProducts.filter(p => pdvCart[p.id]?.checked).map(item => {
              const qty = pdvCart[item.id].qty;
              return (
                <View key={item.id} style={{
                  flexDirection: 'row', backgroundColor: isDarkMode ? '#2E2E38' : '#1C2434',
                  borderRadius: 15, marginBottom: 12, height: 100,
                  alignItems: 'center', paddingHorizontal: 8,
                }}>
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{
                      width: 70, height: 70, backgroundColor: '#FFFFFF', borderRadius: 12,
                      alignItems: 'center', justifyContent: 'center',
                      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.2, shadowRadius: 1.5, elevation: 2, overflow: 'hidden',
                    }}>
                      {item.image_url ? (
                        <Image source={{ uri: 
                          /* istanbul ignore next */ getFirstImageUrl(item.image_url) || '' }} style={{ width: 70, height: 70 }} contentFit="cover" cachePolicy="disk" />
                      ) : (
                        <View style={{ width: 70, height: 70, backgroundColor: '#E0E0E0', borderRadius: 12 }} />
                      )}
                    </View>
                  </View>
                  <View style={{ width: 1, height: 100, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#F5F5F5' }} />
                  <View style={{ flex: 1.2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', marginBottom: 4, marginTop: -4 }}>
                      Nome do{"\n"}produto
                    </Text>
                    <Text style={{ fontSize: 12, color: '#FFE082', fontWeight: 'bold', textAlign: 'center' }} numberOfLines={2}>
                      {item.name}
                    </Text>
                  </View>
                  <View style={{ width: 1, height: 100, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#F5F5F5' }} />
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', marginBottom: 4, marginTop: -4 }}>Qtd</Text>
                    <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#00E676', textAlign: 'center' }}>{qty}</Text>
                  </View>
                  <View style={{ width: 1, height: 100, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.2)' : '#F5F5F5' }} />
                  <View style={{ flex: 1.2, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', marginBottom: 4, marginTop: -4 }}>Total</Text>
                    <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' }}>
                      {formatCurrency(item.price * qty)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={{
            flexDirection: 'row', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 20, paddingHorizontal: 8,
          }}>
            <Text style={{ color: '#00BFA5', fontSize: 16, fontWeight: 'bold' }}>Total da Venda:</Text>
            <Text style={{ color: '#00BFA5', fontSize: 22, fontWeight: 'bold' }}>
              {formatCurrency(pdvProducts.filter(p => pdvCart[p.id]?.checked).reduce((acc, curr) => acc + (curr.price * pdvCart[curr.id].qty), 0))}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10 }}>
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: '#E3E4EB', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
              onPress={onClose}
            >
              <Text style={{ color: '#A72424', fontWeight: 'bold', fontSize: 15 }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ flex: 1, backgroundColor: '#25BE36', paddingVertical: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
              onPress={onConfirm}
              disabled={pdvLoading}
            >
              {pdvLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 }}>Confirmar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
