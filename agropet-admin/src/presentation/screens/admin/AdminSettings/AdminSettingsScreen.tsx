import React from 'react';
import {
  View,
  StatusBar,
  TextInput,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  RefreshControl,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AdminHeader from '../../../components/AdminHeader';
import { AdminUserMenu } from '../../../components/AdminUserMenu';
import { useAdminSettings } from './useAdminSettings';
import { styles } from './AdminSettingsScreen.styles';
import ConfigTitleSvg from '../../../assets/tela4/meio/Configurações do Aplicativo.svg';
import CustomSwitch from './CustomSwitch';
import SettingsOptionList from './components/SettingsOptionList';
import EmailModal from './EmailModal';
import PasswordModal from './PasswordModal';
import NestedModal from './NestedModal';
import PermissionsModal from './PermissionsModal';

export default function AdminSettingsScreen() {
  const h = useAdminSettings();

  return (
    <View style={[styles.mainContainer, { backgroundColor: h.colors.backgroundLight }]}>
      <StatusBar backgroundColor={h.colors.headerBackground} barStyle="light-content" />
      <AdminHeader title="opcoes" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={h.refreshing} onRefresh={h.handleRefresh} />
        }
      >
        <View style={[styles.outerCard, { backgroundColor: h.isDarkMode ? '#2E2E38' : '#E3E4EB' }]}>
          <View style={{ marginBottom: 24, alignItems: 'center' }}>
            {h.isDarkMode ? (
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' }}>
                Configurações do Aplicativo
              </Text>
            ) : (
              <ConfigTitleSvg width={300} height={25} />
            )}
          </View>
          <SettingsOptionList h={h} />
        </View>
      </ScrollView>

      <EmailModal h={h} />
      <PasswordModal h={h} />
      <NestedModal h={h} />
      <PermissionsModal h={h} />
      <AdminUserMenu />
    </View>
  );
}
