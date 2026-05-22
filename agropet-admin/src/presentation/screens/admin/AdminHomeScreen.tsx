import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Text,
} from 'react-native';
import Colors from '../../theme/colors';
import AdminHeader from '../../components/AdminHeader';
import { AdminUserMenu } from '../../components/AdminUserMenu';
import { AuthContext } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';

// SVGs Admin Tela 2 (Substituídos por elementos nativos de alto desempenho)

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AdminHomeScreen() {
  const { signOut } = React.useContext(AuthContext);
  const navigation = useNavigation<any>();
  const { colors, isDarkMode } = useTheme();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error("Erro ao sair:", e);
    }
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.white }]}>
      <StatusBar backgroundColor={colors.headerBackground} barStyle="light-content" />
      <AdminHeader />
      
      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Message */}
        <View style={styles.welcomeWrapper}>
          <Text style={[styles.welcomeText, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>
            Bem-vindo, Administrador!
          </Text>
        </View>

        {/* Gerenciar Section Title */}
        <View style={styles.sectionTitleWrapper}>
          <Text style={[styles.sectionTitle, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>
            Gerenciar:
          </Text>
        </View>

        {/* Sales Panel Card */}
        <TouchableOpacity 
          style={[
            styles.cardButton, 
            { backgroundColor: isDarkMode ? colors.cardBackground : '#1C2434' }
          ]} 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('AdminOrdersScreen')}
        >
          <Text style={styles.cardText}>Painel de Vendas</Text>
        </TouchableOpacity>

        {/* Sales History Card */}
        <TouchableOpacity 
          style={[
            styles.cardButton, 
            { backgroundColor: isDarkMode ? colors.cardBackground : '#1C2434' }
          ]} 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('AdminSalesHistoryScreen')}
        >
          <Text style={styles.cardText}>Histórico de Vendas</Text>
        </TouchableOpacity>

        {/* Ver Pedidos Card */}
        <TouchableOpacity 
          style={[
            styles.cardButton, 
            { backgroundColor: isDarkMode ? colors.cardBackground : '#1C2434' }
          ]} 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('AdminOrdersScreen')}
        >
          <Text style={styles.cardText}>Ver Pedidos</Text>
        </TouchableOpacity>

        {/* Logout Button (Red) */}
        <TouchableOpacity 
          style={[
            styles.cardButton, 
            { backgroundColor: '#A72424', marginTop: 5 }
          ]} 
          activeOpacity={0.8}
          onPress={handleLogout}
        >
          <Text style={styles.cardText}>Sair</Text>
        </TouchableOpacity>
        
        {/* Padding for bottom tab bar if needed, but absolute pos usually covers it */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Global Admin Menu Modal */}
      <AdminUserMenu />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 24,
  },
  welcomeWrapper: {
    marginBottom: 30,
    alignItems: 'center',
  },
  sectionTitleWrapper: {
    alignSelf: 'flex-start',
    marginLeft: '5%',
    marginBottom: 15,
  },
  cardButton: {
    width: SCREEN_WIDTH * 0.85,
    height: 115,
    borderRadius: 20,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  cardText: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: 'bold',
  },
});
