import React from 'react';
import { View, ScrollView, TouchableOpacity, StatusBar, Text, Animated } from 'react-native';
import AdminHeader from '../../../components/AdminHeader';
import { AdminUserMenu } from '../../../components/AdminUserMenu';
import { Feather } from '@expo/vector-icons';

import { useAdminHome } from './useAdminHome';
import { styles } from './AdminHomeScreen.styles';

export default function AdminHomeScreen() {
  const h = useAdminHome();

  return (
    <View style={[styles.mainContainer, { backgroundColor: h.colors.white }]}>
      <StatusBar backgroundColor={h.colors.headerBackground} barStyle="light-content" />
      <AdminHeader />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {h.showGreetingBar && (
          <Animated.View style={[
            styles.welcomeWrapper,
            {
              backgroundColor: h.isDarkMode ? h.colors.cardBackground : '#F5F6FA',
              borderColor: h.isDarkMode ? '#2E2E38' : '#E3E4EB',
              borderWidth: 1,
              opacity: h.greetingOpacity,
              transform: [{ scale: h.greetingScale }]
            }
          ]}>
            <TouchableOpacity
              style={styles.closeGreetingBtn}
              onPress={h.handleDismissGreeting}
              activeOpacity={0.7}
            >
              <Animated.View style={{
                transform: [
                  { rotate: h.closeButtonRotate.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '180deg']
                  }) },
                  { scale: h.closeButtonScale }
                ]
              }}>
                <Feather name="x" size={18} color={h.isDarkMode ? '#A8A8B3' : '#767676'} />
              </Animated.View>
            </TouchableOpacity>
            <Text style={[styles.welcomeText, { color: h.isDarkMode ? '#FFFFFF' : '#1C2434' }]}>
              {h.greeting}
            </Text>
            {h.shopStatus && (
              <Text style={[styles.countdownText, { color: h.shopStatus.isOpen ? '#4A90D9' : '#FF3B30' }]}>
                {h.shopStatus.countdownText}
              </Text>
            )}
          </Animated.View>
        )}

        <View style={styles.sectionTitleWrapper}>
          <Text style={[styles.sectionTitle, { color: h.isDarkMode ? '#FFFFFF' : '#1C2434' }]}>
            Gerenciar:
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.cardButton,
            { backgroundColor: h.isDarkMode ? h.colors.cardBackground : '#1C2434' }
          ]}
          activeOpacity={0.8}
          onPress={() => h.navigation.navigate('AdminDashboardScreen')}
        >
          <Text style={styles.cardText}>Painel de Vendas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.cardButton,
            { backgroundColor: h.isDarkMode ? h.colors.cardBackground : '#1C2434' }
          ]}
          activeOpacity={0.8}
          onPress={() => h.navigation.navigate('AdminSalesHistoryScreen')}
        >
          <Text style={styles.cardText}>Histórico de Vendas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.cardButton,
            { backgroundColor: h.isDarkMode ? h.colors.cardBackground : '#1C2434' }
          ]}
          activeOpacity={0.8}
          onPress={() => h.navigation.navigate('AdminOrdersScreen')}
        >
          <Text style={styles.cardText}>Ver Pedidos</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.cardButton,
            { backgroundColor: '#A72424', marginTop: 5 }
          ]}
          activeOpacity={0.8}
          onPress={h.handleLogout}
        >
          <Text style={styles.cardText}>Sair</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      <AdminUserMenu />
    </View>
  );
}
