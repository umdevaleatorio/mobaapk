import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { styles } from './AdminPDVBottomBar.styles';

interface AdminPDVBottomBarProps {
  isDarkMode: boolean;
  onClose: () => void;
}

export default function AdminPDVBottomBar({ isDarkMode, onClose }: AdminPDVBottomBarProps) {
  return (
    <View style={[
      styles.container,
      {
        backgroundColor: isDarkMode ? '#1E1E24' : '#ECECEC',
        borderTopColor: isDarkMode ? '#3E3E4A' : '#D2D2D2',
      }
    ]}>
      <TouchableOpacity
        style={styles.button}
        onPress={onClose}
        activeOpacity={0.8}
      >
        <Ionicons name="caret-back" size={18} color="#FFFFFF" style={styles.icon} />
        <Text style={styles.text}>Painel de vendas</Text>
      </TouchableOpacity>
    </View>
  );
}
