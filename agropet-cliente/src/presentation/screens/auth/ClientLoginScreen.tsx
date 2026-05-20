import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Text,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import Colors from '../../theme/colors';
import { supabase } from '../../../data/datasources/supabase/client';

// SVG imports (Tela 3)
import MiniLogo from '../../assets/tela3/MiniLogo.svg';
import NaoTemConta from '../../assets/tela3/NaoTemConta.svg';
import ComeceAqui from '../../assets/tela3/ComeceAqui.svg';
import LogoAgropet from '../../assets/tela3/LogoAgropet.svg';
import BemVindo from '../../assets/tela3/BemVindo.svg';
import EmailLabel from '../../assets/tela3/EmailLabel.svg';
import SenhaLabel from '../../assets/tela3/SenhaLabel.svg';
import EntrarTexto from '../../assets/tela3/EntrarTexto.svg';
import Suporte from '../../assets/tela3/Suporte.svg';
import Privacidade from '../../assets/tela3/Privacidade.svg';
import Termos from '../../assets/tela3/Termos.svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ClientLoginScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // States para "Esqueci a senha"
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordCode, setPasswordCode] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const showErrorWithTimeout = (msg: string) => {
    setPasswordError(msg);
    setTimeout(() => {
      setPasswordError((prev) => (prev === msg ? '' : prev));
    }, 8000);
  };

  const handleSendOtpCode = async () => {
    setPasswordError('');
    if (!forgotEmail) {
      showErrorWithTimeout('Preencha o e-mail primeiro para receber o código!');
      return;
    }
    // Envia o e-mail de recuperação real pelo Supabase (se configurado para OTP)
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail);
    if (error) {
      showErrorWithTimeout('Erro ao enviar: ' + error.message);
      return;
    }
    Alert.alert('Código Enviado!', 'Verifique sua caixa de e-mail para pegar o código de 8 dígitos.');
  };

  const handleConfirmFinal = async () => {
    setPasswordError('');
    if (!forgotEmail || !passwordCode || !newPassword || !confirmNewPassword) {
      showErrorWithTimeout('Preencha todos os campos e o código!');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showErrorWithTimeout('As senhas não coincidem!');
      return;
    }

    // Verifica OTP de recuperação
    const { data, error } = await supabase.auth.verifyOtp({
      email: forgotEmail,
      token: passwordCode,
      type: 'recovery',
    });

    if (error) {
      showErrorWithTimeout('Código inválido ou expirado!');
      return;
    }

    // Se o código for válido, o usuário ganha uma sessão temporária. Atualizamos a senha:
    if (data.session) {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        showErrorWithTimeout('Erro ao salvar nova senha.');
        return;
      }
      setShowForgotPasswordModal(false);
      Alert.alert('Sucesso', 'Sua senha foi redefinida com sucesso! Você já está logado.');
      // AuthContext irá detectar a sessão e navegar
    }
  };

  const isPasswordMatch = newPassword.length > 0 && confirmNewPassword.length > 0 && newPassword === confirmNewPassword;

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      Alert.alert('Erro no Login', error.message);
    } else {
      // O AuthContext interceptará e navegará automaticamente
    }
    setLoading(false);
  };

  const handleComeceAqui = () => {
    navigation.navigate('RegisterScreen');
  };

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
        {/* ============ HEADER (Branco retangular) ============ */}
        <View style={styles.headerContainer}>
          {/* Mini Logo - lado esquerdo */}
          <View style={styles.miniLogoWrapper}>
            <MiniLogo width={36} height={36} />
          </View>

          {/* "Não tem Conta?" + "Comece aqui!" - lado direito */}
          <View style={styles.headerRight}>
            <NaoTemConta width={93} height={11} />
            <TouchableOpacity onPress={handleComeceAqui} style={styles.comeceAquiBtn}>
              <ComeceAqui width={79} height={13} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ============ MEIO (Fundo Laranja) ============ */}
        <View style={styles.middleContainer}>
          {/* Logo Agropet */}
          <View style={styles.logoWrapper}>
            <LogoAgropet width={SCREEN_WIDTH * 0.80} height={SCREEN_WIDTH * 0.75} />
          </View>

          {/* Texto Bem-vindo */}
          <View style={styles.bemVindoWrapper}>
            <BemVindo width={238} height={96} />
          </View>

          {/* Card do formulário (#E96310, borderRadius 25) */}
          <View style={styles.formCard}>
            {/* Campo: Email */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelWrapper}>
                <EmailLabel width={46} height={14} />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Digite seu email..."
                placeholderTextColor={Colors.textGray}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {/* Campo: Senha */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelWrapper}>
                <SenhaLabel width={48} height={14} />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Digite sua senha..."
                placeholderTextColor={Colors.textGray}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <TouchableOpacity onPress={() => {
                setForgotEmail(email); // Preenche com o email já digitado, se houver
                setNewPassword('');
                setConfirmNewPassword('');
                setPasswordCode('');
                setPasswordError('');
                setShowForgotPasswordModal(true);
              }}>
                 <Text style={{ color: '#1C2434', fontSize: 13, marginTop: 6, marginLeft: 4, fontWeight: 'bold' }}>Esqueci a senha</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Botão Entrar (Branco, borderRadius 30) */}
          <TouchableOpacity
            style={styles.entrarButton}
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.textDark} />
            ) : (
              <EntrarTexto width={75} height={19} />
            )}
          </TouchableOpacity>
        </View>

        {/* ============ FOOTER (Retangular #E96310) ============ */}
        <View style={styles.footerContainer}>
          <View style={styles.footerContent}>
            {/* Suporte */}
            <TouchableOpacity style={styles.footerItem}>
              <Suporte width={85} height={23} />
            </TouchableOpacity>

            {/* Separador 1 */}
            <View style={styles.separator} />

            {/* Privacidade */}
            <TouchableOpacity style={styles.footerItem}>
              <Privacidade width={127} height={21} />
            </TouchableOpacity>

            {/* Separador 2 */}
            <View style={styles.separator} />

            {/* Termos */}
            <TouchableOpacity style={styles.footerItem}>
              <Termos width={82} height={19} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* MODAL ESQUECI A SENHA */}
      <Modal visible={showForgotPasswordModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.whiteModalContainer}>
            <Text style={styles.whiteModalTitle}>Alterar Senha</Text>
            <Text style={styles.whiteModalDesc}>
              Preencha o e-mail, peça o código, e defina sua nova senha.
            </Text>
            
            {!!passwordError && (
              <Text style={styles.usernameErrorMsg}>{passwordError}</Text>
            )}

            <View style={{ gap: 10 }}>
              {/* E-mail + Botão Mandar */}
              <View style={[styles.whiteModalInputWrapper, passwordError.includes('e-mail') ? styles.inputError : null]}>
                <TextInput
                  style={styles.whiteModalInputFlex}
                  placeholder="Seu e-mail"
                  placeholderTextColor="#919191"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={forgotEmail}
                  onChangeText={setForgotEmail}
                />
                <TouchableOpacity onPress={handleSendOtpCode} style={{ paddingHorizontal: 8, paddingVertical: 8, marginLeft: 8 }}>
                  <Text style={{ color: '#042A7D', fontWeight: 'bold', fontSize: 14 }}>Mandar</Text>
                </TouchableOpacity>
              </View>

              {/* Nova Senha */}
              <View style={[styles.whiteModalInputWrapper, passwordError === 'As senhas não coincidem!' ? styles.inputError : (isPasswordMatch ? { borderColor: '#4CAF50' } : null)]}>
                <TextInput
                  style={styles.whiteModalInputFlex}
                  placeholder="Nova senha"
                  placeholderTextColor="#919191"
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                  <Feather name={showNewPassword ? 'eye' : 'eye-off'} size={20} color="#1C2434" />
                </TouchableOpacity>
              </View>

              {/* Confirmar Nova Senha */}
              <View style={[styles.whiteModalInputWrapper, passwordError === 'As senhas não coincidem!' ? styles.inputError : (isPasswordMatch ? { borderColor: '#4CAF50' } : null)]}>
                <TextInput
                  style={styles.whiteModalInputFlex}
                  placeholder="Confirmar nova senha"
                  placeholderTextColor="#919191"
                  secureTextEntry={!showConfirmNewPassword}
                  value={confirmNewPassword}
                  onChangeText={setConfirmNewPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmNewPassword(!showConfirmNewPassword)}>
                  <Feather name={showConfirmNewPassword ? 'eye' : 'eye-off'} size={20} color="#1C2434" />
                </TouchableOpacity>
              </View>

              {/* Código OTP */}
              <View style={[styles.whiteModalInputWrapper, passwordError.includes('Código') ? styles.inputError : null]}>
                <TextInput
                  style={styles.whiteModalInputFlex}
                  placeholder="Código de 8 dígitos"
                  placeholderTextColor="#919191"
                  keyboardType="numeric"
                  value={passwordCode}
                  onChangeText={setPasswordCode}
                />
              </View>
            </View>

            <View style={styles.whiteModalButtons}>
              <TouchableOpacity style={styles.whiteModalBtnCancel} onPress={() => setShowForgotPasswordModal(false)}>
                <Text style={styles.whiteModalBtnTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.whiteModalBtnConfirm} onPress={handleConfirmFinal}>
                <Text style={styles.whiteModalBtnTextConfirm}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // ====== HEADER (Retangular Branco) ======
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 44, // Ajuste para a barra de status
    paddingBottom: 12,
    backgroundColor: Colors.white,
  },
  miniLogoWrapper: {
    width: 36,
    height: 36,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  comeceAquiBtn: {
    marginLeft: 4,
  },

  // ====== MEIO (Fundo Laranja) ======
  middleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 5,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  bemVindoWrapper: {
    alignItems: 'center',
    marginTop: -25,
    marginBottom: 15,
  },

  // Card do formulário (#E96310, borderRadius 25)
  formCard: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 25,
    paddingVertical: 18,
    paddingHorizontal: 28,
    width: SCREEN_WIDTH * 0.86,
    gap: 6,
  },

  // Campo individual
  fieldGroup: {
    marginBottom: 2,
  },
  labelWrapper: {
    marginBottom: 4,
    marginLeft: 4,
  },

  // Input branco (borderRadius 15)
  textInput: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    height: 38,
    paddingHorizontal: 16,
    fontSize: 14,
    color: Colors.textDark,
  },

  // Botão Entrar (Branco, borderRadius 30)
  entrarButton: {
    backgroundColor: Colors.white,
    borderRadius: 30,
    width: 206,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },

  // ====== FOOTER (Retangular #E96310) ======
  footerContainer: {
    backgroundColor: Colors.primaryDark,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  footerItem: {
    paddingHorizontal: 4,
  },

  // Separador (linha vertical branca)
  separator: {
    width: 1,
    height: 29,
    backgroundColor: Colors.white,
    borderRadius: 0.5,
  },

  // ===== WHITE MODAL STYLES (Copiado de SettingsScreen) =====
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
  },
  whiteModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    alignSelf: 'center',
  },
  whiteModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C2434',
    marginBottom: 8,
    textAlign: 'center',
  },
  whiteModalDesc: {
    fontSize: 14,
    color: '#767676',
    textAlign: 'center',
    marginBottom: 16,
  },
  whiteModalInputWrapper: {
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 45,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  whiteModalInputFlex: {
    flex: 1,
    fontSize: 16,
    color: '#1C2434',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  usernameErrorMsg: {
    color: '#FF3B30',
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  whiteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 10,
  },
  whiteModalBtnCancel: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  whiteModalBtnTextCancel: {
    color: '#FF3B30',
    fontWeight: 'bold',
    fontSize: 15,
  },
  whiteModalBtnConfirm: {
    flex: 1,
    backgroundColor: '#042A7D',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  whiteModalBtnTextConfirm: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
