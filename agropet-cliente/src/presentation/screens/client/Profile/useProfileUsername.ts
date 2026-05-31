import React, { useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../../../data/datasources/supabase/client';

export function useProfileUsername({ user, usuario, setUsuario }: {
  user: any;
  usuario: string;
  setUsuario: React.Dispatch<React.SetStateAction<string>>;
}) {
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'loading' | 'available' | 'taken' | 'invalid_format'>('idle');
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);

  React.useEffect(() => {
    if (usernameInput.length < 3) {
      setUsernameStatus('idle');
      return;
    }
    const isValidFormat = /^[a-zA-Z0-9_.]+$/.test(usernameInput);
    if (!isValidFormat) {
      setUsernameStatus('invalid_format' as any);
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
          if (data && data.id !== user?.id) isTaken = true;
        } else {
          isTaken = !!exists;
        }
        if (isTaken) {
          setUsernameStatus('taken');
          setUsernameSuggestions([`${checkVal}_721`, `${checkVal}_br`, `${checkVal}1`]);
        } else {
          setUsernameStatus('available');
        }
      } catch (err) {
        setUsernameStatus('idle');
      }
    }, 600);
    return () => clearTimeout(delay);
  }, [usernameInput, usuario, user]);

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

  return {
    showUsernameModal, setShowUsernameModal,
    usernameInput, setUsernameInput,
    usernameStatus, setUsernameStatus,
    usernameSuggestions, setUsernameSuggestions,
    handleSaveUsername,
  };
}
