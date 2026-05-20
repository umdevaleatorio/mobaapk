import React, { useState, useContext } from 'react';
import { useUserMenu } from '../../contexts/UserMenuContext';
import {
  View,
  StyleSheet,
  StatusBar,
  TextInput,
  Text,
  Platform,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../contexts/AuthContext';
import { supabase } from '../../../data/datasources/supabase/client';
import { Feather } from '@expo/vector-icons';

import { CatalogHeader } from '../../components/CatalogHeader';

// === HEADER SVGs ===
// Removidos MiniLogo, Lupa, PersonIcon e OpcoesSvg (trabalhados no CatalogHeader)

// === CONFIG SVGs ===
import EmailLabel from '../../assets/tela7/config/EmailLabel.svg';
import EmailAlterar from '../../assets/tela7/config/EmailAlterar.svg';
import SenhaLabel from '../../assets/tela7/config/SenhaLabel.svg';
import SenhaAlterar from '../../assets/tela7/config/SenhaAlterar.svg';
import Eye from '../../assets/tela7/config/Eye.svg';
import CadastrarNumero from '../../assets/tela7/config/CadastrarNumero.svg';

// === TOGGLE SVGs (ícones reais do Figma) ===
import LightDark from '../../assets/tela7/config/Light n Dark.svg';
import TemaEscuro from '../../assets/tela7/config/Tema escuro_.svg';
import DarkModeIcon from '../../assets/tela7/config/Dark Mode Icon.svg';
import NotifIcon from '../../assets/tela7/config/Notificação.svg';
import NotifLabel from '../../assets/tela7/config/Notificação_.svg';
import NotifButton from '../../assets/tela7/config/Notification Buttom.svg';
import PermIcon from '../../assets/tela7/config/Permission.svg';
import PermLabel from '../../assets/tela7/config/Permissão_.svg';
import PermButton from '../../assets/tela7/config/Perm Buttom.svg';

export default function SettingsScreen() {
  const { toggleMenu } = useUserMenu();
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);
  const [searchText, setSearchText] = useState('');
  const [phone, setPhone] = useState('');
  
  // Email states
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailStatus, setEmailStatus] = useState<'validar'|'alterar'>('alterar');
  const [emailError, setEmailError] = useState('');
  const [emailCode, setEmailCode] = useState('');

  // Senha states principal
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<'alterar'|'validar'>('alterar');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  
  // Olhinhos no modal
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  
  // Erros e nested
  const [passwordError, setPasswordError] = useState('');
  const [showNestedModal, setShowNestedModal] = useState(false);
  
  // OTP de senha
  const [passwordCode, setPasswordCode] = useState('');
  const [expectedPasswordCode, setExpectedPasswordCode] = useState('');

  const userEmail = user?.email || 'meuemail@gmail.com';

  // Buscar telefone do Supabase
  React.useEffect(() => {
    if (!user) return;
    const fetchPhone = async () => {
      const { data } = await supabase.from('users').select('phone').eq('id', user.id).single();
      if (data && data.phone) {
        setPhone(data.phone);
      }
    };
    fetchPhone();
  }, [user]);

  // ======= LÓGICA E-MAIL =======
  const handleConfirmEmail = async () => {
    if (emailStatus === 'alterar') {
      setEmailError('');
      const { data } = await supabase.from('users').select('id').eq('email', emailInput.toLowerCase()).maybeSingle();
      if (data && data.id !== user?.id) {
        setEmailError('Este e-mail já está sendo usado. Por favor, escolha outro e-mail de seu uso.');
        return;
      }
      
      const { error } = await supabase.auth.updateUser({ email: emailInput.toLowerCase() });
      if (error) {
        setEmailError('Falha ao enviar e-mail de verificação: ' + error.message);
        return;
      }
      
      setEmailCode('');
      setEmailStatus('validar');
    } else if (emailStatus === 'validar') {
      if (user) {
        const { error } = await supabase.auth.verifyOtp({ 
          email: emailInput.toLowerCase(), token: emailCode, type: 'email_change' 
        });
        if (error) {
          setEmailError('Código inválido ou expirado.');
          return;
        }
        await supabase.from('users').update({ email: emailInput.toLowerCase() }).eq('id', user.id);
        setEmailStatus('alterar');
        setShowEmailModal(false);
      }
    }
  };

  // ======= LÓGICA SENHA =======
  const showErrorWithTimeout = (msg: string) => {
    setPasswordError(msg);
    setTimeout(() => {
      setPasswordError((prev) => (prev === msg ? '' : prev));
    }, 8000);
  };

  const handleSendOtpCode = async () => {
    setPasswordError('');
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      showErrorWithTimeout('Preencha todas as senhas antes de pedir o código!');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showErrorWithTimeout('As senhas não coincidem!');
      return;
    }
    if (newPassword && newPassword === currentPassword) {
      showErrorWithTimeout('same_password');
      setShowNestedModal(true);
      return;
    }

    // Verifica se a senha atual está correta tentando logar novamente
    if (userEmail) {
      const { error } = await supabase.auth.signInWithPassword({ email: userEmail, password: currentPassword });
      if (error) {
        showErrorWithTimeout('Senha incorreta!');
        return;
      }
    }

    // Gerar código de 6 dígitos simulado
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    setExpectedPasswordCode(generatedCode);
    console.log("Código de Senha Gerado:", generatedCode); // Para depuração
    Alert.alert('Código Enviado!', 'Um código simulado foi enviado e impresso no terminal. Ele expira em 15 minutos.');
  };

  const handleConfirmFinal = async () => {
    setPasswordError('');
    
    if (!expectedPasswordCode) {
      showErrorWithTimeout('Você precisa mandar o código primeiro!');
      return;
    }
    
    if (passwordCode !== expectedPasswordCode) {
      showErrorWithTimeout('Código inválido!');
      return;
    }

    // Atualiza a senha no Supabase
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      showErrorWithTimeout('Erro ao atualizar a senha.');
    } else {
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordCode('');
      setExpectedPasswordCode('');
      Alert.alert('Sucesso', 'Senha alterada com sucesso!');
    }
  };

  const isPasswordMatch = newPassword.length > 0 && confirmNewPassword.length > 0 && newPassword === confirmNewPassword;

  return (
    <View style={styles.mainContainer}>
      <StatusBar backgroundColor="#1C2434" barStyle="light-content" />

      {/* Header Unificado */}
      <CatalogHeader 
        title="Configurações"
        searchText={searchText}
        onSearchChange={setSearchText}
      />

      {/* ========== FUNDO EXTERNO (#E3E4EB, 342x631, rx=25) ========== */}
      <View style={styles.outerCard}>

        {/* Título DENTRO do fundo externo */}
        <Text style={styles.mainTitle}>Configurações do Aplicativo</Text>

        {/* ========== CARD ESCURO (#1C2434, rx=25) — contém TUDO ========== */}
        <View style={styles.darkCard}>

          {/* === E-MAIL === */}
          <View style={styles.fieldSection}>
            <EmailLabel width={48} height={13} />
            <View style={styles.fieldInput}>
              <Text style={styles.fieldValue} numberOfLines={1}>{userEmail}</Text>
              {emailStatus === 'validar' ? (
                <TouchableOpacity onPress={() => setShowEmailModal(true)} style={styles.alterarBtnInside}>
                  <Text style={{ color: '#FFC107', fontWeight: 'bold' }}>Validar</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => { setEmailInput(userEmail); setEmailError(''); setShowEmailModal(true); }} style={styles.alterarBtnInside}>
                  <EmailAlterar width={50} height={12} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* === SENHA === */}
          <View style={styles.fieldSection}>
            <SenhaLabel width={49} height={13} />
            <View style={styles.fieldInput}>
              <Text style={styles.fieldValue}>••••••••••••••</Text>
              <TouchableOpacity onPress={() => {
                setCurrentPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
                setPasswordCode('');
                setExpectedPasswordCode('');
                setPasswordError('');
                setShowPasswordModal(true);
              }} style={styles.alterarBtnInside}>
                <SenhaAlterar width={50} height={12} />
              </TouchableOpacity>
            </View>
          </View>

          {/* === CADASTRAR NÚMERO === */}
          <View style={styles.fieldSection}>
            <CadastrarNumero width={143} height={14} />
            <View style={styles.fieldInput}>
              <Text style={[styles.fieldValue, phone ? { color: '#000000' } : { color: '#919191' }]}>
                {phone || 'Digite seu número...'}
              </Text>
            </View>
            {!!phone && (
              <Text style={{ color: '#FFFFFF', fontSize: 12, marginTop: 6, marginLeft: 2 }}>
                Caso queira alterar o número de telefone, por favor clique no ícone de pessoa e em seguida Ver perfil.
              </Text>
            )}
          </View>

          {/* ========== TOGGLES (DENTRO do card escuro) ========== */}

          {/* Tema escuro */}
          <View style={styles.toggleRow}>
            <LightDark width={29} height={29} />
            <TemaEscuro width={107} height={14} />
            <View style={styles.toggleSpacer} />
            <TouchableOpacity activeOpacity={0.7}>
              <DarkModeIcon width={71} height={36} style={{ marginRight: -4 }} />
            </TouchableOpacity>
          </View>

          {/* Notificação */}
          <View style={styles.toggleRow}>
            <NotifIcon width={23} height={23} />
            <NotifLabel width={95} height={18} />
            <View style={styles.toggleSpacer} />
            <TouchableOpacity activeOpacity={0.7}>
              <NotifButton width={63} height={28} />
            </TouchableOpacity>
          </View>

          {/* Permissão */}
          <View style={styles.toggleRow}>
            <PermIcon width={21} height={21} />
            <PermLabel width={86} height={14} />
            <View style={styles.toggleSpacer} />
            <TouchableOpacity activeOpacity={0.7}>
              <PermButton width={63} height={28} />
            </TouchableOpacity>
          </View>

        </View>
        {/* FIM DO CARD ESCURO */}

      </View>
      {/* MODAL E-MAIL (Mesmo do Profile) */}
      <Modal visible={showEmailModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.whiteModalContainer}>
            <Text style={styles.whiteModalTitle}>
              {emailStatus === 'validar' ? 'Validar E-mail' : 'Alterar E-mail'}
            </Text>
            <Text style={styles.whiteModalDesc}>
              {emailStatus === 'validar' 
                ? 'Verifique a caixa de entrada do seu novo e-mail para pegar o código.' 
                : 'Insira o novo endereço de e-mail.'}
            </Text>
            {!!emailError && (
              <Text style={styles.usernameErrorMsg}>{emailError}</Text>
            )}
            {emailStatus === 'validar' ? (
              <TextInput
                style={[styles.whiteModalInput, emailError ? styles.inputError : null]}
                placeholder="Código de 6 dígitos..."
                placeholderTextColor="#919191"
                value={emailCode}
                onChangeText={setEmailCode}
                keyboardType="numeric"
              />
            ) : (
              <TextInput
                style={[styles.whiteModalInput, emailError ? styles.inputError : null]}
                placeholder="novo@email.com"
                placeholderTextColor="#919191"
                value={emailInput}
                onChangeText={setEmailInput}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
            <View style={styles.whiteModalButtons}>
              <TouchableOpacity style={styles.whiteModalBtnCancel} onPress={() => setShowEmailModal(false)}>
                <Text style={styles.whiteModalBtnTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.whiteModalBtnConfirm} onPress={handleConfirmEmail}>
                <Text style={styles.whiteModalBtnTextConfirm}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL SENHA */}
      <Modal visible={showPasswordModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.whiteModalContainer}>
            <Text style={styles.whiteModalTitle}>Alterar Senha</Text>
            <Text style={styles.whiteModalDesc}>
              Preencha os campos abaixo e solicite o código de segurança para confirmar.
            </Text>
            
            {!!passwordError && passwordError !== 'same_password' && (
              <Text style={styles.usernameErrorMsg}>{passwordError}</Text>
            )}

            <View style={{ gap: 10 }}>
              {/* Senha Atual */}
              <View style={[styles.whiteModalInputWrapper, (passwordError === 'Senha incorreta!' || passwordError === 'same_password') ? styles.inputError : null]}>
                <TextInput
                  style={styles.whiteModalInputFlex}
                  placeholder="Senha atual"
                  placeholderTextColor="#919191"
                  secureTextEntry={!showCurrentPassword}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                />
                <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                  <Feather name={showCurrentPassword ? 'eye' : 'eye-off'} size={20} color="#1C2434" />
                </TouchableOpacity>
              </View>

              {/* Nova Senha */}
              <View style={[styles.whiteModalInputWrapper, (passwordError === 'As senhas não coincidem!' || passwordError === 'same_password') ? styles.inputError : (isPasswordMatch && passwordError !== 'same_password' ? { borderColor: '#4CAF50' } : null)]}>
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
              {passwordError === 'same_password' && (
                <Text style={[styles.usernameErrorMsg, { textAlign: 'left', marginLeft: 4, marginTop: -4 }]}>A nova senha que você digitou é a mesma da senha antiga!</Text>
              )}

              {/* Confirmar Nova Senha */}
              <View style={[styles.whiteModalInputWrapper, (passwordError === 'As senhas não coincidem!' || passwordError === 'same_password') ? styles.inputError : (isPasswordMatch && passwordError !== 'same_password' ? { borderColor: '#4CAF50' } : null)]}>
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

              {/* Código OTP + Botão Mandar */}
              <View style={[styles.whiteModalInputWrapper, (passwordError === 'Você precisa mandar o código primeiro!' || passwordError === 'Código inválido!') ? styles.inputError : null]}>
                <TextInput
                  style={styles.whiteModalInputFlex}
                  placeholder="Código de 6 dígitos"
                  placeholderTextColor="#919191"
                  keyboardType="numeric"
                  value={passwordCode}
                  onChangeText={setPasswordCode}
                />
                <TouchableOpacity onPress={handleSendOtpCode} style={{ paddingHorizontal: 8, paddingVertical: 8, marginLeft: 8 }}>
                  <Text style={{ color: '#042A7D', fontWeight: 'bold', fontSize: 14 }}>Mandar</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.whiteModalButtons}>
              <TouchableOpacity style={styles.whiteModalBtnCancel} onPress={() => setShowPasswordModal(false)}>
                <Text style={styles.whiteModalBtnTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.whiteModalBtnConfirm} onPress={handleConfirmFinal}>
                <Text style={styles.whiteModalBtnTextConfirm}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* NESTED MODAL (Mesma Senha) */}
      <Modal visible={showNestedModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlayNested}>
          <View style={styles.whiteModalContainer}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#000', marginBottom: 12 }}>Atenção</Text>
            <Text style={{ fontSize: 16, color: '#000', marginBottom: 20 }}>
              A nova senha que você digitou é a mesma da antiga
            </Text>
            <View style={{ alignItems: 'flex-end' }}>
              <TouchableOpacity 
                style={{ backgroundColor: '#042A7D', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }} 
                onPress={() => setShowNestedModal(false)}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 }}>FECHAR</Text>
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
    backgroundColor: '#F5F5F5',
  },

  // ========== CONTEÚDO ==========

  // ========== FUNDO EXTERNO (#E3E4EB, 342x631, rx=25) ==========
  outerCard: {
    backgroundColor: '#E3E4EB',
    borderRadius: 25,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 40,
  },

  // Título "Configurações do Aplicativo" — dentro do fundo externo
  mainTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C2434',
    marginBottom: 14,
  },

  // ========== CARD ESCURO (#1C2434, rx=25) ==========
  darkCard: {
    backgroundColor: '#1C2434',
    borderRadius: 25,
    padding: 18,
    paddingBottom: 24,
    gap: 20,
  },

  // Seção de campo
  fieldSection: {
  },

  // Input field: #C0CADE, 262x44, rx=10 — com "Alterar" DENTRO
  fieldInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C0CADE',
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 12,
    marginTop: 6,
    gap: 8,
  },
  fieldValue: {
    flex: 1,
    fontSize: 14,
    color: '#1C2434',
  },

  // Botão "Alterar" DENTRO do input
  alterarBtnInside: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },

  // Phone input
  phoneInput: {
    flex: 1,
    fontSize: 14,
    color: '#1C2434',
    padding: 0,
    height: 44,
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
  },
  toggleSpacer: {
    flex: 1,
  },

  // ===== WHITE MODALS =====
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
  },
  modalOverlayNested: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    zIndex: 999,
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
  whiteModalInput: {
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 45,
    fontSize: 16,
    color: '#1C2434',
    borderWidth: 1,
    borderColor: 'transparent',
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
