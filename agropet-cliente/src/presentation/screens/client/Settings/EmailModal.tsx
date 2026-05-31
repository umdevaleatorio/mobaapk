import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal } from 'react-native';
import { styles } from './SettingsScreen.styles';

interface EmailModalProps {
  visible: boolean;
  emailStatus: 'validar' | 'alterar';
  emailInput: string;
  emailCode: string;
  emailError: string;
  isDarkMode: boolean;
  colors: any;
  onClose: () => void;
  onConfirm: () => void;
  onChangeEmailInput: (v: string) => void;
  onChangeEmailCode: (v: string) => void;
}

const EmailModal: React.FC<EmailModalProps> = ({
  visible, emailStatus, emailInput, emailCode, emailError,
  isDarkMode, colors, onClose, onConfirm,
  onChangeEmailInput, onChangeEmailCode,
}) => {
  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.whiteModalContainer, { backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF' }]}>
          <Text style={[styles.whiteModalTitle, { color: colors.textDark }]}>
            {emailStatus === 'validar' ? 'Validar E-mail' : 'Alterar E-mail'}
          </Text>
          <Text style={[styles.whiteModalDesc, { color: isDarkMode ? '#A8A8B3' : '#767676' }]}>
            {emailStatus === 'validar'
              ? 'Verifique a caixa de entrada do seu novo e-mail para pegar o código.'
              : 'Insira o novo endereço de e-mail.'}
          </Text>
          {!!emailError && (
            <Text style={styles.usernameErrorMsg}>{emailError}</Text>
          )}
          {emailStatus === 'validar' ? (
            <TextInput
              style={[styles.whiteModalInput, { backgroundColor: isDarkMode ? '#1E1E24' : '#F0F0F0', color: colors.textDark, borderColor: isDarkMode ? '#3E3E4A' : 'transparent' }, emailError ? styles.inputError : null]}
              placeholder="Código de 8 dígitos..."
              placeholderTextColor={isDarkMode ? '#8E8E93' : '#919191'}
              value={emailCode}
              onChangeText={onChangeEmailCode}
              keyboardType="numeric"
            />
          ) : (
            <TextInput
              style={[styles.whiteModalInput, { backgroundColor: isDarkMode ? '#1E1E24' : '#F0F0F0', color: colors.textDark, borderColor: isDarkMode ? '#3E3E4A' : 'transparent' }, emailError ? styles.inputError : null]}
              placeholder="novo@email.com"
              placeholderTextColor={isDarkMode ? '#8E8E93' : '#919191'}
              value={emailInput}
              onChangeText={onChangeEmailInput}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          )}
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

export default EmailModal;
