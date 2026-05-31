import React, { useRef, useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useUserMenu } from '../../../contexts/UserMenuContext';
import { AuthContext } from '../../../contexts/AuthContext';
import { supabase } from '../../../../data/datasources/supabase/client';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAdminProfilePhoto } from './useAdminProfilePhoto';
import { useAdminProfileForm } from './useAdminProfileForm';
import { useAdminProfileBusiness } from './useAdminProfileBusiness';

export function useAdminProfile() {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<any>();
  const { toggleMenu } = useUserMenu();
  const { user } = React.useContext(AuthContext);
  const profileLoadedRef = useRef(false);

  const photo = useAdminProfilePhoto(user);
  const form = useAdminProfileForm(user, profileLoadedRef);
  const business = useAdminProfileBusiness(user, profileLoadedRef);

  React.useEffect(() => {
    supabase.auth.refreshSession().catch(() => { });
  }, []);

  const fetchProfile = useCallback(async () => {
    /* istanbul ignore next */
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('name, username, email, phone, rua, bairro, cep, numero, lat, lng, location_confirmed')
        .eq('id', user.id)
        .single();

      /* istanbul ignore next */
      if (data) {
        form.setNome(data.name || '');
        form.setUsuario(data.username || '');
        /* istanbul ignore next */
        form.setEmail(data.email || user.email || '');
        form.setPhone(data.phone || '');
        if (data.phone) form.setPhoneStatus('alterar');

        profileLoadedRef.current = false;

        business.setRua(data.rua || '');
        business.setBairro(data.bairro || '');
        business.setCep(data.cep || '');
        business.setNumero(data.numero || '');
        if (data.lat && data.lng) {
          business.setLat(data.lat);
          business.setLng(data.lng);
        } else {
          business.setLat(null);
          business.setLng(null);
        }
        business.setLocationConfirmed(data.location_confirmed || false);

        const hasAny = data.rua || data.bairro || data.cep || data.numero;
        const hasEmpty = !data.rua || !data.bairro || !data.cep || !data.numero;
        business.setShowAddressValidationErrors(hasAny && hasEmpty);

        /* istanbul ignore next */
        setTimeout(() => {
          profileLoadedRef.current = true;
        }, 150);
      }
    } catch (err) {
      console.log('Erro ao carregar perfil', err);
    }
  }, [user]);

  React.useEffect(() => {
    fetchProfile();
  }, [user?.id]);

  return {
    colors, isDarkMode, navigation, toggleMenu, user,
    nome: form.nome, setNome: form.setNome,
    usuario: form.usuario, setUsuario: form.setUsuario,
    phone: form.phone, setPhone: form.setPhone,
    email: form.email, setEmail: form.setEmail,
    showUsernameModal: form.showUsernameModal, setShowUsernameModal: form.setShowUsernameModal,
    usernameInput: form.usernameInput, setUsernameInput: form.setUsernameInput,
    usernameStatus: form.usernameStatus, setUsernameStatus: form.setUsernameStatus,
    usernameSuggestions: form.usernameSuggestions, setUsernameSuggestions: form.setUsernameSuggestions,
    showPhoneModal: form.showPhoneModal, setShowPhoneModal: form.setShowPhoneModal,
    phoneInput: form.phoneInput, setPhoneInput: form.setPhoneInput,
    phoneStatus: form.phoneStatus, setPhoneStatus: form.setPhoneStatus,
    showEmailModal: form.showEmailModal, setShowEmailModal: form.setShowEmailModal,
    emailInput: form.emailInput, setEmailInput: form.setEmailInput,
    emailStatus: form.emailStatus, setEmailStatus: form.setEmailStatus,
    emailError: form.emailError, setEmailError: form.setEmailError,
    emailCode: form.emailCode, setEmailCode: form.setEmailCode,
    photoUri: photo.photoUri, setPhotoUri: photo.setPhotoUri,
    showImagePickerOptions: photo.showImagePickerOptions, setShowImagePickerOptions: photo.setShowImagePickerOptions,
    showViewPhotoModal: photo.showViewPhotoModal, setShowViewPhotoModal: photo.setShowViewPhotoModal,
    rua: business.rua, setRua: business.setRua,
    bairro: business.bairro, setBairro: business.setBairro,
    cep: business.cep, setCep: business.setCep,
    numero: business.numero, setNumero: business.setNumero,
    lat: business.lat, setLat: business.setLat,
    lng: business.lng, setLng: business.setLng,
    addressSuggestions: business.addressSuggestions, setAddressSuggestions: business.setAddressSuggestions,
    isSearchingAddress: business.isSearchingAddress,
    locationConfirmed: business.locationConfirmed, setLocationConfirmed: business.setLocationConfirmed,
    showAddressValidationErrors: business.showAddressValidationErrors,
    firstEmptyField: business.firstEmptyField,
    addressErrorOpacity: business.addressErrorOpacity,
    ruaRef: business.ruaRef, bairroRef: business.bairroRef, cepRef: business.cepRef, numeroRef: business.numeroRef,
    triggerAddressError: business.triggerAddressError,
    fetchAddressSuggestions: business.fetchAddressSuggestions,
    handleSelectAddress: business.handleSelectAddress,
    handleSendAddress: business.handleSendAddress,
    handleSelectPhoto: photo.handleSelectPhoto,
    openCamera: photo.openCamera,
    openGallery: photo.openGallery,
    handleSaveUsername: form.handleSaveUsername,
    handleConfirmPhone: form.handleConfirmPhone,
    handleConfirmEmail: form.handleConfirmEmail,
  };
}
