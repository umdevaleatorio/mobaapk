import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Text,
  Animated,
} from 'react-native';
import Colors from '../../theme/colors';
import AdminHeader from '../../components/AdminHeader';
import { AdminUserMenu } from '../../components/AdminUserMenu';
import { AuthContext } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { getShopStatus } from '../../../utils/shopHours';
import * as SecureStore from 'expo-secure-store';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../../data/datasources/supabase/client';

// SVGs Admin Tela 2 (Substituídos por elementos nativos de alto desempenho)

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AdminHomeScreen() {
  const { signOut, user } = React.useContext(AuthContext);
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
        // Set starting animated values for entrance animation
        greetingOpacity.setValue(0);
        greetingScale.setValue(0.95);
        closeButtonRotate.setValue(0);
        closeButtonScale.setValue(1);
        setShowGreetingBar(true);

        // Run transition
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
        {showGreetingBar && (
          <Animated.View style={[
            styles.welcomeWrapper, 
            { 
              backgroundColor: isDarkMode ? colors.cardBackground : '#F5F6FA', 
              borderColor: isDarkMode ? '#2E2E38' : '#E3E4EB', 
              borderWidth: 1,
              opacity: greetingOpacity,
              transform: [{ scale: greetingScale }]
            }
          ]}>
            <TouchableOpacity 
              style={styles.closeGreetingBtn} 
              onPress={handleDismissGreeting}
              activeOpacity={0.7}
            >
              <Animated.View style={{
                transform: [
                  { rotate: closeButtonRotate.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '180deg']
                  }) },
                  { scale: closeButtonScale }
                ]
              }}>
                <Feather name="x" size={18} color={isDarkMode ? '#A8A8B3' : '#767676'} />
              </Animated.View>
            </TouchableOpacity>
            <Text style={[styles.welcomeText, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>
              {greeting}
            </Text>
            {shopStatus && (
              <Text style={[styles.countdownText, { color: shopStatus.isOpen ? '#4A90D9' : '#FF3B30' }]}>
                {shopStatus.countdownText}
              </Text>
            )}
          </Animated.View>
        )}

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
          onPress={() => navigation.navigate('AdminDashboardScreen')}
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
    width: SCREEN_WIDTH * 0.85,
    marginVertical: 15,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  closeGreetingBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 4,
    zIndex: 10,
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
  countdownText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
});
