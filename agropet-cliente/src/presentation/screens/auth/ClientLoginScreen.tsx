import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Colors from '../../theme/colors';
import { supabase } from '../../../data/datasources/supabase/client';

// SVG imports (Tela 3)
import MiniLogo from '../../assets/tela3/MiniLogo.svg';
import NaoTemConta from '../../assets/tela3/NaoTemConta.svg';
import ComeceAqui from '../../assets/tela3/ComeceAqui.svg';
import LogoAgropet from '../../assets/tela3/LogoAgropet.svg';
import BemVindo from '../../assets/tela3/BemVindo.svg';
import EmailLabel from '../../assets/tela3/EmailLabel.svg';
import SenhaLabel from '../../assets/tela3/SenhaLabel.svg';
import EntrarTexto from '../../assets/tela3/EntrarTexto.svg';
import Suporte from '../../assets/tela3/Suporte.svg';
import Privacidade from '../../assets/tela3/Privacidade.svg';
import Termos from '../../assets/tela3/Termos.svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ClientLoginScreen() {
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      Alert.alert('Erro no Login', error.message);
    } else {
      // O AuthContext interceptará e navegará automaticamente
    }
    setLoading(false);
  };

  const handleComeceAqui = () => {
    navigation.navigate('RegisterScreen');
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar backgroundColor={Colors.white} barStyle="dark-content" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ============ HEADER (Branco retangular) ============ */}
        <View style={styles.headerContainer}>
          {/* Mini Logo - lado esquerdo */}
          <View style={styles.miniLogoWrapper}>
            <MiniLogo width={36} height={36} />
          </View>

          {/* "Não tem Conta?" + "Comece aqui!" - lado direito */}
          <View style={styles.headerRight}>
            <NaoTemConta width={93} height={11} />
            <TouchableOpacity onPress={handleComeceAqui} style={styles.comeceAquiBtn}>
              <ComeceAqui width={79} height={13} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ============ MEIO (Fundo Laranja) ============ */}
        <View style={styles.middleContainer}>
          {/* Logo Agropet */}
          <View style={styles.logoWrapper}>
            <LogoAgropet width={SCREEN_WIDTH * 0.80} height={SCREEN_WIDTH * 0.75} />
          </View>

          {/* Texto Bem-vindo */}
          <View style={styles.bemVindoWrapper}>
            <BemVindo width={238} height={96} />
          </View>

          {/* Card do formulário (#E96310, borderRadius 25) */}
          <View style={styles.formCard}>
            {/* Campo: Email */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelWrapper}>
                <EmailLabel width={46} height={14} />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Digite seu email..."
                placeholderTextColor={Colors.textGray}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {/* Campo: Senha */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelWrapper}>
                <SenhaLabel width={48} height={14} />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Digite sua senha..."
                placeholderTextColor={Colors.textGray}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          {/* Botão Entrar (Branco, borderRadius 30) */}
          <TouchableOpacity
            style={styles.entrarButton}
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.textDark} />
            ) : (
              <EntrarTexto width={75} height={19} />
            )}
          </TouchableOpacity>
        </View>

        {/* ============ FOOTER (Retangular #E96310) ============ */}
        <View style={styles.footerContainer}>
          <View style={styles.footerContent}>
            {/* Suporte */}
            <TouchableOpacity style={styles.footerItem}>
              <Suporte width={85} height={23} />
            </TouchableOpacity>

            {/* Separador 1 */}
            <View style={styles.separator} />

            {/* Privacidade */}
            <TouchableOpacity style={styles.footerItem}>
              <Privacidade width={127} height={21} />
            </TouchableOpacity>

            {/* Separador 2 */}
            <View style={styles.separator} />

            {/* Termos */}
            <TouchableOpacity style={styles.footerItem}>
              <Termos width={82} height={19} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // ====== HEADER (Retangular Branco) ======
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: Colors.white,
  },
  miniLogoWrapper: {
    width: 36,
    height: 36,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  comeceAquiBtn: {
    marginLeft: 4,
  },

  // ====== MEIO (Fundo Laranja) ======
  middleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 5,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  bemVindoWrapper: {
    alignItems: 'center',
    marginTop: -25,
    marginBottom: 15,
  },

  // Card do formulário (#E96310, borderRadius 25)
  formCard: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 25,
    paddingVertical: 18,
    paddingHorizontal: 28,
    width: SCREEN_WIDTH * 0.86,
    gap: 6,
  },

  // Campo individual
  fieldGroup: {
    marginBottom: 2,
  },
  labelWrapper: {
    marginBottom: 4,
    marginLeft: 4,
  },

  // Input branco (borderRadius 15)
  textInput: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    height: 38,
    paddingHorizontal: 16,
    fontSize: 14,
    color: Colors.textDark,
  },

  // Botão Entrar (Branco, borderRadius 30)
  entrarButton: {
    backgroundColor: Colors.white,
    borderRadius: 30,
    width: 206,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },

  // ====== FOOTER (Retangular #E96310) ======
  footerContainer: {
    backgroundColor: Colors.primaryDark,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  footerItem: {
    paddingHorizontal: 4,
  },

  // Separador (linha vertical branca)
  separator: {
    width: 1,
    height: 29,
    backgroundColor: Colors.white,
    borderRadius: 0.5,
  },
});
