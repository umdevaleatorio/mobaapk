import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useUserMenu } from '../../../contexts/UserMenuContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { supabase } from '../../../../data/datasources/supabase/client';
import { useTheme } from '../../../contexts/ThemeContext';
import { useProfilePhoto } from './useProfilePhoto';
import { useProfileUsername } from './useProfileUsername';
import { useProfilePhone } from './useProfilePhone';
import { useProfileEmail } from './useProfileEmail';
import { useProfileAddress } from './useProfileAddress';

export function useProfile() {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<any>();
  const { toggleMenu } = useUserMenu();
  const { user } = React.useContext(AuthContext);
  const [nome, setNome] = useState('');
  const [usuario, setUsuario] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const profileLoadedRef = React.useRef(false);

  const photo = useProfilePhoto({ user });
  const username = useProfileUsername({ user, usuario, setUsuario });
  const phoneHook = useProfilePhone({ user, setPhone });
  const emailHook = useProfileEmail({ user, setEmail });
  const address = useProfileAddress({
    user, navigation, profileLoadedRef,
    setNome, setUsuario, setEmail, setPhone,
    setPhoneStatus: phoneHook.setPhoneStatus,
  });

  React.useEffect(() => {
    if (!user || !profileLoadedRef.current) return;
    const delay = setTimeout(() => {
      supabase.from('users').update({ name: nome }).eq('id', user.id).then();
    }, 1000);
    return () => clearTimeout(delay);
  }, [nome, user]);

  React.useEffect(() => {
    supabase.auth.refreshSession().catch(() => { });
  }, []);

  return {
    colors, isDarkMode, navigation, toggleMenu, user,
    nome, setNome, usuario, setUsuario, phone, setPhone, email, setEmail,
    ...username,
    ...phoneHook,
    ...emailHook,
    ...photo,
    ...address,
  };
}
