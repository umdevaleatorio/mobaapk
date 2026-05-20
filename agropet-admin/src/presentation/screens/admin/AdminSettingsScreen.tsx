import React, { useState, useContext } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  TextInput,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';
import AdminHeader from '../../components/AdminHeader';
import { AdminUserMenu } from '../../components/AdminUserMenu';

// === MIDDLE SVGs ===
import ConfigTitleSvg from '../../assets/tela4/meio/Configurações do Aplicativo.svg';

// Email
import EmailLabel from '../../assets/tela4/meio/email/E-mail.svg';
import EmailAlterar from '../../assets/tela4/meio/email/Alterar.svg';

// Senha
import SenhaLabel from '../../assets/tela4/meio/senha/Senha.svg';
import SenhaAlterar from '../../assets/tela4/meio/senha/Alterar.svg';
import EyeIcon from '../../assets/tela4/meio/senha/Eye.svg';

// Raio
import AlterarRaioLabel from '../../assets/tela4/meio/raio/Alterar alcance do raio.svg';
import RaioAlterar from '../../assets/tela4/meio/raio/Alterar.svg';
import DeAlcanceText from '../../assets/tela4/meio/raio/de alcance.svg';

// Toggles
import LightDark from '../../assets/tela4/meio/tema escuro/Light n Dark.svg';
import TemaEscuroLabel from '../../assets/tela4/meio/tema escuro/Tema escuro_.svg';
import DarkModeIcon from '../../assets/tela4/meio/tema escuro/Dark Mode Icon.svg';

import NotifIconText from '../../assets/tela4/meio/notificacoes/Notificação.svg';
import NotifIconBtn from '../../assets/tela4/meio/notificacoes/Notification.svg';
import NotifLabel from '../../assets/tela4/meio/notificacoes/Notificação_.svg';
import NotifButton from '../../assets/tela4/meio/notificacoes/Notification Buttom.svg';

import PermIcon from '../../assets/tela4/meio/permissoes/Permission.svg';
import PermLabel from '../../assets/tela4/meio/permissoes/Permissão_.svg';
import PermButton from '../../assets/tela4/meio/permissoes/Perm Buttom.svg';

import FreteIconText from '../../assets/tela4/meio/frete/Frete ina.svg';
import FreteIconBtn from '../../assets/tela4/meio/frete/No delivery.svg';
import DesativarFreteLabel from '../../assets/tela4/meio/frete/Desativar frete_.svg';
import OffButtonDelivery from '../../assets/tela4/meio/frete/Off buttom delivery.svg';

