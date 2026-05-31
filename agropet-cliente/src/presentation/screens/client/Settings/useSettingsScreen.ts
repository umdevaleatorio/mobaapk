import { useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../../contexts/AuthContext';
import { useUserMenu } from '../../../contexts/UserMenuContext';
import { supabase } from '../../../../data/datasources/supabase/client';
import { useSettingsEmail } from './useSettingsEmail';
import { useSettingsPassword } from './useSettingsPassword';
import { useSettingsPermissions } from './useSettingsPermissions';
import { useSettingsTheme } from './useSettingsTheme';

export function useSettingsScreen() {
  const { toggleMenu } = useUserMenu();
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);

  const [searchText, setSearchText] = useState('');
  const [phone, setPhone] = useState('');
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneStatus, setPhoneStatus] = useState<'cadastrar' | 'validar' | 'alterar'>('cadastrar');

  const userEmail = user?.new_email || user?.email || 'meuemail@gmail.com';

  const emailHook = useSettingsEmail();
  const passwordHook = useSettingsPassword(userEmail);
  const permissionsHook = useSettingsPermissions();
  const themeHook = useSettingsTheme();

  useEffect(() => {
    if (!user) return;
    const fetchPhone = async () => {
      const { data } = await supabase.from('users').select('phone').eq('id', user.id).single();
      if (data && data.phone) {
        setPhone(data.phone);
        setPhoneStatus('alterar');
      } else {
        setPhoneStatus('cadastrar');
      }
    };
    fetchPhone();
  }, [user]);

  const handleConfirmPhone = async () => {
    if (phoneStatus === 'cadastrar' || phoneStatus === 'alterar') {
      setPhoneStatus('validar');
    } else if (phoneStatus === 'validar') {
      if (user) {
        await supabase.from('users').update({ phone: phoneInput }).eq('id', user.id);
        setPhone(phoneInput);
        setPhoneStatus('alterar');
        setShowPhoneModal(false);
        Alert.alert('Sucesso', 'Telefone cadastrado com sucesso!');
      }
    }
  };

  return {
    navigation,
    user,
    colors: themeHook.colors,
    isDarkMode: themeHook.isDarkMode,
    toggleTheme: themeHook.toggleTheme,

    searchText,
    setSearchText,

    phone,
    phoneStatus,
    showPhoneModal,
    setShowPhoneModal,
    phoneInput,
    setPhoneInput,
    handleConfirmPhone,

    showEmailModal: emailHook.showEmailModal,
    setShowEmailModal: emailHook.setShowEmailModal,
    emailInput: emailHook.emailInput,
    setEmailInput: emailHook.setEmailInput,
    emailStatus: emailHook.emailStatus,
    emailError: emailHook.emailError,
    emailCode: emailHook.emailCode,
    setEmailCode: emailHook.setEmailCode,
    handleConfirmEmail: emailHook.handleConfirmEmail,

    showPasswordModal: passwordHook.showPasswordModal,
    setShowPasswordModal: passwordHook.setShowPasswordModal,
    currentPassword: passwordHook.currentPassword,
    setCurrentPassword: passwordHook.setCurrentPassword,
    newPassword: passwordHook.newPassword,
    setNewPassword: passwordHook.setNewPassword,
    confirmNewPassword: passwordHook.confirmNewPassword,
    setConfirmNewPassword: passwordHook.setConfirmNewPassword,
    passwordCode: passwordHook.passwordCode,
    setPasswordCode: passwordHook.setPasswordCode,
    showCurrentPassword: passwordHook.showCurrentPassword,
    setShowCurrentPassword: passwordHook.setShowCurrentPassword,
    showNewPassword: passwordHook.showNewPassword,
    setShowNewPassword: passwordHook.setShowNewPassword,
    showConfirmNewPassword: passwordHook.showConfirmNewPassword,
    setShowConfirmNewPassword: passwordHook.setShowConfirmNewPassword,
    passwordError: passwordHook.passwordError,
    showNestedModal: passwordHook.showNestedModal,
    setShowNestedModal: passwordHook.setShowNestedModal,
    handleSendOtpCode: passwordHook.handleSendOtpCode,
    handleConfirmFinal: passwordHook.handleConfirmFinal,
    isPasswordMatch: passwordHook.isPasswordMatch,

    showGreeting: themeHook.showGreeting,
    handleToggleGreeting: themeHook.handleToggleGreeting,

    notificationsEnabled: permissionsHook.notificationsEnabled,
    handleToggleNotifications: permissionsHook.handleToggleNotifications,

    cameraPermission: permissionsHook.cameraPermission,
    galleryPermission: permissionsHook.galleryPermission,
    locationPermission: permissionsHook.locationPermission,
    notificationsPermission: permissionsHook.notificationsPermission,
    showPermissionsModal: permissionsHook.showPermissionsModal,
    setShowPermissionsModal: permissionsHook.setShowPermissionsModal,
    handleOpenPermissions: permissionsHook.handleOpenPermissions,
    handlePressPermission: permissionsHook.handlePressPermission,

    themeSwitchAnim: themeHook.themeSwitchAnim,
    notifSwitchAnim: permissionsHook.notifSwitchAnim,
    greetingSwitchAnim: themeHook.greetingSwitchAnim,
    themeIconRotate: themeHook.themeIconRotate,
    themeIconScale: themeHook.themeIconScale,
    notifIconRotate: permissionsHook.notifIconRotate,
    permIconScale: permissionsHook.permIconScale,
    greetingIconRotate: themeHook.greetingIconRotate,
    greetingIconScale: themeHook.greetingIconScale,
    themeRotateInterpolate: themeHook.themeRotateInterpolate,
    notifRotateInterpolate: permissionsHook.notifRotateInterpolate,
    greetingRotateInterpolate: themeHook.greetingRotateInterpolate,
    handleToggleTheme: themeHook.handleToggleTheme,

    userEmail,
  };
}
