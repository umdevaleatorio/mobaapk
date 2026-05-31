import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';

interface OrderCancelModalProps {
  visible: boolean;
  isDarkMode: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function OrderCancelModal({ visible, isDarkMode, onClose, onConfirm }: OrderCancelModalProps) {
  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
        <View
          style={{
            backgroundColor: isDarkMode ? '#1E1E24' : '#FFFFFF',
            borderRadius: 20,
            padding: 24,
            width: '80%',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
            borderWidth: isDarkMode ? 1 : 0,
            borderColor: isDarkMode ? '#2D2D35' : 'transparent',
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: 'bold',
              color: isDarkMode ? '#FFFFFF' : '#1C2434',
              textAlign: 'center',
              marginBottom: 24,
              lineHeight: 22,
            }}
          >
            Tem certeza que deseja cancelar esta entrega?
          </Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', gap: 12 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: isDarkMode ? '#2D2D35' : '#E3E4EB',
                paddingVertical: 12,
                borderRadius: 10,
                alignItems: 'center',
              }}
              onPress={onClose}
            >
              <Text style={{ color: isDarkMode ? '#A8A8B3' : '#767676', fontWeight: 'bold', fontSize: 15 }}>Não</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: isDarkMode ? '#FF5252' : '#D32F2F',
                paddingVertical: 12,
                borderRadius: 10,
                alignItems: 'center',
              }}
              onPress={onConfirm}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 }}>Sim, cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