export default function AdminSettingsScreen() {
  const { user } = useContext(AuthContext);
  const userEmail = user?.email || 'admin@agropet.com';

  // State for password visibility
  const [showPassword, setShowPassword] = useState(false);
  const dummyPassword = 'Admin@123456';

  // State for radius
  const [radius, setRadius] = useState('13');
  const [isEditingRadius, setIsEditingRadius] = useState(false);

  return (
    <View style={styles.mainContainer}>
      <StatusBar backgroundColor="#1C2434" barStyle="light-content" />

      {/* Header Admin */}
      <AdminHeader title="opcoes" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ========== EXTERNAL BACKGROUND (#E3E4EB, rx=25) ========== */}
        <View style={styles.outerCard}>

          {/* Title inside outer background */}
          <View style={{ marginBottom: 24, alignItems: 'center' }}>
            <ConfigTitleSvg width={300} height={25} />
          </View>

          {/* ========== DARK CARD (#1C2434, rx=25) ========== */}
          <View style={styles.darkCard}>

            {/* === E-MAIL === */}
            <View style={styles.fieldSection}>
              <View style={{ marginBottom: 6 }}>
                <EmailLabel width={48} height={13} />
              </View>
              <View style={styles.fieldInput}>
                <Text style={styles.fieldValue} numberOfLines={1}>{userEmail}</Text>
                <TouchableOpacity style={styles.alterarBtnInside}>
                  <EmailAlterar width={50} height={12} />
                </TouchableOpacity>
              </View>
            </View>

            {/* === SENHA === */}
            <View style={styles.fieldSection}>
              <View style={{ marginBottom: 6 }}>
                <SenhaLabel width={49} height={13} />
              </View>
              <View style={styles.fieldInput}>
                <Text style={styles.fieldValue}>
                  {showPassword ? dummyPassword : '••••••••••••••'}
                </Text>
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ marginRight: 8, padding: 4 }}>
                  <EyeIcon width={20} height={17} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.alterarBtnInside}>
                  <SenhaAlterar width={50} height={12} />
                </TouchableOpacity>
              </View>
            </View>

            {/* === ALCANCE DO RAIO === */}
            <View style={styles.fieldSection}>
              <View style={{ marginBottom: 6 }}>
                <AlterarRaioLabel width={160} height={14} />
              </View>
              <View style={styles.fieldInput}>
                {isEditingRadius ? (
                  <TextInput
                    style={[styles.fieldValue, { fontWeight: 'bold' }]}
                    value={radius}
                    onChangeText={setRadius}
                    keyboardType="numeric"
                    autoFocus
                    onBlur={() => setIsEditingRadius(false)}
                  />
                ) : (
                  <Text style={[styles.fieldValue, { color: '#888', fontWeight: 'bold' }]}>
                    {radius}Km
                  </Text>
                )}

                <View style={{ marginRight: 10 }}>
                  <DeAlcanceText width={65} height={12} />
                </View>
                
                <TouchableOpacity style={styles.alterarBtnInside} onPress={() => setIsEditingRadius(true)}>
                  <RaioAlterar width={50} height={12} />
                </TouchableOpacity>
              </View>
            </View>

            {/* ========== TOGGLES ========== */}

            {/* Tema escuro */}
            <View style={styles.toggleRow}>
              <LightDark width={29} height={29} />
              <TemaEscuroLabel width={107} height={14} />
              <View style={styles.toggleSpacer} />
              <TouchableOpacity activeOpacity={0.7}>
                <DarkModeIcon width={71} height={36} style={{ marginRight: -4 }} />
              </TouchableOpacity>
            </View>

            {/* Notificações */}
            <View style={styles.toggleRow}>
              <NotifIconText width={23} height={23} />
              <NotifLabel width={95} height={18} />
              <View style={styles.toggleSpacer} />
              <TouchableOpacity activeOpacity={0.7} style={{ width: 63, height: 28, justifyContent: 'center' }}>
                <NotifButton width={63} height={28} />
                <View style={{ position: 'absolute', left: 2, top: 2 }}>
                  <NotifIconBtn width={24} height={24} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Permissões */}
            <View style={styles.toggleRow}>
              <PermIcon width={21} height={21} />
              <PermLabel width={86} height={14} />
              <View style={styles.toggleSpacer} />
              <TouchableOpacity activeOpacity={0.7} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <PermButton width={63} height={28} />
              </TouchableOpacity>
            </View>

            {/* Desativar frete */}
            <View style={styles.toggleRow}>
              <FreteIconText width={25} height={25} style={{ marginLeft: -2 }} />
              <View style={{ marginLeft: 6 }}>
                <DesativarFreteLabel width={105} height={14} />
              </View>
              <View style={styles.toggleSpacer} />
              <TouchableOpacity activeOpacity={0.7} style={{ width: 63, height: 28, justifyContent: 'center' }}>
                <OffButtonDelivery width={63} height={28} />
                <View style={{ position: 'absolute', left: 2, top: 2 }}>
                  <FreteIconBtn width={24} height={24} />
                </View>
              </TouchableOpacity>
            </View>

          </View>
          {/* END DARK CARD */}

        </View>
        {/* END EXTERNAL BACKGROUND */}
      </ScrollView>

      <AdminUserMenu />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingBottom: 112, // Space for bottom bar
  },

  // ========== OUTER BACKGROUND (#E3E4EB, rx=25) ==========
  outerCard: {
    backgroundColor: '#E3E4EB',
    borderRadius: 25,
    padding: 20,
    paddingBottom: 30,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 60,
  },

  // ========== DARK CARD (#1C2434, rx=25) ==========
  darkCard: {
    backgroundColor: '#1C2434',
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingTop: 30,
    paddingBottom: 40,
    gap: 25,
  },

  // Input sections
  fieldSection: {},

  // Input field container
  fieldInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C0CADE',
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 12,
    marginTop: 6,
    gap: 8,
  },
  fieldValue: {
    flex: 1,
    fontSize: 14,
    color: '#1C2434',
  },
  alterarBtnInside: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },

  // Toggle Row
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 10,
  },
  toggleSpacer: {
    flex: 1,
  },
});
