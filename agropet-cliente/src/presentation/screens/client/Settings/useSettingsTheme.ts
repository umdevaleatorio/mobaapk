import { useState, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Animated } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import * as SecureStore from 'expo-secure-store';

export function useSettingsTheme() {
  const { isDarkMode, toggleTheme, colors } = useTheme();

  const [showGreeting, setShowGreeting] = useState(true);

  const themeSwitchAnim = useRef(new Animated.Value(isDarkMode ? 1 : 0)).current;
  const greetingSwitchAnim = useRef(new Animated.Value(1)).current;
  const themeIconRotate = useRef(new Animated.Value(0)).current;
  const themeIconScale = useRef(new Animated.Value(1)).current;
  const greetingIconRotate = useRef(new Animated.Value(0)).current;
  const greetingIconScale = useRef(new Animated.Value(1)).current;

  const themeRotateInterpolate = themeIconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const greetingRotateInterpolate = greetingIconRotate.interpolate({
    inputRange: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
    outputRange: ['0deg', '-30deg', '30deg', '-30deg', '30deg', '-15deg', '15deg', '-15deg', '15deg', '0deg', '0deg'],
  });

  useEffect(() => {
    Animated.spring(themeSwitchAnim, {
      toValue: isDarkMode ? 1 : 0,
      useNativeDriver: false,
      bounciness: 4,
      speed: 12,
    }).start();
  }, [isDarkMode]);

  useEffect(() => {
    Animated.spring(greetingSwitchAnim, {
      toValue: showGreeting ? 1 : 0,
      useNativeDriver: false,
      bounciness: 4,
      speed: 12,
    }).start();
  }, [showGreeting]);

  useFocusEffect(
    useCallback(() => {
      const loadGreetingSetting = async () => {
        try {
          const val = await SecureStore.getItemAsync('show_greeting_bar');
          if (val === 'false') {
            setShowGreeting(false);
            greetingSwitchAnim.setValue(0);
          } else {
            setShowGreeting(true);
            greetingSwitchAnim.setValue(1);
          }
        } catch (e) {
          console.log('Erro ao ler preferência de saudação:', e);
        }
      };
      loadGreetingSetting();
    }, [greetingSwitchAnim])
  );

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

  return {
    isDarkMode,
    toggleTheme,
    colors,
    showGreeting,
    themeSwitchAnim,
    greetingSwitchAnim,
    themeIconRotate,
    themeIconScale,
    greetingIconRotate,
    greetingIconScale,
    themeRotateInterpolate,
    greetingRotateInterpolate,
    handleToggleTheme,
    handleToggleGreeting,
  };
}
