import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback, TouchableHighlight } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUserMenu } from '../contexts/UserMenuContext';
import { AuthContext } from '../contexts/AuthContext';

export const GlobalUserMenu = () => {
  const { isMenuVisible, closeMenu } = useUserMenu();
  const { signOut } = React.useContext(AuthContext);
  const navigation = useNavigation<any>();

  if (!isMenuVisible) return null;

  const handleNavigate = async (screenName: string, params?: any) => {
    closeMenu();
    if (screenName === 'Logout') {
      try {
        await signOut();
      } catch (e) {
        console.error("Erro ao sair:", e);
      }
      return;
    }
    navigation.navigate(screenName, params);
  };

  return (
    <Modal
      transparent
      visible={isMenuVisible}
      onRequestClose={closeMenu}
      animationType="fade"
    >
      <TouchableWithoutFeedback onPress={closeMenu}>
        <View style={styles.overlay}>
          <View style={styles.menuContainer}>
            <TouchableHighlight 
              style={styles.menuItem} 
              underlayColor="#767676"
              onPress={() => handleNavigate('ProfileScreen')}
            >
              <Text style={styles.menuText}>Ver perfil</Text>
            </TouchableHighlight>
            
            <View style={styles.menuSeparator} />

            <TouchableHighlight 
              style={styles.menuItem} 
              underlayColor="#767676"
              onPress={() => handleNavigate('OrdersScreen')}
            >
              <Text style={styles.menuText}>Ver pedidos</Text>
            </TouchableHighlight>

            <View style={styles.menuSeparator} />

            <TouchableHighlight 
              style={styles.menuItem} 
              underlayColor="#767676"
              onPress={() => handleNavigate('Logout')}
            >
              <Text style={[styles.menuText, styles.textRed]}>Sair</Text>
            </TouchableHighlight>
          </View>
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
    backgroundColor: '#E3E4EB',
    borderRadius: 8,
    width: 140,
    borderWidth: 1,
    borderColor: '#CCC',
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
    backgroundColor: '#CCC',
    marginHorizontal: 5,
  },
  menuText: {
    fontSize: 14,
    color: '#1C2434',
    fontWeight: '500',
  },
  textRed: {
    color: '#D51F1F',
  },
});
