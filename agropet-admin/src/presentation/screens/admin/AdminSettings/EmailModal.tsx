import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal } from 'react-native';
import { styles } from './AdminSettingsScreen.styles';

interface EmailModalProps {
  h: any;
}

const EmailModal: React.FC<EmailModalProps> = ({ h }) => {
  return (
    <Modal visible={h.showEmailModal} transparent={true} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.whiteModalContainer, { backgroundColor: h.colors.white }]}>
          <Text style={[styles.whiteModalTitle, { color: h.colors.textDark }]}>
            {h.emailStatus === 'validar' ? 'Validar E-mail' : 'Alterar E-mail'}
          </Text>
          <Text style={[styles.whiteModalDesc, { color: h.isDarkMode ? '#A8A8B3' : '#767676' }]}>
            {h.emailStatus === 'validar'
              ? 'Verifique a caixa de entrada do seu novo e-mail para pegar o código.'
              : 'Insira o novo endereço de e-mail.'}
          </Text>
          {!!h.emailError && (
            <Text style={styles.usernameErrorMsg}>{h.emailError}</Text>
          )}
          {h.emailStatus === 'validar' ? (
            <TextInput
              style={[
                styles.whiteModalInput,
                {
                  backgroundColor: h.isDarkMode ? '#1E1E24' : '#F0F0F0',
                  color: h.colors.textDark,
                  borderColor: h.isDarkMode ? '#3E3E4A' : 'transparent'
                },
                h.emailError ? styles.inputError : null
              ]}
              placeholder="Código de 6 dígitos..."
              placeholderTextColor={h.isDarkMode ? '#8E8E93' : '#919191'}
              value={h.emailCode}
              onChangeText={h.setEmailCode}
              keyboardType="numeric"
            />
          ) : (
            <TextInput
              style={[
                styles.whiteModalInput,
                {
                  backgroundColor: h.isDarkMode ? '#1E1E24' : '#F0F0F0',
                  color: h.colors.textDark,
                  borderColor: h.isDarkMode ? '#3E3E4A' : 'transparent'
                },
                h.emailError ? styles.inputError : null
              ]}
              placeholder="novo@email.com"
              placeholderTextColor={h.isDarkMode ? '#8E8E93' : '#919191'}
              value={h.emailInput}
              onChangeText={h.setEmailInput}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          )}
          <View style={styles.whiteModalButtons}>
            <TouchableOpacity
              style={[styles.whiteModalBtnCancel, { backgroundColor: h.isDarkMode ? '#3E3E4A' : '#E3E4EB' }]}
              onPress={() => h.setShowEmailModal(false)}
            >
              <Text style={[styles.whiteModalBtnTextCancel, { color: h.isDarkMode ? '#FFFFFF' : '#767676' }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.whiteModalBtnConfirm, { backgroundColor: h.colors.accent }]} onPress={h.handleConfirmEmail}>
              <Text style={styles.whiteModalBtnTextConfirm}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default EmailModal;
