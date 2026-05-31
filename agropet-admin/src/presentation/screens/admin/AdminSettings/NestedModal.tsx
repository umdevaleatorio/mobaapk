import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { styles } from './AdminSettingsScreen.styles';

interface NestedModalProps {
  h: any;
}

const NestedModal: React.FC<NestedModalProps> = ({ h }) => {
  return (
    <Modal visible={h.showNestedModal} transparent={true} animationType="fade">
      <View style={styles.modalOverlayNested}>
        <View style={[styles.whiteModalContainer, { backgroundColor: h.colors.white }]}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: h.colors.textDark, marginBottom: 12 }}>Atenção</Text>
          <Text style={{ fontSize: 16, color: h.isDarkMode ? '#FFFFFF' : '#000', marginBottom: 20 }}>
            A nova senha que você digitou é a mesma da antiga.
          </Text>
          <View style={{ alignItems: 'flex-end' }}>
            <TouchableOpacity
              style={{ backgroundColor: h.colors.accent, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}
              onPress={() => h.setShowNestedModal(false)}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 }}>FECHAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default NestedModal;
