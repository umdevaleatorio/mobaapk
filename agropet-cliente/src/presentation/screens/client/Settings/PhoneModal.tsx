import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal } from 'react-native';
import { styles } from './SettingsScreen.styles';

interface PhoneModalProps {
  visible: boolean;
  phoneStatus: 'cadastrar' | 'validar' | 'alterar';
  phoneInput: string;
  isDarkMode: boolean;
  colors: any;
  onClose: () => void;
  onConfirm: () => void;
  onChangePhoneInput: (v: string) => void;
}

const PhoneModal: React.FC<PhoneModalProps> = ({
  visible, phoneStatus, phoneInput,
  isDarkMode, colors, onClose, onConfirm, onChangePhoneInput,
}) => {
  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.whiteModalContainer, { backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF' }]}>
          <Text style={[styles.whiteModalTitle, { color: colors.textDark }]}>
            {phoneStatus === 'validar' ? 'Validar Telefone' : 'Digite seu telefone'}
          </Text>
          <Text style={[styles.whiteModalDesc, { color: isDarkMode ? '#A8A8B3' : '#767676' }]}>
            {phoneStatus === 'validar'
              ? 'Enviamos um código SMS para o seu número. (Simulação: clique em Confirmar para validar)'
              : 'Insira o número com DDD para continuar.'}
          </Text>

          <TextInput
            style={[styles.whiteModalInput, { backgroundColor: isDarkMode ? '#1E1E24' : '#F0F0F0', color: colors.textDark, borderColor: isDarkMode ? '#3E3E4A' : 'transparent' }]}
            placeholder={phoneStatus === 'validar' ? "Código SMS..." : "+55 (11) 99999-9999"}
            placeholderTextColor={isDarkMode ? '#8E8E93' : '#919191'}
            value={phoneInput}
            onChangeText={onChangePhoneInput}
            keyboardType="phone-pad"
          />

          <View style={styles.whiteModalButtons}>
            <TouchableOpacity style={[styles.whiteModalBtnCancel, { backgroundColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]} onPress={onClose}>
              <Text style={[styles.whiteModalBtnTextCancel, { color: isDarkMode ? '#FFFFFF' : '#767676' }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.whiteModalBtnConfirm, { backgroundColor: colors.accent }]} onPress={onConfirm}>
              <Text style={styles.whiteModalBtnTextConfirm}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default PhoneModal;
