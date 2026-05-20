import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Colors from '../theme/colors';

// SVG imports (renderizados como componentes via react-native-svg-transformer)
import MiniLogo from '../assets/tela1/MiniLogo.svg';
import NaoTemConta from '../assets/tela1/NaoTemConta.svg';
import ComeceAqui from '../assets/tela1/ComeceAqui.svg';
import LogoAgropet from '../assets/tela1/LogoAgropet.svg';
import BoasVindas from '../assets/tela1/BoasVindas.svg';
import CadastroTexto from '../assets/tela1/CadastroTexto.svg';
import LoginTexto from '../assets/tela1/LoginTexto.svg';
import Suporte from '../assets/tela1/Suporte.svg';
import Privacidade from '../assets/tela1/Privacidade.svg';
import Termos from '../assets/tela1/Termos.svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SplashScreen() {
  const navigation = useNavigation<any>();

  const handleCadastro = () => {
    navigation.navigate('RegisterScreen');
  };

  const handleLogin = () => {
    navigation.navigate('ClientLoginScreen');
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
      >
        {/* ============ PARTE SUPERIOR (Header Branco) ============ */}
        <View style={styles.headerContainer}>
          {/* Mini Logo - lado esquerdo */}
          <View style={styles.miniLogoWrapper}>
            <MiniLogo width={36} height={36} />
          </View>

          {/* "Não tem Conta?" + "Comece aqui!" - lado direito */}
          <View style={styles.headerRight}>
            <NaoTemConta width={93} height={11} fill={Colors.secondary} />
            <TouchableOpacity onPress={handleComeceAqui} style={styles.comeceAquiBtn}>
              <ComeceAqui width={79} height={13} fill={Colors.accent} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ============ PARTE DO MEIO (Fundo Laranja) ============ */}
        <View style={styles.middleContainer}>
          {/* Logo Agropet */}
          <View style={styles.logoWrapper}>
            <LogoAgropet width={SCREEN_WIDTH * 0.80} height={SCREEN_WIDTH * 0.75} />
          </View>

          {/* Boas-Vindas texto */}
          <View style={styles.boasVindasWrapper}>
            <BoasVindas width={211} height={96} />
          </View>

          {/* Card de botões (Preenchimento #E96310) */}
          <View style={styles.buttonsCard}>
            {/* Botão Cadastro - fundo #1C2434 */}
            <TouchableOpacity
              style={styles.cadastroButton}
              onPress={handleCadastro}
              activeOpacity={0.8}
            >
              <CadastroTexto width={102} height={20} />
            </TouchableOpacity>

            {/* Botão Login - fundo branco #EEEDED */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <LoginTexto width={68} height={24} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ============ PARTE INFERIOR (Footer) ============ */}
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

  // ====== HEADER (Parte Superior) ======
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
    paddingTop: 10,
    paddingBottom: 20,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
  },
  boasVindasWrapper: {
    alignItems: 'center',
    marginTop: -30,
    marginBottom: 35,
  },

  // Card dos botões
  buttonsCard: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 25,
    paddingVertical: 30,
    paddingHorizontal: 40,
    alignItems: 'center',
    width: SCREEN_WIDTH * 0.82,
    gap: 18,
  },

  // Botão Cadastro (#1C2434)
  cadastroButton: {
    backgroundColor: Colors.secondary,
    borderRadius: 30,
    width: 206,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Botão Login (branco #EEEDED)
  loginButton: {
    backgroundColor: Colors.white,
    borderRadius: 30,
    width: 206,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ====== FOOTER (Parte Inferior) ======
  footerContainer: {
    backgroundColor: Colors.primaryDark,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginTop: 20,
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
