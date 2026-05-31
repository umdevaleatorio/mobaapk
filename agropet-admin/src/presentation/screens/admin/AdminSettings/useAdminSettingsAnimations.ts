import { useRef, useEffect } from 'react';
import { Animated, Alert, Linking } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export function useAdminSettingsAnimations(
  isDarkMode: boolean,
  showGreeting: boolean,
  setShowGreeting: (v: boolean) => void,
  notificationsEnabled: boolean,
  deliveryDisabled: boolean,
  checkAllPermissions: () => Promise<void>,
  setShowPermissionsModal: (v: boolean) => void,
  toggleTheme: () => void,
  notifIconRotate: Animated.Value
) {
  const themeSwitchAnim = useRef(new Animated.Value(isDarkMode ? 1 : 0)).current;
  const notifSwitchAnim = useRef(new Animated.Value(notificationsEnabled ? 1 : 0)).current;
  const deliverySwitchAnim = useRef(new Animated.Value(deliveryDisabled ? 1 : 0)).current;
  const greetingSwitchAnim = useRef(new Animated.Value(showGreeting ? 1 : 0)).current;

  const themeIconRotate = useRef(new Animated.Value(0)).current;
  const themeIconScale = useRef(new Animated.Value(1)).current;
  const permIconScale = useRef(new Animated.Value(1)).current;
  const greetingIconRotate = useRef(new Animated.Value(0)).current;
  const greetingIconScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(themeSwitchAnim, {
      toValue: isDarkMode ? 1 : 0,
      useNativeDriver: false,
      bounciness: 4,
      speed: 12,
    }).start();
  }, [isDarkMode]);

  useEffect(() => {
    Animated.spring(notifSwitchAnim, {
      toValue: notificationsEnabled ? 1 : 0,
      useNativeDriver: false,
      bounciness: 4,
      speed: 12,
    }).start();
  }, [notificationsEnabled]);

  useEffect(() => {
    Animated.spring(deliverySwitchAnim, {
      toValue: deliveryDisabled ? 1 : 0,
      useNativeDriver: false,
      bounciness: 4,
      speed: 12,
    }).start();
  }, [deliveryDisabled]);

  useEffect(() => {
    Animated.spring(greetingSwitchAnim, {
      toValue: showGreeting ? 1 : 0,
      useNativeDriver: false,
      bounciness: 4,
      speed: 12,
    }).start();
  }, [showGreeting]);

  const themeRotateInterpolate = themeIconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const notifRotateInterpolate = notifIconRotate.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: ['0deg', '-20deg', '20deg', '-15deg', '15deg', '0deg'],
  });

  const greetingRotateInterpolate = greetingIconRotate.interpolate({
    inputRange: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
    outputRange: ['0deg', '-30deg', '30deg', '-30deg', '30deg', '-15deg', '15deg', '-15deg', '15deg', '0deg', '0deg'],
  });

  const handleToggleTheme = () => {
    themeIconRotate.setValue(0);
    Animated.parallel([
      Animated.timing(themeIconRotate, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(themeIconScale, {
          toValue: 1.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(themeIconScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ])
    ]).start();
    toggleTheme();
  };

  const handleToggleGreeting = async () => {
    greetingIconRotate.setValue(0);
    greetingIconScale.setValue(1);

    Animated.parallel([
      Animated.timing(greetingIconRotate, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(greetingIconScale, { toValue: 1.3, duration: 200, useNativeDriver: true }),
        Animated.timing(greetingIconScale, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ]).start();

    const newValue = !showGreeting;
    setShowGreeting(newValue);
    try {
      await SecureStore.setItemAsync('show_greeting_bar', String(newValue));
    } catch (e) {
      console.log('Erro ao salvar preferência de saudação:', e);
    }
  };

  const handleOpenPermissions = () => {
    permIconScale.setValue(1);
    Animated.sequence([
      Animated.timing(permIconScale, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(permIconScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    checkAllPermissions();
    setShowPermissionsModal(true);
  };

  return {
    themeSwitchAnim,
    notifSwitchAnim,
    deliverySwitchAnim,
    greetingSwitchAnim,
    themeIconRotate,
    themeIconScale,
    notifIconRotate,
    permIconScale,
    greetingIconRotate,
    greetingIconScale,
    themeRotateInterpolate,
    notifRotateInterpolate,
    greetingRotateInterpolate,
    handleToggleTheme,
    handleToggleGreeting,
    handleOpenPermissions,
  };
}
