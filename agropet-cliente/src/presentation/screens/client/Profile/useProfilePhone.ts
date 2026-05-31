import React, { useState } from 'react';
import { supabase } from '../../../../data/datasources/supabase/client';

export function useProfilePhone({ user, setPhone }: {
  user: any;
  setPhone: React.Dispatch<React.SetStateAction<string>>;
}) {
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneStatus, setPhoneStatus] = useState<'cadastrar' | 'validar' | 'alterar'>('cadastrar');

  const handleConfirmPhone = async () => {
    if (phoneStatus === 'cadastrar' || phoneStatus === 'alterar') {
      setPhoneStatus('validar');
    } else if (phoneStatus === 'validar') {
      if (user) {
        await supabase.from('users').update({ phone: phoneInput }).eq('id', user.id);
        setPhone(phoneInput);
        setPhoneStatus('alterar');
        setShowPhoneModal(false);
      }
    }
  };

  return {
    showPhoneModal, setShowPhoneModal,
    phoneInput, setPhoneInput,
    phoneStatus, setPhoneStatus,
    handleConfirmPhone,
  };
}
