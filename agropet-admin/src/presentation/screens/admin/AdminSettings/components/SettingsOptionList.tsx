import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from '../AdminSettingsScreen.styles';

import EmailLabel from '../../../../assets/tela4/meio/email/E-mail.svg';
import EmailAlterar from '../../../../assets/tela4/meio/email/Alterar.svg';
import SenhaLabel from '../../../../assets/tela4/meio/senha/Senha.svg';
import SenhaAlterar from '../../../../assets/tela4/meio/senha/Alterar.svg';
import AlterarRaioLabel from '../../../../assets/tela4/meio/raio/Alterar alcance do raio.svg';
import RaioAlterar from '../../../../assets/tela4/meio/raio/Alterar.svg';
import DeAlcanceText from '../../../../assets/tela4/meio/raio/de alcance.svg';
import TemaEscuroLabel from '../../../../assets/tela4/meio/tema escuro/Tema escuro_.svg';
import NotifLabel from '../../../../assets/tela4/meio/notificacoes/Notificação_.svg';
import PermLabel from '../../../../assets/tela4/meio/permissoes/Permissão_.svg';
import DesativarFreteLabel from '../../../../assets/tela4/meio/frete/Desativar frete_.svg';
import CustomSwitch from '../CustomSwitch';

interface SettingsOptionListProps {
  h: any;
}

