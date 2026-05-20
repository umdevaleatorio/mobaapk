import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUserMenu } from '../contexts/UserMenuContext';
import { AuthContext } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export const GlobalUserMenu = () => {
  const { isMenuVisible, closeMenu } = useUserMenu();
  const { signOut } = React.useContext(AuthContext);
  const navigation = useNavigation<any>();
  const { colors, isDarkMode } = useTheme();

  // Estado local para permitir que a animação de fechamento termine antes de ocultar o Modal
  const [shouldRender, setShouldRender] = useState(isMenuVisible);

  // Valores de animação para o pop-in/pop-out
  const animScale = useRef(new Animated.Value(0.85)).current;
  const animOpacity = useRef(new Animated.Value(0)).current;

  // Valores de escala para feedback tátil individual dos botões
  const profileScale = useRef(new Animated.Value(1)).current;
  const ordersScale = useRef(new Animated.Value(1)).current;
  const logoutScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isMenuVisible) {
      setShouldRender(true);
      Animated.parallel([
        Animated.spring(animScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 9,
        }),
        Animated.timing(animOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(animScale, {
          toValue: 0.85,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(animOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShouldRender(false);
      });
    }
  }, [isMenuVisible]);

  if (!shouldRender) return null;

  const handleNavigate = async (screenName: string, params?: any) => {
    // Primeiro executa uma rápida animação de fade-out e scale-down para o fechamento ficar suave
    Animated.parallel([
      Animated.timing(animScale, {
        toValue: 0.85,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(animOpacity, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start(() => {
      closeMenu();
      if (screenName === 'Logout') {
        signOut().catch((e) => console.error("Erro ao sair:", e));
        return;
      }
      navigation.navigate(screenName, params);
    });
  };

  const animatePress = (scaleVar: Animated.Value, action: () => void) => {
    Animated.sequence([
      Animated.timing(scaleVar, {
        toValue: 0.92,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.spring(scaleVar, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
        tension: 120,
      }),
    ]).start(() => {
      action();
    });
  };

  return (
    <Modal
      transparent
      visible={isMenuVisible}
      onRequestClose={closeMenu}
      animationType="none"
    >
      <TouchableWithoutFeedback onPress={closeMenu}>
        <View style={styles.overlay}>
          <Animated.View 
            style={[
              styles.menuContainer, 
              { 
                opacity: animOpacity,
                transform: [
                  { scale: animScale }
                ],
                backgroundColor: isDarkMode ? '#1E1E24' : '#FFFFFF',
                borderColor: isDarkMode ? '#3E3E4A' : '#E3E4EB',
              }
            ]}
          >
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => animatePress(profileScale, () => handleNavigate('ProfileScreen'))}
            >
              <Animated.View style={[styles.menuItem, { transform: [{ scale: profileScale }] }]}>
                <Text style={[styles.menuText, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>Ver perfil</Text>
              </Animated.View>
            </TouchableOpacity>
            
            <View style={[styles.menuSeparator, { backgroundColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]} />

            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => animatePress(ordersScale, () => handleNavigate('OrdersScreen'))}
            >
              <Animated.View style={[styles.menuItem, { transform: [{ scale: ordersScale }] }]}>
                <Text style={[styles.menuText, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>Ver pedidos</Text>
              </Animated.View>
            </TouchableOpacity>

            <View style={[styles.menuSeparator, { backgroundColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]} />

            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => animatePress(logoutScale, () => handleNavigate('Logout'))}
            >
              <Animated.View style={[styles.menuItem, { transform: [{ scale: logoutScale }] }]}>
                <Text style={[styles.menuText, { color: isDarkMode ? '#D51F1F' : '#C41919' }]}>Sair</Text>
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menuContainer: {
    position: 'absolute',
    top: 42, // Alinhado bem rente sob o ícone de pessoa
    right: 15, // Alinhado sob o ícone de pessoa
    backgroundColor: '#1E1E24',
    borderRadius: 8,
    width: 140,
    borderWidth: 1,
    borderColor: '#3E3E4A',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 2000,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  menuSeparator: {
    height: 1,
    backgroundColor: '#3E3E4A',
    marginHorizontal: 5,
  },
  menuText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  textRed: {
    color: '#D51F1F',
  },
});
