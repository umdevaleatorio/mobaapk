import React from 'react';
import { View, StatusBar, Text, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CatalogHeader } from '../../../components/CatalogHeader';
import { styles } from './SettingsScreen.styles';
import { useSettingsScreen } from './useSettingsScreen';
import CustomSwitch from './CustomSwitch';
import EmailModal from './EmailModal';
import PhoneModal from './PhoneModal';
import PasswordModal from './PasswordModal';
import NestedModal from './NestedModal';
import PermissionsModal from './PermissionsModal';

export default function SettingsScreen() {
  const h = useSettingsScreen();

  return (
    <View style={[styles.mainContainer, { backgroundColor: h.colors.background }]}>
      <StatusBar backgroundColor={h.colors.headerBackground} barStyle="light-content" />

      <CatalogHeader
        title="Configurações"
        searchText={h.searchText}
        onSearchChange={h.setSearchText}
      />

      <View style={[styles.outerCard, { backgroundColor: h.isDarkMode ? '#2E2E38' : '#E3E4EB' }]}>
        <Text style={[styles.mainTitle, { color: h.colors.textDark }]}>Configurações do Aplicativo</Text>

        <View style={[styles.darkCard, { backgroundColor: h.isDarkMode ? '#1E1E24' : '#1C2434' }]}>
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>E-mail</Text>
            <View style={[styles.fieldInput, { backgroundColor: h.isDarkMode ? '#2E2E38' : '#C0CADE' }]}>
              <Text style={[styles.fieldValue, { color: h.isDarkMode ? '#FFFFFF' : '#1C2434' }]} numberOfLines={1}>{h.userEmail}</Text>
              {h.emailStatus === 'validar' ? (
                <TouchableOpacity
                  onPress={() => h.setShowEmailModal(true)}
                  style={[styles.alterarBtnInside, { flexDirection: 'row', alignItems: 'center' }]}
                >
                  <Text style={{ color: '#FFC107', fontSize: 16, marginRight: 4, fontWeight: 'bold' }}>!</Text>
                  <Text style={{ color: '#FFC107', fontWeight: 'bold', fontSize: 13 }}>Validar</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => { h.setEmailInput(h.userEmail); h.setEmailError(''); h.setShowEmailModal(true); }} style={styles.alterarBtnInside}>
                  <Text style={[styles.alterarTextLink, { color: h.isDarkMode ? '#5B86E5' : '#042A7D' }]}>Alterar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>Senha</Text>
            <View style={[styles.fieldInput, { backgroundColor: h.isDarkMode ? '#2E2E38' : '#C0CADE' }]}>
              <Text style={[styles.fieldValue, { color: h.isDarkMode ? '#FFFFFF' : '#1C2434' }]}>••••••••••••••</Text>
              <TouchableOpacity onPress={() => {
                h.setCurrentPassword('');
                h.setNewPassword('');
                h.setConfirmNewPassword('');
                h.setPasswordCode('');
                h.setExpectedPasswordCode('');
                h.setPasswordError('');
                h.setShowPasswordModal(true);
              }} style={styles.alterarBtnInside}>
                <Text style={[styles.alterarTextLink, { color: h.isDarkMode ? '#5B86E5' : '#042A7D' }]}>Alterar</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>Cadastrar Celular</Text>
            <View style={[styles.fieldInput, { backgroundColor: h.isDarkMode ? '#2E2E38' : '#C0CADE' }]}>
              <Text style={[styles.fieldValue, h.phone ? (h.isDarkMode ? { color: '#FFFFFF' } : { color: '#000000' }) : { color: '#919191' }]} numberOfLines={1}>
                {h.phone || 'Digite seu número...'}
              </Text>

              {h.phoneStatus === 'cadastrar' && (
                <TouchableOpacity onPress={() => { h.setPhoneInput(''); h.setShowPhoneModal(true); }} style={styles.alterarBtnInside}>
                  <Text style={[styles.alterarTextLink, { color: '#00C853' }]}>Cadastrar</Text>
                </TouchableOpacity>
              )}
              {h.phoneStatus === 'validar' && (
                <TouchableOpacity onPress={() => h.setShowPhoneModal(true)} style={[styles.alterarBtnInside, { flexDirection: 'row', alignItems: 'center' }]}>
                  <Text style={{ color: '#FFC107', fontSize: 16, marginRight: 4, fontWeight: 'bold' }}>!</Text>
                  <Text style={{ color: '#FFC107', fontWeight: 'bold', fontSize: 13 }}>Validar</Text>
                </TouchableOpacity>
              )}
              {h.phoneStatus === 'alterar' && (
                <TouchableOpacity onPress={() => { h.setPhoneInput(h.phone); h.setShowPhoneModal(true); }} style={styles.alterarBtnInside}>
                  <Text style={[styles.alterarTextLink, { color: h.isDarkMode ? '#5B86E5' : '#042A7D' }]}>Alterar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.toggleRow}>
            <Animated.View style={[styles.iconBoxAnim, { transform: [{ rotate: h.themeRotateInterpolate }, { scale: h.themeIconScale }] }]}>
              <Feather
                name={h.isDarkMode ? 'moon' : 'sun'}
                size={22}
                color={h.isDarkMode ? '#FFC107' : '#EA841E'}
              />
            </Animated.View>
            <Text style={styles.optionLabel}>Tema escuro</Text>
            <View style={styles.toggleSpacer} />
            <CustomSwitch
              active={h.isDarkMode}
              onPress={h.handleToggleTheme}
              colorActive={h.colors.primary}
              animValue={h.themeSwitchAnim}
            />
          </View>

          <View style={styles.toggleRow}>
            <Animated.View style={[styles.iconBoxAnim, { transform: [{ rotate: h.notifRotateInterpolate }] }]}>
              <Feather
                name={h.notificationsEnabled ? 'bell' : 'bell-off'}
                size={22}
                color={h.isDarkMode ? '#FFD700' : '#E3E4EB'}
              />
            </Animated.View>
            <Text style={styles.optionLabel}>Notificação</Text>
            <View style={styles.toggleSpacer} />
            <CustomSwitch
              active={h.notificationsEnabled}
              onPress={h.handleToggleNotifications}
              colorActive="#25BE36"
              animValue={h.notifSwitchAnim}
            />
          </View>

          <View style={{ gap: 4 }}>
            <View style={styles.toggleRow}>
              <Animated.View style={[styles.iconBoxAnim, { transform: [{ rotate: h.greetingRotateInterpolate }, { scale: h.greetingIconScale }] }]}>
                <Feather
                  name="clock"
                  size={22}
                  color={h.isDarkMode ? '#FFC107' : '#EA841E'}
                />
              </Animated.View>
              <Text style={styles.optionLabel}>Saudação e Horário</Text>
              <View style={styles.toggleSpacer} />
              <CustomSwitch
                active={h.showGreeting}
                onPress={h.handleToggleGreeting}
                colorActive={h.colors.primary}
                animValue={h.greetingSwitchAnim}
              />
            </View>
            <Text style={[styles.toggleSubtitle, { color: h.isDarkMode ? '#A8A8B3' : '#A2AAB8' }]}>
              Exibe a barra de saudações e funcionamento no catálogo
            </Text>
          </View>

          <View style={styles.toggleRow}>
            <Animated.View style={[styles.iconBoxAnim, { transform: [{ scale: h.permIconScale }] }]}>
              <Feather
                name="shield"
                size={22}
                color={h.isDarkMode ? '#FFC107' : '#4A90E2'}
              />
            </Animated.View>
            <Text style={styles.optionLabel}>Permissão</Text>
            <View style={styles.toggleSpacer} />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={h.handleOpenPermissions}
              style={styles.chevronButton}
            >
              <Feather
                name="chevron-right"
                size={22}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <EmailModal
        visible={h.showEmailModal}
        emailStatus={h.emailStatus}
        emailInput={h.emailInput}
        emailCode={h.emailCode}
        emailError={h.emailError}
        isDarkMode={h.isDarkMode}
        colors={h.colors}
        onClose={() => h.setShowEmailModal(false)}
        onConfirm={h.handleConfirmEmail}
        onChangeEmailInput={h.setEmailInput}
        onChangeEmailCode={h.setEmailCode}
      />

      <PhoneModal
        visible={h.showPhoneModal}
        phoneStatus={h.phoneStatus}
        phoneInput={h.phoneInput}
        isDarkMode={h.isDarkMode}
        colors={h.colors}
        onClose={() => h.setShowPhoneModal(false)}
        onConfirm={h.handleConfirmPhone}
        onChangePhoneInput={h.setPhoneInput}
      />

      <PasswordModal
        visible={h.showPasswordModal}
        passwordError={h.passwordError}
        currentPassword={h.currentPassword}
        newPassword={h.newPassword}
        confirmNewPassword={h.confirmNewPassword}
        passwordCode={h.passwordCode}
        showCurrentPassword={h.showCurrentPassword}
        showNewPassword={h.showNewPassword}
        showConfirmNewPassword={h.showConfirmNewPassword}
        isPasswordMatch={h.isPasswordMatch}
        isDarkMode={h.isDarkMode}
        colors={h.colors}
        onClose={() => h.setShowPasswordModal(false)}
        onChangeCurrentPassword={h.setCurrentPassword}
        onChangeNewPassword={h.setNewPassword}
        onChangeConfirmNewPassword={h.setConfirmNewPassword}
        onChangePasswordCode={h.setPasswordCode}
        onToggleShowCurrent={() => h.setShowCurrentPassword(!h.showCurrentPassword)}
        onToggleShowNew={() => h.setShowNewPassword(!h.showNewPassword)}
        onToggleShowConfirm={() => h.setShowConfirmNewPassword(!h.showConfirmNewPassword)}
        handleSendOtpCode={h.handleSendOtpCode}
        handleConfirmFinal={h.handleConfirmFinal}
      />

      <NestedModal
        visible={h.showNestedModal}
        colors={h.colors}
        isDarkMode={h.isDarkMode}
        onClose={() => h.setShowNestedModal(false)}
      />

      <PermissionsModal
        visible={h.showPermissionsModal}
        isDarkMode={h.isDarkMode}
        colors={h.colors}
        cameraPermission={h.cameraPermission}
        galleryPermission={h.galleryPermission}
        locationPermission={h.locationPermission}
        notificationsPermission={h.notificationsPermission}
        onClose={() => h.setShowPermissionsModal(false)}
        handlePressPermission={h.handlePressPermission}
      />
    </View>
  );
}
