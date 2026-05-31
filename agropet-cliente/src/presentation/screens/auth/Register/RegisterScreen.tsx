import React from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  StatusBar,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Colors from '../../../theme/colors';

import MiniLogo from '../../../assets/tela2/MiniLogo.svg';
import JaPossuiConta from '../../../assets/tela2/JaPossuiConta.svg';
import EntrePorAqui from '../../../assets/tela2/EntrePorAqui.svg';
import LogoAgropet from '../../../assets/tela2/LogoAgropet.svg';
import SeuNome from '../../../assets/tela2/SeuNome.svg';
import EmailLabel from '../../../assets/tela2/EmailLabel.svg';
import SenhaLabel from '../../../assets/tela2/SenhaLabel.svg';
import ConfirmarSenhaLabel from '../../../assets/tela2/ConfirmarSenhaLabel.svg';
import CriarContaTexto from '../../../assets/tela2/CriarContaTexto.svg';
import Suporte from '../../../assets/tela2/Suporte.svg';
import Privacidade from '../../../assets/tela2/Privacidade.svg';
import Termos from '../../../assets/tela2/Termos.svg';

import { useRegisterScreen } from './useRegisterScreen';
import { styles } from './RegisterScreen.styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function RegisterScreen() {
  const h = useRegisterScreen();

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
        <View style={styles.headerContainer}>
          <View style={styles.miniLogoWrapper}>
            <MiniLogo width={36} height={36} />
          </View>
          <View style={styles.headerRight}>
            <JaPossuiConta width={126} height={13} />
            <TouchableOpacity onPress={h.handleEntrePorAqui} style={styles.entrePorAquiBtn}>
              <EntrePorAqui width={88} height={13} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.middleContainer}>
          <View style={styles.logoWrapper}>
            <LogoAgropet width={SCREEN_WIDTH * 0.80} height={SCREEN_WIDTH * 0.75} />
          </View>

          <View style={styles.formCard}>
            <View style={styles.fieldGroup}>
              <View style={styles.labelWrapper}>
                <SeuNome width={78} height={13} />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Nome completo ..."
                placeholderTextColor={Colors.textGray}
                value={h.name}
                onChangeText={h.setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.labelWrapper}>
                <EmailLabel width={46} height={14} />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Ex: email@gmail.com..."
                placeholderTextColor={Colors.textGray}
                value={h.email}
                onChangeText={h.setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.labelWrapper}>
                <SenhaLabel width={48} height={14} />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Digite sua senha..."
                placeholderTextColor={Colors.textGray}
                value={h.password}
                onChangeText={h.setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.labelWrapper}>
                <ConfirmarSenhaLabel width={130} height={14} />
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="Repita a senha..."
                placeholderTextColor={Colors.textGray}
                value={h.confirmPassword}
                onChangeText={h.setConfirmPassword}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.criarContaButton}
            onPress={h.handleRegister}
            activeOpacity={0.8}
            disabled={h.loading}
          >
            {h.loading ? (
              <ActivityIndicator color={Colors.textWhite} />
            ) : (
              <CriarContaTexto width={131} height={20} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footerContainer}>
          <View style={styles.footerContent}>
            <TouchableOpacity style={styles.footerItem}>
              <Suporte width={85} height={23} />
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity style={styles.footerItem}>
              <Privacidade width={127} height={21} />
            </TouchableOpacity>
            <View style={styles.separator} />
            <TouchableOpacity style={styles.footerItem}>
              <Termos width={82} height={19} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
