import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TouchableWithoutFeedback, TouchableHighlight, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUserMenu } from '../contexts/UserMenuContext';
import { AuthContext } from '../contexts/AuthContext';
import Colors from '../theme/colors';

export const AdminUserMenu = () => {
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
              onPress={() => handleNavigate('AdminProfile')} // Assuming AdminProfile placeholder or real
            >
              <Text style={styles.menuText}>Ver perfil</Text>
            </TouchableHighlight>
            
            <View style={styles.menuSeparator} />

            <TouchableHighlight 
              style={styles.menuItem} 
              underlayColor="#767676"
              onPress={() => handleNavigate('AdminOrdersScreen')}
            >
              <Text style={styles.menuText}>Ver pedidos</Text>
            </TouchableHighlight>

            <View style={styles.menuSeparator} />

            <TouchableHighlight 
              style={styles.menuItem} 
              underlayColor="#767676"
              onPress={() => handleNavigate('Logout')}
            >
              <Text style={[styles.menuText, { color: '#FF4444' }]}>Sair</Text>
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
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  menuContainer: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 65 : 80, // Moved higher
    right: 20,
    backgroundColor: '#353A4D',
    borderRadius: 12,
    width: 160,
    paddingVertical: 5,
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  menuText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  menuSeparator: {
    height: 1,
    backgroundColor: '#4A5064',
    marginHorizontal: 10,
  },
});
