import { useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../../../data/datasources/supabase/client';

export function useSettingsPassword(userEmail: string) {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<'alterar' | 'validar'>('alterar');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showNestedModal, setShowNestedModal] = useState(false);
  const [passwordCode, setPasswordCode] = useState('');
  const [expectedPasswordCode, setExpectedPasswordCode] = useState('');

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
    if (userEmail) {
      const { error } = await supabase.auth.signInWithPassword({ email: userEmail, password: currentPassword });
      if (error) {
        showErrorWithTimeout('Senha incorreta!');
        return;
      }
    }
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    setExpectedPasswordCode(generatedCode);
    console.log("Código de Senha Gerado:", generatedCode);
    Alert.alert('Código Enviado!', 'Verifique sua caixa de e-mail para pegar o código de 8 dígitos.');
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

  return {
    showPasswordModal,
    setShowPasswordModal,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmNewPassword,
    setConfirmNewPassword,
    passwordCode,
    setPasswordCode,
    showCurrentPassword,
    setShowCurrentPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmNewPassword,
    setShowConfirmNewPassword,
    passwordError,
    showNestedModal,
    setShowNestedModal,
    handleSendOtpCode,
    handleConfirmFinal,
    isPasswordMatch,
  };
}
