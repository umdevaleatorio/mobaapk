import React from 'react';
import {
  View,
  StatusBar,
  TextInput,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { useAdminProfile } from './useAdminProfile';
import { styles } from './AdminProfileScreen.styles';
import AdminHeader from '../../../components/AdminHeader';
import { useTheme } from '../../../contexts/ThemeContext';
import ProfilePhotoSection from './components/ProfilePhotoSection';
import ProfileInfoCard from './components/ProfileInfoCard';
import ProfileModal from './components/ProfileModal';
import AdminAddressCard from './components/AdminAddressCard';

export default function AdminProfileScreen() {
  const h = useAdminProfile();
  const { colors } = useTheme();

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.backgroundLight }]}>
      <StatusBar backgroundColor={colors.headerBackground} barStyle="light-content" />
      <AdminHeader title="perfil_adm" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeaderRow}>
          <ProfilePhotoSection
            photoUri={h.photoUri}
            isDarkMode={h.isDarkMode}
            handleSelectPhoto={h.handleSelectPhoto}
          />
          <View style={styles.topFields}>
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textDark }]}>Nome:</Text>
              <View style={[styles.textInputBox, { backgroundColor: colors.cardBackground }]}>
                <TextInput
                  style={[styles.input, { color: h.nome ? colors.textDark : '#919191' }]}
                  placeholder="Digite o seu nome aqui..."
                  placeholderTextColor={h.isDarkMode ? '#8E8E93' : '#919191'}
                  value={h.nome}
                  onChangeText={h.setNome}
                />
              </View>
            </View>
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textDark }]}>Nome de usuário:</Text>
              <TouchableOpacity
                style={[styles.textInputBox, { backgroundColor: colors.cardBackground }]}
                onPress={() => {
                  /* istanbul ignore next */ if (!h.usuario) {
                    h.setUsernameInput('');
                    h.setUsernameStatus('idle');
                    h.setShowUsernameModal(true);
                  }
                }}
                disabled={!!h.usuario}
              >
                <Text style={[styles.input, { color: h.usuario ? colors.textDark : '#919191' }]}>
                  {h.usuario || 'Definir nome de usuário...'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ProfileInfoCard
          phone={h.phone}
          phoneStatus={h.phoneStatus}
          setPhoneInput={h.setPhoneInput}
          setShowPhoneModal={h.setShowPhoneModal}
          email={h.email}
          emailStatus={h.emailStatus}
          setEmailInput={h.setEmailInput}
          setEmailError={h.setEmailError}
          setShowEmailModal={h.setShowEmailModal}
          isDarkMode={h.isDarkMode}
          colors={colors}
        />

        <AdminAddressCard
          isDarkMode={h.isDarkMode}
          locationConfirmed={h.locationConfirmed}
          handleSendAddress={h.handleSendAddress}
          showAddressValidationErrors={h.showAddressValidationErrors}
          firstEmptyField={h.firstEmptyField}
          rua={h.rua}
          ruaRef={h.ruaRef}
          setRua={h.setRua}
          addressErrorOpacity={h.addressErrorOpacity}
          addressSuggestions={h.addressSuggestions}
          handleSelectAddress={h.handleSelectAddress}
          bairro={h.bairro}
          bairroRef={h.bairroRef}
          setBairro={h.setBairro}
          cep={h.cep}
          cepRef={h.cepRef}
          setCep={h.setCep}
          numero={h.numero}
          numeroRef={h.numeroRef}
          setNumero={h.setNumero}
        />
      </ScrollView>

      <ProfileModal
        showUsernameModal={h.showUsernameModal}
        setShowUsernameModal={h.setShowUsernameModal}
        usernameInput={h.usernameInput}
        setUsernameInput={h.setUsernameInput}
        usernameStatus={h.usernameStatus}
        usernameSuggestions={h.usernameSuggestions}
        handleSaveUsername={h.handleSaveUsername}
        showPhoneModal={h.showPhoneModal}
        setShowPhoneModal={h.setShowPhoneModal}
        phoneInput={h.phoneInput}
        setPhoneInput={h.setPhoneInput}
        phoneStatus={h.phoneStatus}
        handleConfirmPhone={h.handleConfirmPhone}
        showEmailModal={h.showEmailModal}
        setShowEmailModal={h.setShowEmailModal}
        emailInput={h.emailInput}
        setEmailInput={h.setEmailInput}
        emailStatus={h.emailStatus}
        emailError={h.emailError}
        emailCode={h.emailCode}
        setEmailCode={h.setEmailCode}
        handleConfirmEmail={h.handleConfirmEmail}
        showImagePickerOptions={h.showImagePickerOptions}
        setShowImagePickerOptions={h.setShowImagePickerOptions}
        photoUri={h.photoUri}
        setPhotoUri={h.setPhotoUri}
        openCamera={h.openCamera}
        openGallery={h.openGallery}
        showViewPhotoModal={h.showViewPhotoModal}
        setShowViewPhotoModal={h.setShowViewPhotoModal}
        user={h.user}
        isDarkMode={h.isDarkMode}
        colors={colors}
      />
    </View>
  );
}