export default function SettingsOptionList({ h }: SettingsOptionListProps) {
  return (
    <View style={[styles.darkCard, { backgroundColor: h.isDarkMode ? '#1E1E24' : '#1C2434' }]}>
      <View style={styles.fieldSection}>
        <View style={{ marginBottom: 6 }}>
          <EmailLabel width={48} height={13} />
        </View>
        <View style={[styles.fieldInput, { backgroundColor: h.isDarkMode ? '#2E2E38' : '#C0CADE' }]}>
          <Text style={[styles.fieldValue, { color: h.isDarkMode ? '#FFFFFF' : '#1C2434' }]} numberOfLines={1}>
            {h.userEmail}
          </Text>
          {h.emailStatus === 'validar' ? (
            <TouchableOpacity
              onPress={() => h.setShowEmailModal(true)}
              style={[styles.alterarBtnInside, { flexDirection: 'row', alignItems: 'center' }]}
            >
              <Text style={{ color: '#FFC107', fontSize: 16, marginRight: 4, fontWeight: 'bold' }}>!</Text>
              <Text style={{ color: '#FFC107', fontWeight: 'bold', fontSize: 13 }}>Validar</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => { h.setEmailInput(h.userEmail); h.setEmailError(''); h.setShowEmailModal(true); }}
              style={styles.alterarBtnInside}
            >
              {h.isDarkMode ? (
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>Alterar</Text>
              ) : (
                <EmailAlterar width={50} height={12} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.fieldSection}>
        <View style={{ marginBottom: 6 }}>
          <SenhaLabel width={49} height={13} />
        </View>
        <View style={[styles.fieldInput, { backgroundColor: h.isDarkMode ? '#2E2E38' : '#C0CADE' }]}>
          <Text style={[styles.fieldValue, { color: h.isDarkMode ? '#FFFFFF' : '#1C2434' }]}>
            ••••••••••••••
          </Text>
          <TouchableOpacity
            onPress={() => {
              h.setCurrentPassword('');
              h.setNewPassword('');
              h.setConfirmNewPassword('');
              h.setPasswordCode('');
              h.setExpectedPasswordCode('');
              h.setPasswordError('');
              h.setShowPasswordModal(true);
            }}
            style={styles.alterarBtnInside}
          >
            {h.isDarkMode ? (
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>Alterar</Text>
            ) : (
              <SenhaAlterar width={50} height={12} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.fieldSection}>
        <View style={{ marginBottom: 6 }}>
          <AlterarRaioLabel
            width={160}
            height={14}
            fill={h.isDarkMode ? '#FFFFFF' : undefined}
            stroke={h.isDarkMode ? '#FFFFFF' : undefined}
          />
        </View>
        <View style={[styles.fieldInput, { backgroundColor: h.isDarkMode ? '#2E2E38' : '#C0CADE' }]}>
          {h.isEditingRadius ? (
            <TextInput
              style={[styles.fieldValue, { fontWeight: 'bold', color: h.isDarkMode ? '#FFFFFF' : '#1C2434' }]}
              value={h.radius}
              onChangeText={h.setRadius}
              keyboardType="numeric"
              autoFocus
              testID="radius-input"
              onSubmitEditing={() => h.handleSaveRadius(h.radius)}
            />
          ) : (
            <Text style={[styles.fieldValue, { color: h.isDarkMode ? '#A8A8B3' : '#888', fontWeight: 'bold' }]}>
              {h.radius}Km
            </Text>
          )}
          <View style={{ marginRight: 10 }}>
            {h.isDarkMode ? (
              <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500' }}>de alcance</Text>
            ) : (
              <DeAlcanceText width={76} height={14} />
            )}
          </View>
          <TouchableOpacity
            style={styles.alterarBtnInside}
            testID="edit-radius-btn"
            onPress={() => {
              if (h.isEditingRadius) {
                h.handleSaveRadius(h.radius);
              } else {
                h.setIsEditingRadius(true);
              }
            }}
          >
            {h.isEditingRadius ? (
              <Text style={{ color: h.isDarkMode ? '#FFC107' : '#042A7D', fontWeight: 'bold', fontSize: 13 }}>
                Salvar
              </Text>
            ) : (
              h.isDarkMode ? (
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>Alterar</Text>
              ) : (
                <RaioAlterar width={50} height={12} />
              )
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.toggleRow}>
        <Animated.View style={[styles.iconBoxAnim, { transform: [{ rotate: h.themeRotateInterpolate }, { scale: h.themeIconScale }] }]}>
          <Feather name={h.isDarkMode ? 'moon' : 'sun'} size={22} color={h.isDarkMode ? '#FFC107' : '#EA841E'} />
        </Animated.View>
        <TemaEscuroLabel width={107} height={14} />
        <View style={styles.toggleSpacer} />
        <CustomSwitch active={h.isDarkMode} onPress={h.handleToggleTheme} colorActive={h.colors.primary} animValue={h.themeSwitchAnim} isDarkMode={h.isDarkMode} />
      </View>

      <View style={styles.toggleRow}>
        <Animated.View style={[styles.iconBoxAnim, { transform: [{ rotate: h.notifRotateInterpolate }] }]}>
          <Feather name={h.notificationsEnabled ? 'bell' : 'bell-off'} size={22} color={h.isDarkMode ? '#FFD700' : '#E3E4EB'} />
        </Animated.View>
        <NotifLabel width={95} height={18} />
        <View style={styles.toggleSpacer} />
        <CustomSwitch active={h.notificationsEnabled} onPress={h.handleToggleNotifications} colorActive="#25BE36" animValue={h.notifSwitchAnim} isDarkMode={h.isDarkMode} />
      </View>

      <View style={{ gap: 4 }}>
        <View style={styles.toggleRow}>
          <Animated.View style={[styles.iconBoxAnim, { transform: [{ rotate: h.greetingRotateInterpolate }, { scale: h.greetingIconScale }] }]}>
            <Feather name="clock" size={22} color={h.isDarkMode ? '#FFC107' : '#EA841E'} />
          </Animated.View>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#FFFFFF' }}>Saudação e Horário</Text>
          <View style={styles.toggleSpacer} />
          <CustomSwitch active={h.showGreeting} onPress={h.handleToggleGreeting} colorActive={h.colors.primary} animValue={h.greetingSwitchAnim} isDarkMode={h.isDarkMode} />
        </View>
        <Text style={[styles.toggleSubtitle, { color: h.isDarkMode ? '#A8A8B3' : '#A2AAB8' }]}>
          Exibe a barra de saudações e funcionamento no menu
        </Text>
      </View>

      <View style={styles.toggleRow}>
        <Animated.View style={[styles.iconBoxAnim, { transform: [{ scale: h.permIconScale }] }]}>
          <Feather name="shield" size={22} color={h.isDarkMode ? '#FFC107' : '#4A90E2'} />
        </Animated.View>
        <PermLabel width={86} height={14} />
        <View style={styles.toggleSpacer} />
        <TouchableOpacity activeOpacity={0.7} onPress={h.handleOpenPermissions} style={styles.chevronButton}>
          <Feather name="chevron-right" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.toggleRow}>
        <View style={{ width: 29, height: 29, justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
          <Feather name="truck" size={22} color={h.isDarkMode ? '#FFC107' : '#EA841E'} />
          <Animated.View
            style={{
              position: 'absolute',
              width: 26,
              height: 2.5,
              backgroundColor: '#FF3B30',
              transform: [{ scaleX: h.deliverySwitchAnim }, { rotate: '-45deg' }],
              opacity: h.deliverySwitchAnim,
              borderRadius: 1,
            }}
          />
        </View>
        <View style={{ marginLeft: 3 }}>
          <DesativarFreteLabel width={105} height={14} />
        </View>
        <View style={styles.toggleSpacer} />
        <CustomSwitch active={h.deliveryDisabled} onPress={() => h.handleToggleDelivery(!h.deliveryDisabled)} colorActive="#FF3B30" animValue={h.deliverySwitchAnim} isDarkMode={h.isDarkMode} />
      </View>

      <View style={styles.toggleRow}>
        <Animated.View style={[styles.iconBoxAnim]}>
          <Feather name="users" size={22} color={h.isDarkMode ? '#FFC107' : '#4A90E2'} />
        </Animated.View>
        <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#FFFFFF', flex: 1 }}>Contas para exclusão</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={h.handleOpenDeletedUsers} style={styles.chevronButton} testID="deleted-users-chevron">
          <Feather name="chevron-right" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.fieldSection}>
        <View style={{ marginBottom: 6, flexDirection: 'row', alignItems: 'center' }}>
          <Feather name="credit-card" size={18} color="#00BFA5" style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#FFFFFF' }}>Chave PIX</Text>
        </View>
        <View style={[{ backgroundColor: h.isDarkMode ? '#2E2E38' : '#C0CADE', borderRadius: 10, padding: 12, gap: 8 }]}>
          <TextInput
            style={[{ fontSize: 14, fontWeight: 'bold', color: h.isDarkMode ? '#FFFFFF' : '#1C2434' }]}
            value={h.chavePix}
            onChangeText={h.setChavePix}
            placeholder="Ex: 12345678900"
            placeholderTextColor={h.isDarkMode ? '#666' : '#999'}
          />
          <TextInput
            style={[{ fontSize: 14, fontWeight: 'bold', color: h.isDarkMode ? '#A8A8B3' : '#888' }]}
            value={h.pixMerchantName}
            onChangeText={h.setPixMerchantName}
            placeholder="Nome do titular (opcional)"
            placeholderTextColor={h.isDarkMode ? '#666' : '#999'}
          />
          <TouchableOpacity
            style={{ alignSelf: 'flex-end', backgroundColor: '#00BFA5', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 16 }}
            onPress={h.handleSavePixKey}
            activeOpacity={0.7}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>Salvar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
