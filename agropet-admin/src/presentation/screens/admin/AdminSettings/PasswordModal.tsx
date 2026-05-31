import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from './AdminSettingsScreen.styles';

interface PasswordModalProps {
  h: any;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ h }) => {
  return (
    <Modal visible={h.showPasswordModal} transparent={true} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.whiteModalContainer, { backgroundColor: h.colors.white }]}>
          <Text style={[styles.whiteModalTitle, { color: h.colors.textDark }]}>Alterar Senha</Text>
          <Text style={[styles.whiteModalDesc, { color: h.isDarkMode ? '#A8A8B3' : '#767676' }]}>
            Preencha os campos abaixo e solicite o código de segurança para confirmar.
          </Text>

          {!!h.passwordError && h.passwordError !== 'same_password' && (
            <Text style={styles.usernameErrorMsg}>{h.passwordError}</Text>
          )}

          <View style={{ gap: 10 }}>
            {/* Senha Atual */}
            <View style={[
              styles.whiteModalInputWrapper,
              { backgroundColor: h.isDarkMode ? '#1E1E24' : '#F0F0F0', borderColor: h.isDarkMode ? '#3E3E4A' : 'transparent' },
              (h.passwordError === 'Senha incorreta!' || h.passwordError === 'same_password') ? styles.inputError : null
            ]}>
              <TextInput
                style={[styles.whiteModalInputFlex, { color: h.colors.textDark }]}
                placeholder="Senha atual"
                placeholderTextColor={h.isDarkMode ? '#8E8E93' : '#919191'}
                secureTextEntry={!h.showCurrentPassword}
                value={h.currentPassword}
                onChangeText={h.setCurrentPassword}
              />
              <TouchableOpacity onPress={() => h.setShowCurrentPassword(!h.showCurrentPassword)}>
                <Feather name={h.showCurrentPassword ? 'eye' : 'eye-off'} size={20} color={h.isDarkMode ? '#FFFFFF' : '#1C2434'} />
              </TouchableOpacity>
            </View>

            {/* Nova Senha */}
            <View style={[
              styles.whiteModalInputWrapper,
              { backgroundColor: h.isDarkMode ? '#1E1E24' : '#F0F0F0', borderColor: h.isDarkMode ? '#3E3E4A' : 'transparent' },
              (h.passwordError === 'As senhas não coincidem!' || h.passwordError === 'same_password') ? styles.inputError : (h.isPasswordMatch && h.passwordError !== 'same_password' ? { borderColor: '#4CAF50' } : null)
            ]}>
              <TextInput
                style={[styles.whiteModalInputFlex, { color: h.colors.textDark }]}
                placeholder="Nova senha"
                placeholderTextColor={h.isDarkMode ? '#8E8E93' : '#919191'}
                secureTextEntry={!h.showNewPassword}
                value={h.newPassword}
                onChangeText={h.setNewPassword}
              />
              <TouchableOpacity onPress={() => h.setShowNewPassword(!h.showNewPassword)}>
                <Feather name={h.showNewPassword ? 'eye' : 'eye-off'} size={20} color={h.isDarkMode ? '#FFFFFF' : '#1C2434'} />
              </TouchableOpacity>
            </View>
            {h.passwordError === 'same_password' && (
              <Text style={[styles.usernameErrorMsg, { textAlign: 'left', marginLeft: 4, marginTop: -4 }]}>A nova senha que você digitou é a mesma da senha antiga!</Text>
            )}

            {/* Confirmar Nova Senha */}
            <View style={[
              styles.whiteModalInputWrapper,
              { backgroundColor: h.isDarkMode ? '#1E1E24' : '#F0F0F0', borderColor: h.isDarkMode ? '#3E3E4A' : 'transparent' },
              (h.passwordError === 'As senhas não coincidem!' || h.passwordError === 'same_password') ? styles.inputError : (h.isPasswordMatch && h.passwordError !== 'same_password' ? { borderColor: '#4CAF50' } : null)
            ]}>
              <TextInput
                style={[styles.whiteModalInputFlex, { color: h.colors.textDark }]}
                placeholder="Confirmar nova senha"
                placeholderTextColor={h.isDarkMode ? '#8E8E93' : '#919191'}
                secureTextEntry={!h.showConfirmNewPassword}
                value={h.confirmNewPassword}
                onChangeText={h.setConfirmNewPassword}
              />
              <TouchableOpacity onPress={() => h.setShowConfirmNewPassword(!h.showConfirmNewPassword)}>
                <Feather name={h.showConfirmNewPassword ? 'eye' : 'eye-off'} size={20} color={h.isDarkMode ? '#FFFFFF' : '#1C2434'} />
              </TouchableOpacity>
            </View>

            {/* Código OTP + Botão Mandar */}
            <View style={[
              styles.whiteModalInputWrapper,
              { backgroundColor: h.isDarkMode ? '#1E1E24' : '#F0F0F0', borderColor: h.isDarkMode ? '#3E3E4A' : 'transparent' },
              (h.passwordError === 'Você precisa mandar o código primeiro!' || h.passwordError === 'Código inválido!') ? styles.inputError : null
            ]}>
              <TextInput
                style={[styles.whiteModalInputFlex, { color: h.colors.textDark }]}
                placeholder="Código de 6 dígitos"
                placeholderTextColor={h.isDarkMode ? '#8E8E93' : '#919191'}
                keyboardType="numeric"
                value={h.passwordCode}
                onChangeText={h.setPasswordCode}
              />
              <TouchableOpacity onPress={h.handleSendOtpCode} style={{ paddingHorizontal: 8, paddingVertical: 8, marginLeft: 8 }}>
                <Text style={{ color: h.isDarkMode ? '#5B86E5' : '#042A7D', fontWeight: 'bold', fontSize: 14 }}>Mandar</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.whiteModalButtons}>
            <TouchableOpacity
              style={[styles.whiteModalBtnCancel, { backgroundColor: h.isDarkMode ? '#3E3E4A' : '#E3E4EB' }]}
              onPress={() => h.setShowPasswordModal(false)}
            >
              <Text style={[styles.whiteModalBtnTextCancel, { color: h.isDarkMode ? '#FFFFFF' : '#767676' }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.whiteModalBtnConfirm, { backgroundColor: h.colors.accent }]} onPress={h.handleConfirmFinal}>
              <Text style={styles.whiteModalBtnTextConfirm}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default PasswordModal;
