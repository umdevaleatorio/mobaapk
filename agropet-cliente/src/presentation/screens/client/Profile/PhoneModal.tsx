import React from 'react';
import { View, TextInput, Text, TouchableOpacity, Modal } from 'react-native';
import { styles } from './ProfileScreen.styles';

type Props = { h: any };

export default function PhoneModal({ h }: Props) {
  return (
    <Modal visible={h.showPhoneModal} transparent={true} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.whiteModalContainer, { backgroundColor: h.isDarkMode ? '#2E2E38' : '#FFFFFF' }]}>
          <Text style={[styles.whiteModalTitle, { color: h.colors.textDark }]}>
            {h.phoneStatus === 'validar' ? 'Validar Telefone' : 'Digite seu telefone'}
          </Text>
          <Text style={[styles.whiteModalDesc, { color: h.isDarkMode ? '#A8A8B3' : '#767676' }]}>
            {h.phoneStatus === 'validar'
              ? 'Enviamos um código SMS para o seu número. (Simulação: clique em Confirmar para validar)'
              : 'Insira o número com DDD para continuar.'}
          </Text>

          <TextInput
            style={[styles.whiteModalInput, { backgroundColor: h.isDarkMode ? '#1E1E24' : '#F0F0F0', color: h.colors.textDark, borderColor: h.isDarkMode ? '#3E3E4A' : 'transparent' }]}
            placeholder={h.phoneStatus === 'validar' ? 'Código SMS...' : '+55 (11) 99999-9999'}
            placeholderTextColor={h.isDarkMode ? '#8E8E93' : '#919191'}
            value={h.phoneInput}
            onChangeText={h.setPhoneInput}
            keyboardType="phone-pad"
          />

          <View style={styles.whiteModalButtons}>
            <TouchableOpacity style={[styles.whiteModalBtnCancel, { backgroundColor: h.isDarkMode ? '#3E3E4A' : '#E3E4EB' }]} onPress={() => h.setShowPhoneModal(false)}>
              <Text style={[styles.whiteModalBtnTextCancel, { color: h.isDarkMode ? '#FF6B6B' : '#FF3B30' }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.whiteModalBtnConfirm} onPress={h.handleConfirmPhone}>
              <Text style={styles.whiteModalBtnTextConfirm}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
