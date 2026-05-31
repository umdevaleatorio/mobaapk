import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';

interface OrderAlertModalProps {
  visible: boolean;
  isDarkMode: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export function OrderAlertModal({ visible, isDarkMode, title, message, onClose }: OrderAlertModalProps) {
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
              fontSize: 18,
              fontWeight: 'bold',
              color: isDarkMode ? '#FFFFFF' : '#1C2434',
              textAlign: 'center',
              marginBottom: 10,
            }}
          >
            {title}
          </Text>

          <Text
            style={{
              fontSize: 15,
              color: isDarkMode ? '#FFFFFF' : '#555555',
              textAlign: 'center',
              marginBottom: 24,
              lineHeight: 20,
            }}
          >
            {message}
          </Text>

          <TouchableOpacity
            style={{
              width: '60%',
              backgroundColor: '#2196F3',
              paddingVertical: 12,
              borderRadius: 10,
              alignItems: 'center',
            }}
            onPress={onClose}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 }}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
