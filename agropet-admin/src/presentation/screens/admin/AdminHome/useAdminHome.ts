import React, { useContext } from 'react';
import { Animated } from 'react-native';
import { AuthContext } from '../../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../../contexts/ThemeContext';
import { getShopStatus } from '../../../../utils/shopHours';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../../../../data/datasources/supabase/client';

export function useAdminHome() {
  const { signOut, user } = useContext(AuthContext);
  const navigation = useNavigation<any>();
  const { colors, isDarkMode } = useTheme();

  const [greeting, setGreeting] = React.useState('');
  const [shopStatus, setShopStatusState] = React.useState<any>(null);
  const [showGreetingBar, setShowGreetingBar] = React.useState(true);
  const [adminName, setAdminName] = React.useState('');

  const fetchProfileName = async () => {
    if (user?.id) {
      try {
        const { data } = await supabase
          .from('users')
          .select('name')
          .eq('id', user.id)
          .single();
        if (data?.name) {
          const firstName = data.name.trim().split(' ')[0];
          setAdminName(firstName);
        } else {
          setAdminName('');
        }
      } catch (e) {
        console.log('Erro ao buscar nome do admin para a saudação:', e);
      }
    } else {
      setAdminName('');
    }
  };

  const greetingOpacity = React.useRef(new Animated.Value(1)).current;
  const greetingScale = React.useRef(new Animated.Value(1)).current;
  const closeButtonRotate = React.useRef(new Animated.Value(0)).current;
  const closeButtonScale = React.useRef(new Animated.Value(1)).current;

  const checkGreetingPreference = async () => {
    try {
      const val = await SecureStore.getItemAsync('show_greeting_bar');
      if (val === 'false') {
        setShowGreetingBar(false);
      } else {
        greetingOpacity.setValue(0);
        greetingScale.setValue(0.95);
        closeButtonRotate.setValue(0);
        closeButtonScale.setValue(1);
        setShowGreetingBar(true);

        Animated.parallel([
          Animated.timing(greetingOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(greetingScale, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } catch (e) {
      console.log('Erro ao ler preferência de saudação:', e);
    }
  };

  React.useEffect(() => {
    const updateStatus = () => {
      const now = new Date();
      const status = getShopStatus(now);
      setShopStatusState(status);

      const hour = now.getHours();
      const isDay = hour >= 6 && hour < 18;
      const nameToUse = adminName || 'Administrador';
      if (isDay) {
        setGreeting(`Bom dia, ${nameToUse}!`);
      } else {
        setGreeting(`Boa noite, ${nameToUse}!`);
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, [adminName]);

  React.useEffect(() => {
    checkGreetingPreference();
    fetchProfileName();
    const unsubscribeFocus = navigation.addListener('focus', () => {
      checkGreetingPreference();
      fetchProfileName();
    });
    return unsubscribeFocus;
  }, [navigation, user]);

  const handleDismissGreeting = () => {
    Animated.parallel([
      Animated.timing(closeButtonRotate, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(closeButtonScale, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(greetingOpacity, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(greetingScale, {
        toValue: 0.95,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      setShowGreetingBar(false);
      try {
        await SecureStore.setItemAsync('show_greeting_bar', 'false');
      } catch (e) {
        console.log('Erro ao salvar preferência de saudação:', e);
      }
    });
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error("Erro ao sair:", e);
    }
  };

  return {
    colors, isDarkMode, navigation, signOut, user,
    greeting, shopStatus, showGreetingBar, adminName,
    greetingOpacity, greetingScale, closeButtonRotate, closeButtonScale,
    handleDismissGreeting, handleLogout,
  };
}
