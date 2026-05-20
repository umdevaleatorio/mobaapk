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
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Colors from '../../theme/colors';
import { supabase } from '../../../data/datasources/supabase/client';

// SVG imports (Tela 2)
import MiniLogo from '../../assets/tela2/MiniLogo.svg';
import JaPossuiConta from '../../assets/tela2/JaPossuiConta.svg';
import EntrePorAqui from '../../assets/tela2/EntrePorAqui.svg';
import LogoAgropet from '../../assets/tela2/LogoAgropet.svg';
import SeuNome from '../../assets/tela2/SeuNome.svg';
import EmailLabel from '../../assets/tela2/EmailLabel.svg';
import SenhaLabel from '../../assets/tela2/SenhaLabel.svg';
import ConfirmarSenhaLabel from '../../assets/tela2/ConfirmarSenhaLabel.svg';
import CriarContaTexto from '../../assets/tela2/CriarContaTexto.svg';
import Suporte from '../../assets/tela2/Suporte.svg';
import Privacidade from '../../assets/tela2/Privacidade.svg';
import Termos from '../../assets/tela2/Termos.svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não conferem.');
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name, // Vai pro raw_user_meta_data para nossa Trigger capturar
        }
      }
    });

    if (error) {
      Alert.alert('Erro ao cadastrar', error.message);
    } else if (data.session == null) {
      Alert.alert('Sucesso!', 'Verifique seu e-mail para confirmar a conta (caso ativado no Supabase).');
      navigation.goBack();
    } else {
      // Já está logado se não tiver Email Confirmation Required
    }
    setLoading(false);
  };

  const handleEntrePorAqui = () => {
    navigation.replace('ClientLoginScreen');
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

          {/* "Já possui uma Conta?" + "Entre por aqui!" - lado direito */}
          <View style={styles.headerRight}>
            <JaPossuiConta width={126} height={13} />
            <TouchableOpacity onPress={handleEntrePorAqui} style={styles.entrePorAquiBtn}>
              <EntrePorAqui width={88} height={13} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ============ MEIO (Fundo Laranja) ============ */}
        <View style={styles.middleContainer}>
          {/* Logo Agropet (menor que na Tela 1) */}
          <View style={styles.logoWrapper}>
            <LogoAgropet width={SCREEN_WIDTH * 0.80} height={SCREEN_WIDTH * 0.75} />
          </View>

          {/* Card de formulário (Preenchimento #E96310, borderRadius 25) */}
          <View style={styles.formCard}>
            {/* Campo: Seu Nome */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelWrapper}>
                <SeuNome width={78} height={13} />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Nome completo ..."
                placeholderTextColor={Colors.textGray}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            {/* Campo: Email */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelWrapper}>
                <EmailLabel width={46} height={14} />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: email@gmail.com..."
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

            {/* Campo: Confirmar Senha */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelWrapper}>
                <ConfirmarSenhaLabel width={130} height={14} />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Repita a senha..."
                placeholderTextColor={Colors.textGray}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>
          </View>

          {/* Botão Criar Conta (#1C2434, borderRadius 30) */}
          <TouchableOpacity
            style={styles.criarContaButton}
            onPress={handleRegister}
            activeOpacity={0.8}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.textWhite} />
            ) : (
              <CriarContaTexto width={131} height={20} />
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
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 44, // Ajuste para a barra de status
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
  entrePorAquiBtn: {
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

  // Card do formulário (#E96310, borderRadius 25)
  formCard: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 25,
    paddingVertical: 18,
    paddingHorizontal: 28,
    width: SCREEN_WIDTH * 0.86,
    marginTop: -15,
    gap: 4,
  },

  // Campo individual
  fieldGroup: {
    marginBottom: 2,
  },
  labelWrapper: {
    marginBottom: 4,
    marginLeft: 4,
  },

  // Input branco (borderRadius 15, conforme SVG Nome.svg)
  textInput: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    height: 38,
    paddingHorizontal: 16,
    fontSize: 14,
    color: Colors.textDark,
  },

  // Botão Criar Conta (#1C2434)
  criarContaButton: {
    backgroundColor: Colors.secondary,
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
