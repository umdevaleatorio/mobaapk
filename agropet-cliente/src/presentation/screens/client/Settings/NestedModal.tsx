import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { styles } from './SettingsScreen.styles';

interface NestedModalProps {
  visible: boolean;
  colors: any;
  isDarkMode: boolean;
  onClose: () => void;
}

const NestedModal: React.FC<NestedModalProps> = ({ visible, colors, isDarkMode, onClose }) => {
  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.modalOverlayNested}>
        <View style={[styles.whiteModalContainer, { backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF' }]}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.textDark, marginBottom: 12 }}>Atenção</Text>
          <Text style={{ fontSize: 16, color: isDarkMode ? '#FFFFFF' : '#000', marginBottom: 20 }}>
            A nova senha que você digitou é a mesma da antiga.
          </Text>
          <View style={{ alignItems: 'flex-end' }}>
            <TouchableOpacity
              style={{ backgroundColor: colors.accent, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}
              onPress={onClose}
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
