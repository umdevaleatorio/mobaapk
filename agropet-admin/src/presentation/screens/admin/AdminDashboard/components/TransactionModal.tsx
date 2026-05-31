import React from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput } from 'react-native';
import { styles } from '../AdminDashboardScreen.styles';

interface TransactionModalProps {
  visible: boolean;
  modalTransactionType: 'sangria' | 'suprimento';
  modalPaymentMethod: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix';
  formattedAmount: string;
  transactionDesc: string;
  isDarkMode: boolean;
  colors: any;
  onClose: () => void;
  onPaymentMethodChange: (method: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix') => void;
  onAmountChange: (text: string) => void;
  onDescChange: (text: string) => void;
  onConfirm: () => void;
}

export default function TransactionModal({
  visible, modalTransactionType, modalPaymentMethod,
  formattedAmount, transactionDesc, isDarkMode, colors,
  onClose, onPaymentMethodChange, onAmountChange, onDescChange, onConfirm
}: TransactionModalProps) {
  const labels = { dinheiro: 'Dinheiro', pix: 'Pix', cartao_credito: 'Crédito', cartao_debito: 'Débito' };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.whiteModalContainer, { backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF' }]}>
          <Text style={[styles.whiteModalTitle, { color: colors.textDark, textAlign: 'left', marginBottom: 8 }]}>
            {modalTransactionType === 'sangria' ? 'Realizar Sangria' : 'Realizar Suprimento'}
          </Text>
          <Text style={[styles.whiteModalDesc, { color: isDarkMode ? '#A8A8B3' : '#767676', textAlign: 'left', marginBottom: 16 }]}>
            {modalTransactionType === 'sangria'
              ? 'Retirada de dinheiro do caixa da loja para despesas.'
              : 'Entrada extra de dinheiro no caixa da loja.'}
          </Text>

          <Text style={[styles.inputHeading, { color: colors.textDark }]}>Meio de Pagamento:</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {(['dinheiro', 'pix', 'cartao_credito', 'cartao_debito'] as const).map((method) => {
              const isSelected = modalPaymentMethod === method;
              return (
                <TouchableOpacity
                  key={method} activeOpacity={0.7}
                  onPress={() => onPaymentMethodChange(method)}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, borderWidth: 1,
                    borderColor: isSelected ? (modalTransactionType === 'sangria' ? '#FF3B30' : '#4CAF50') : (isDarkMode ? '#3E3E4A' : '#E3E4EB'),
                    backgroundColor: isSelected
                      ? (modalTransactionType === 'sangria' ? 'rgba(255, 59, 48, 0.1)' : 'rgba(76, 175, 80, 0.1)')
                      : (isDarkMode ? '#1E1E24' : '#F5F6FA'),
                  }}
                >
                  <Text style={{
                    fontSize: 12, fontWeight: 'bold',
                    color: isSelected ? (modalTransactionType === 'sangria' ? '#FF3B30' : '#4CAF50') : (isDarkMode ? '#A8A8B3' : '#767676')
                  }}>
                    {labels[method]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.inputHeading, { color: colors.textDark }]}>
            Valor da {modalTransactionType === 'sangria' ? 'Retirada' : 'Entrada'}:
          </Text>
          <TextInput
            style={[styles.modalInput, { backgroundColor: isDarkMode ? '#1E1E24' : '#F5F6FA', color: colors.textDark }]}
            placeholder="R$ 0,00"
            placeholderTextColor={isDarkMode ? '#767676' : '#A8A8B3'}
            keyboardType="numeric"
            value={formattedAmount}
            onChangeText={onAmountChange}
          />

          <Text style={[styles.inputHeading, { color: colors.textDark, marginTop: 12 }]}>Motivo / Descrição:</Text>
          <TextInput
            style={[styles.modalInput, { backgroundColor: isDarkMode ? '#1E1E24' : '#F5F6FA', color: colors.textDark }]}
            placeholder={modalTransactionType === 'sangria' ? "Ex: Conta de água, Luz..." : "Ex: Troco inicial..."}
            placeholderTextColor={isDarkMode ? '#767676' : '#A8A8B3'}
            value={transactionDesc}
            onChangeText={onDescChange}
            maxLength={40}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, gap: 12 }}>
            <TouchableOpacity
              style={[styles.modalActionBtn, { backgroundColor: isDarkMode ? '#3E3E4A' : '#E0E0E0', flex: 1 }]}
              activeOpacity={0.7} onPress={onClose}
            >
              <Text style={[styles.modalActionBtnText, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalActionBtn, { backgroundColor: modalTransactionType === 'sangria' ? '#FF3B30' : '#4CAF50', flex: 1 }]}
              activeOpacity={0.7} onPress={onConfirm}
            >
              <Text style={[styles.modalActionBtnText, { color: '#FFFFFF' }]}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
