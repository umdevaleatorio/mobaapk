import React from 'react';
import { View, TouchableOpacity, ScrollView, Dimensions, StatusBar, TextInput, ActivityIndicator, Modal, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Colors from '../../../theme/colors';

import MiniLogo from '../../../assets/tela3/MiniLogo.svg';
import NaoTemConta from '../../../assets/tela3/NaoTemConta.svg';
import ComeceAqui from '../../../assets/tela3/ComeceAqui.svg';
import LogoAgropet from '../../../assets/tela3/LogoAgropet.svg';
import BemVindo from '../../../assets/tela3/BemVindo.svg';
import EmailLabel from '../../../assets/tela3/EmailLabel.svg';
import SenhaLabel from '../../../assets/tela3/SenhaLabel.svg';
import EntrarTexto from '../../../assets/tela3/EntrarTexto.svg';
import Suporte from '../../../assets/tela3/Suporte.svg';
import Privacidade from '../../../assets/tela3/Privacidade.svg';
import Termos from '../../../assets/tela3/Termos.svg';

import { useClientLoginScreen } from './useClientLoginScreen';
import { styles } from './ClientLoginScreen.styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ClientLoginScreen() {
  const h = useClientLoginScreen();

  return (
    <View style={styles.mainContainer}>
      <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerContainer}>
          <View style={styles.miniLogoWrapper}>
            <MiniLogo width={36} height={36} />
          </View>
          <View style={styles.headerRight}>
            <NaoTemConta width={93} height={11} />
            <TouchableOpacity onPress={h.handleComeceAqui} style={styles.comeceAquiBtn}>
              <ComeceAqui width={79} height={13} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.middleContainer}>
          <View style={styles.logoWrapper}>
            <LogoAgropet width={SCREEN_WIDTH * 0.80} height={SCREEN_WIDTH * 0.75} />
          </View>

          <View style={styles.bemVindoWrapper}>
            <BemVindo width={238} height={96} />
          </View>

          <View style={styles.formCard}>
            <View style={styles.fieldGroup}>
              <View style={styles.labelWrapper}>
                <EmailLabel width={46} height={14} />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Digite seu email..."
                placeholderTextColor={Colors.textGray}
                value={h.email}
                onChangeText={h.setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.labelWrapper}>
                <SenhaLabel width={48} height={14} />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Digite sua senha..."
                placeholderTextColor={Colors.textGray}
                value={h.password}
                onChangeText={h.setPassword}
                secureTextEntry
              />
              <TouchableOpacity onPress={h.openForgotPasswordModal}>
                <Text style={{ color: '#1C2434', fontSize: 13, marginTop: 6, marginLeft: 4, fontWeight: 'bold' }}>Esqueci a senha</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.entrarButton}
            onPress={h.handleLogin}
            activeOpacity={0.8}
            disabled={h.loading}
          >
            {h.loading ? (
              <ActivityIndicator color={Colors.textDark} />
            ) : (
              <EntrarTexto width={75} height={19} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footerContainer}>
          <View style={styles.footerContent}>
            <TouchableOpacity style={styles.footerItem}>
              <Suporte width={85} height={23} />
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity style={styles.footerItem}>
              <Privacidade width={127} height={21} />
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity style={styles.footerItem}>
              <Termos width={82} height={19} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal visible={h.showForgotPasswordModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.whiteModalContainer}>
            <Text style={styles.whiteModalTitle}>Alterar Senha</Text>
            <Text style={styles.whiteModalDesc}>
              Preencha o e-mail, peça o código, e defina sua nova senha.
            </Text>

            {!!h.passwordError && (
              <Text style={styles.usernameErrorMsg}>{h.passwordError}</Text>
            )}

            <View style={{ gap: 10 }}>
              <View style={[styles.whiteModalInputWrapper, h.passwordError.includes('e-mail') ? styles.inputError : null]}>
                <TextInput
                  style={styles.whiteModalInputFlex}
                  placeholder="Seu e-mail"
                  placeholderTextColor="#919191"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={h.forgotEmail}
                  onChangeText={h.setForgotEmail}
                />
                <TouchableOpacity onPress={h.handleSendOtpCode} style={{ paddingHorizontal: 8, paddingVertical: 8, marginLeft: 8 }}>
                  <Text style={{ color: '#042A7D', fontWeight: 'bold', fontSize: 14 }}>Mandar</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.whiteModalInputWrapper, h.passwordError === 'As senhas não coincidem!' ? styles.inputError : (h.isPasswordMatch ? { borderColor: '#4CAF50' } : null)]}>
                <TextInput
                  style={styles.whiteModalInputFlex}
                  placeholder="Nova senha"
                  placeholderTextColor="#919191"
                  secureTextEntry={!h.showNewPassword}
                  value={h.newPassword}
                  onChangeText={h.setNewPassword}
                />
                <TouchableOpacity onPress={() => h.setShowNewPassword(!h.showNewPassword)}>
                  <Feather name={h.showNewPassword ? 'eye' : 'eye-off'} size={20} color="#1C2434" />
                </TouchableOpacity>
              </View>

              <View style={[styles.whiteModalInputWrapper, h.passwordError === 'As senhas não coincidem!' ? styles.inputError : (h.isPasswordMatch ? { borderColor: '#4CAF50' } : null)]}>
                <TextInput
                  style={styles.whiteModalInputFlex}
                  placeholder="Confirmar nova senha"
                  placeholderTextColor="#919191"
                  secureTextEntry={!h.showConfirmNewPassword}
                  value={h.confirmNewPassword}
                  onChangeText={h.setConfirmNewPassword}
                />
                <TouchableOpacity onPress={() => h.setShowConfirmNewPassword(!h.showConfirmNewPassword)}>
                  <Feather name={h.showConfirmNewPassword ? 'eye' : 'eye-off'} size={20} color="#1C2434" />
                </TouchableOpacity>
              </View>

              <View style={[styles.whiteModalInputWrapper, h.passwordError.includes('Código') ? styles.inputError : null]}>
                <TextInput
                  style={styles.whiteModalInputFlex}
                  placeholder="Código de 8 dígitos"
                  placeholderTextColor="#919191"
                  keyboardType="numeric"
                  value={h.passwordCode}
                  onChangeText={h.setPasswordCode}
                />
              </View>
            </View>

            <View style={styles.whiteModalButtons}>
              <TouchableOpacity style={styles.whiteModalBtnCancel} onPress={() => h.setShowForgotPasswordModal(false)}>
                <Text style={styles.whiteModalBtnTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.whiteModalBtnConfirm} onPress={h.handleConfirmFinal}>
                <Text style={styles.whiteModalBtnTextConfirm}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
