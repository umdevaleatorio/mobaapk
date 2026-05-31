import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../../contexts/AuthContext';
import { supabase } from '../../../../data/datasources/supabase/client';

export function useSettingsEmail() {
  const { user } = useContext(AuthContext);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailStatus, setEmailStatus] = useState<'validar' | 'alterar'>(user?.new_email ? 'validar' : 'alterar');
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
        await supabase.auth.refreshSession().catch(() => { });
        setEmailStatus('alterar');
        setShowEmailModal(false);
      }
    }
  };

  return {
    showEmailModal,
    setShowEmailModal,
    emailInput,
    setEmailInput,
    emailStatus,
    setEmailStatus,
    emailError,
    setEmailError,
    emailCode,
    setEmailCode,
    handleConfirmEmail,
  };
}
