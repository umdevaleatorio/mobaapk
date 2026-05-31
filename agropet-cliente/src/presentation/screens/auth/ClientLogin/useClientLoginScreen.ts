import { useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../../../data/datasources/supabase/client';

export function useClientLoginScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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

    const { data, error } = await supabase.auth.verifyOtp({
      email: forgotEmail,
      token: passwordCode,
      type: 'recovery',
    });

    if (error) {
      showErrorWithTimeout('Código inválido ou expirado!');
      return;
    }

    if (data.session) {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        showErrorWithTimeout('Erro ao salvar nova senha.');
        return;
      }
      setShowForgotPasswordModal(false);
      Alert.alert('Sucesso', 'Sua senha foi redefinida com sucesso! Você já está logado.');
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
    }
    setLoading(false);
  };

  const handleComeceAqui = () => {
    navigation.navigate('RegisterScreen');
  };

  const openForgotPasswordModal = () => {
    setForgotEmail(email);
    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordCode('');
    setPasswordError('');
    setShowForgotPasswordModal(true);
  };

  return {
    email, setEmail,
    password, setPassword,
    loading,
    showForgotPasswordModal, setShowForgotPasswordModal,
    forgotEmail, setForgotEmail,
    newPassword, setNewPassword,
    confirmNewPassword, setConfirmNewPassword,
    passwordCode, setPasswordCode,
    passwordError,
    showNewPassword, setShowNewPassword,
    showConfirmNewPassword, setShowConfirmNewPassword,
    isPasswordMatch,
    handleLogin,
    handleComeceAqui,
    handleSendOtpCode,
    handleConfirmFinal,
    openForgotPasswordModal,
  };
}
