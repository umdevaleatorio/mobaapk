import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from './SettingsScreen.styles';

interface PasswordModalProps {
  visible: boolean;
  passwordError: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  passwordCode: string;
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  showConfirmNewPassword: boolean;
  isPasswordMatch: boolean;
  isDarkMode: boolean;
  colors: any;
  onClose: () => void;
  onChangeCurrentPassword: (v: string) => void;
  onChangeNewPassword: (v: string) => void;
  onChangeConfirmNewPassword: (v: string) => void;
  onChangePasswordCode: (v: string) => void;
  onToggleShowCurrent: () => void;
  onToggleShowNew: () => void;
  onToggleShowConfirm: () => void;
  handleSendOtpCode: () => void;
  handleConfirmFinal: () => void;
}

const PasswordModal: React.FC<PasswordModalProps> = ({
  visible, passwordError, currentPassword, newPassword, confirmNewPassword,
  passwordCode, showCurrentPassword, showNewPassword, showConfirmNewPassword,
  isPasswordMatch, isDarkMode, colors,
  onClose, onChangeCurrentPassword, onChangeNewPassword, onChangeConfirmNewPassword,
  onChangePasswordCode, onToggleShowCurrent, onToggleShowNew, onToggleShowConfirm,
  handleSendOtpCode, handleConfirmFinal,
}) => {
  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.whiteModalContainer, { backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF' }]}>
          <Text style={[styles.whiteModalTitle, { color: colors.textDark }]}>Alterar Senha</Text>
          <Text style={[styles.whiteModalDesc, { color: isDarkMode ? '#A8A8B3' : '#767676' }]}>
            Preencha os campos abaixo e solicite o código de segurança para confirmar.
          </Text>

          {!!passwordError && passwordError !== 'same_password' && (
            <Text style={styles.usernameErrorMsg}>{passwordError}</Text>
          )}

          <View style={{ gap: 10 }}>
            <View style={[styles.whiteModalInputWrapper, { backgroundColor: isDarkMode ? '#1E1E24' : '#F0F0F0', borderColor: isDarkMode ? '#3E3E4A' : 'transparent' }, (passwordError === 'Senha incorreta!' || passwordError === 'same_password') ? styles.inputError : null]}>
              <TextInput
                style={[styles.whiteModalInputFlex, { color: colors.textDark }]}
                placeholder="Senha atual"
                placeholderTextColor={isDarkMode ? '#8E8E93' : '#919191'}
                secureTextEntry={!showCurrentPassword}
                value={currentPassword}
                onChangeText={onChangeCurrentPassword}
              />
              <TouchableOpacity onPress={onToggleShowCurrent}>
                <Feather name={showCurrentPassword ? 'eye' : 'eye-off'} size={20} color={isDarkMode ? '#FFFFFF' : '#1C2434'} />
              </TouchableOpacity>
            </View>

            <View style={[styles.whiteModalInputWrapper, { backgroundColor: isDarkMode ? '#1E1E24' : '#F0F0F0', borderColor: isDarkMode ? '#3E3E4A' : 'transparent' }, (passwordError === 'As senhas não coincidem!' || passwordError === 'same_password') ? styles.inputError : (isPasswordMatch && passwordError !== 'same_password' ? { borderColor: '#4CAF50' } : null)]}>
              <TextInput
                style={[styles.whiteModalInputFlex, { color: colors.textDark }]}
                placeholder="Nova senha"
                placeholderTextColor={isDarkMode ? '#8E8E93' : '#919191'}
                secureTextEntry={!showNewPassword}
                value={newPassword}
                onChangeText={onChangeNewPassword}
              />
              <TouchableOpacity onPress={onToggleShowNew}>
                <Feather name={showNewPassword ? 'eye' : 'eye-off'} size={20} color={isDarkMode ? '#FFFFFF' : '#1C2434'} />
              </TouchableOpacity>
            </View>
            {passwordError === 'same_password' && (
              <Text style={[styles.usernameErrorMsg, { textAlign: 'left', marginLeft: 4, marginTop: -4 }]}>A nova senha que você digitou é a mesma da senha antiga!</Text>
            )}

            <View style={[styles.whiteModalInputWrapper, { backgroundColor: isDarkMode ? '#1E1E24' : '#F0F0F0', borderColor: isDarkMode ? '#3E3E4A' : 'transparent' }, (passwordError === 'As senhas não coincidem!' || passwordError === 'same_password') ? styles.inputError : (isPasswordMatch && passwordError !== 'same_password' ? { borderColor: '#4CAF50' } : null)]}>
              <TextInput
                style={[styles.whiteModalInputFlex, { color: colors.textDark }]}
                placeholder="Confirmar nova senha"
                placeholderTextColor={isDarkMode ? '#8E8E93' : '#919191'}
                secureTextEntry={!showConfirmNewPassword}
                value={confirmNewPassword}
                onChangeText={onChangeConfirmNewPassword}
              />
              <TouchableOpacity onPress={onToggleShowConfirm}>
                <Feather name={showConfirmNewPassword ? 'eye' : 'eye-off'} size={20} color={isDarkMode ? '#FFFFFF' : '#1C2434'} />
              </TouchableOpacity>
            </View>

            <View style={[styles.whiteModalInputWrapper, { backgroundColor: isDarkMode ? '#1E1E24' : '#F0F0F0', borderColor: isDarkMode ? '#3E3E4A' : 'transparent' }, (passwordError === 'Você precisa mandar o código primeiro!' || passwordError === 'Código inválido!') ? styles.inputError : null]}>
              <TextInput
                style={[styles.whiteModalInputFlex, { color: colors.textDark }]}
                placeholder="Código de 8 dígitos"
                placeholderTextColor={isDarkMode ? '#8E8E93' : '#919191'}
                keyboardType="numeric"
                value={passwordCode}
                onChangeText={onChangePasswordCode}
              />
              <TouchableOpacity onPress={handleSendOtpCode} style={{ paddingHorizontal: 8, paddingVertical: 8, marginLeft: 8 }}>
                <Text style={{ color: isDarkMode ? '#5B86E5' : '#042A7D', fontWeight: 'bold', fontSize: 14 }}>Mandar</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.whiteModalButtons}>
            <TouchableOpacity style={[styles.whiteModalBtnCancel, { backgroundColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]} onPress={onClose}>
              <Text style={[styles.whiteModalBtnTextCancel, { color: isDarkMode ? '#FFFFFF' : '#767676' }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.whiteModalBtnConfirm, { backgroundColor: colors.accent }]} onPress={handleConfirmFinal}>
              <Text style={styles.whiteModalBtnTextConfirm}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default PasswordModal;
