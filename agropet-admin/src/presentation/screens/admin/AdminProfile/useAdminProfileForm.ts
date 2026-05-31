import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../../../data/datasources/supabase/client';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../../contexts/AuthContext';
import React from 'react';

export function useAdminProfileForm(user: any, profileLoadedRef: React.MutableRefObject<boolean>) {
  const [nome, setNome] = useState('');
  const [usuario, setUsuario] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'loading' | 'available' | 'taken' | 'invalid_format'>('idle');
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);

  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneStatus, setPhoneStatus] = useState<'cadastrar' | 'validar' | 'alterar'>('cadastrar');

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailStatus, setEmailStatus] = useState<'validar' | 'alterar'>('alterar');
  const [emailError, setEmailError] = useState('');
  const [emailCode, setEmailCode] = useState('');

  useEffect(() => {
    if (user?.new_email) {
      setEmailStatus('validar');
      setEmailInput(user.new_email);
    } else {
      setEmailStatus('alterar');
    }
  }, [user]);

  useEffect(() => {
    if (usernameInput.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    const isValidFormat = /^[a-zA-Z0-9_.]+$/.test(usernameInput);
    if (!isValidFormat) {
      setUsernameStatus('invalid_format');
      return;
    }

    const checkVal = usernameInput.toLowerCase();

    if (checkVal === usuario.toLowerCase()) {
      setUsernameStatus('available');
      return;
    }

    setUsernameStatus('loading');
    const delay = setTimeout(async () => {
      try {
        const { data: exists, error: rpcError } = await supabase
          .rpc('check_username_exists', { username_to_check: checkVal });

        let isTaken = false;
        if (rpcError) {
          console.warn('RPC check_username_exists falhou, usando fallback direto:', rpcError);
          const { data, error } = await supabase
            .from('users')
            .select('id')
            .eq('username', checkVal)
            .maybeSingle();

          /* istanbul ignore next */
          if (data && data.id !== user?.id) {
            isTaken = true;
          }
        } else {
          isTaken = !!exists;
        }

        if (isTaken) {
          setUsernameStatus('taken');
          const base = checkVal;
          setUsernameSuggestions([`${base}_721`, `${base}_br`, `${base}1`]);
        } else {
          setUsernameStatus('available');
        }
      } catch (err) {
        setUsernameStatus('idle');
      }
    }, 600);
    return () => clearTimeout(delay);
  }, [usernameInput, usuario, user]);

  useEffect(() => {
    if (!user || !profileLoadedRef.current) return;
    const delay = setTimeout(() => {
      supabase.from('users').update({ name: nome }).eq('id', user.id).then();
    }, 1000);
    return () => clearTimeout(delay);
  }, [nome, user]);

  /* istanbul ignore next */
  const handleSaveUsername = () => {
    if (usernameStatus !== 'available') return;
    Alert.alert(
      'Atenção',
      'Tem certeza que deseja colocar esse nome de usuário à sua conta? Não terá como trocar depois',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            if (!user) return;
            const newUsername = usernameInput.toLowerCase();
            const { error } = await supabase.from('users').update({ username: newUsername }).eq('id', user.id);
            if (!error) {
              setUsuario(newUsername);
              setShowUsernameModal(false);
            } else {
              if (error.code === '23505') {
                Alert.alert('Erro', 'Este nome de usuário já está sendo usado, por favor escolha outro.');
              } else {
                Alert.alert('Erro', 'Não foi possível salvar o nome de usuário.');
              }
            }
          }
        }
      ]
    );
  };

  const handleConfirmPhone = async () => {
    if (phoneStatus === 'cadastrar' || phoneStatus === 'alterar') {
      setPhoneStatus('validar');
      return;
    }
    /* istanbul ignore next */
    if (phoneStatus === 'validar') {
      /* istanbul ignore next */
      if (user) {
        await supabase.from('users').update({ phone: phoneInput }).eq('id', user.id);
        setPhone(phoneInput);
        setPhoneStatus('alterar');
        setShowPhoneModal(false);
      }
    }
  };

  const handleConfirmEmail = async () => {
    if (emailStatus === 'alterar') {
      setEmailError('');
      if (emailInput.trim().toLowerCase() === user?.email?.trim().toLowerCase()) {
        setEmailError('O e-mail digitado é o mesmo já cadastrado nesta conta. Insira um novo e-mail para alterar.');
        return;
      }
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
      return;
    }
    /* istanbul ignore next */
    if (emailStatus === 'validar') {
      /* istanbul ignore next */
      if (user) {
        const { error } = await supabase.auth.verifyOtp({
          email: emailInput.toLowerCase(),
          token: emailCode,
          type: 'email_change'
        });

        if (error) {
          setEmailError('Código inválido ou expirado.');
          return;
        }

        await supabase.from('users').update({ email: emailInput.toLowerCase() }).eq('id', user.id);
        await supabase.auth.refreshSession().catch(() => { });
        setEmail(emailInput.toLowerCase());
        setEmailStatus('alterar');
        setShowEmailModal(false);
      }
    }
  };

  return {
    nome, setNome, usuario, setUsuario, phone, setPhone, email, setEmail,
    showUsernameModal, setShowUsernameModal,
    usernameInput, setUsernameInput,
    usernameStatus, setUsernameStatus,
    usernameSuggestions, setUsernameSuggestions,
    showPhoneModal, setShowPhoneModal,
    phoneInput, setPhoneInput,
    phoneStatus, setPhoneStatus,
    showEmailModal, setShowEmailModal,
    emailInput, setEmailInput,
    emailStatus, setEmailStatus,
    emailError, setEmailError,
    emailCode, setEmailCode,
    handleSaveUsername, handleConfirmPhone, handleConfirmEmail,
  };
}
