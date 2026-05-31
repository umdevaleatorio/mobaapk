import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from '../AdminDashboardScreen.styles';

interface SundayHolidayModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SundayHolidayModal({ visible, onClose }: SundayHolidayModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.whiteModalContainer, { backgroundColor: '#FFFFFF' }]}>
          <View style={{ alignSelf: 'center', marginBottom: 16 }}>
            <Feather name="alert-triangle" size={48} color="#FF3B30" />
          </View>
          <Text style={[styles.whiteModalTitle, { color: '#1C2434' }]}>Aviso de Fechamento</Text>
          <Text style={[styles.whiteModalDesc, { color: '#767676', fontSize: 15, lineHeight: 22 }]}>
            Este dia foi domingo/feriado, portanto seus ganhos foram 0.
          </Text>
          <TouchableOpacity
            style={[styles.whiteModalBtnConfirm, { backgroundColor: '#FF3B30', marginTop: 8 }]}
            activeOpacity={0.7}
            onPress={onClose}
          >
            <Text style={styles.whiteModalBtnTextConfirm}>Entendido</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
