import { useState, useContext, useEffect, useRef, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Animated, AppState } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { AuthContext } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAdminSettingsEmail } from './useAdminSettingsEmail';
import { useAdminSettingsPassword } from './useAdminSettingsPassword';
import { useAdminSettingsRadius } from './useAdminSettingsRadius';
import { useAdminSettingsPermissions } from './useAdminSettingsPermissions';
import { useAdminSettingsAnimations } from './useAdminSettingsAnimations';

export function useAdminSettings() {
  const { user } = useContext(AuthContext);
  const userEmail = user?.new_email || user?.email || 'admin@agropet.com';
  const { colors, isDarkMode, toggleTheme } = useTheme();

  const [showGreeting, setShowGreeting] = useState(true);

  // Hoist notifIconRotate here to break the circular dependency
  // between permissions (needs it) and animations (creates it)
  const notifIconRotate = useRef(new Animated.Value(0)).current;

  // Sub-hooks with no cross-dependencies (or only parent-provided deps)
  const email = useAdminSettingsEmail();
  const password = useAdminSettingsPassword(userEmail);
  const permissions = useAdminSettingsPermissions(notifIconRotate);
  const radius = useAdminSettingsRadius(permissions.checkAllPermissions);

  // Animations needs values from permissions and radius
  const animations = useAdminSettingsAnimations(
    isDarkMode, showGreeting, setShowGreeting,
    permissions.notificationsEnabled, radius.deliveryDisabled,
    permissions.checkAllPermissions, permissions.setShowPermissionsModal,
    toggleTheme, notifIconRotate
  );

  // Sync email status with Supabase user
  useEffect(() => {
    if (user?.new_email) {
      email.setEmailStatus('validar');
      email.setEmailInput(user.new_email);
    } else {
      email.setEmailStatus('alterar');
    }
  }, [user]);

  // Initial data loading
  useEffect(() => {
    const checkInitialNotifications = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      permissions.setNotificationsEnabled(status === 'granted');
    };
    checkInitialNotifications();
    permissions.checkAllPermissions();
    radius.fetchRadius();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const loadGreetingSetting = async () => {
        try {
          const val = await SecureStore.getItemAsync('show_greeting_bar');
          if (val === 'false') {
            setShowGreeting(false);
            animations.greetingSwitchAnim.setValue(0);
          } else {
            setShowGreeting(true);
            animations.greetingSwitchAnim.setValue(1);
          }
        } catch (e) {
          console.log('Erro ao ler preferência de saudação:', e);
        }
      };
      loadGreetingSetting();
    }, [animations.greetingSwitchAnim])
  );

  // AppState listener for permissions refresh
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        permissions.checkAllPermissions();
      }
    });
    return () => {
      subscription.remove();
    };
  }, []);

  return {
    user,
    userEmail,
    colors,
    isDarkMode,
    toggleTheme,
    radius: radius.radius,
    setRadius: radius.setRadius,
    isEditingRadius: radius.isEditingRadius,
    setIsEditingRadius: radius.setIsEditingRadius,
    refreshing: radius.refreshing,
    deliveryDisabled: radius.deliveryDisabled,
    setDeliveryDisabled: radius.setDeliveryDisabled,
    showEmailModal: email.showEmailModal,
    setShowEmailModal: email.setShowEmailModal,
    emailInput: email.emailInput,
    setEmailInput: email.setEmailInput,
    emailStatus: email.emailStatus,
    setEmailStatus: email.setEmailStatus,
    emailError: email.emailError,
    setEmailError: email.setEmailError,
    emailCode: email.emailCode,
    setEmailCode: email.setEmailCode,
    showPasswordModal: password.showPasswordModal,
    setShowPasswordModal: password.setShowPasswordModal,
    currentPassword: password.currentPassword,
    setCurrentPassword: password.setCurrentPassword,
    newPassword: password.newPassword,
    setNewPassword: password.setNewPassword,
    confirmNewPassword: password.confirmNewPassword,
    setConfirmNewPassword: password.setConfirmNewPassword,
    showCurrentPassword: password.showCurrentPassword,
    setShowCurrentPassword: password.setShowCurrentPassword,
    showNewPassword: password.showNewPassword,
    setShowNewPassword: password.setShowNewPassword,
    showConfirmNewPassword: password.showConfirmNewPassword,
    setShowConfirmNewPassword: password.setShowConfirmNewPassword,
    passwordError: password.passwordError,
    setPasswordError: password.setPasswordError,
    showNestedModal: password.showNestedModal,
    setShowNestedModal: password.setShowNestedModal,
    passwordCode: password.passwordCode,
    setPasswordCode: password.setPasswordCode,
    expectedPasswordCode: password.expectedPasswordCode,
    setExpectedPasswordCode: password.setExpectedPasswordCode,
    notificationsEnabled: permissions.notificationsEnabled,
    setNotificationsEnabled: permissions.setNotificationsEnabled,
    showGreeting,
    setShowGreeting,
    cameraPermission: permissions.cameraPermission,
    galleryPermission: permissions.galleryPermission,
    locationPermission: permissions.locationPermission,
    notificationsPermission: permissions.notificationsPermission,
    setCameraPermission: permissions.setCameraPermission,
    setGalleryPermission: permissions.setGalleryPermission,
    setLocationPermission: permissions.setLocationPermission,
    setNotificationsPermission: permissions.setNotificationsPermission,
    showPermissionsModal: permissions.showPermissionsModal,
    setShowPermissionsModal: permissions.setShowPermissionsModal,
    themeSwitchAnim: animations.themeSwitchAnim,
    notifSwitchAnim: animations.notifSwitchAnim,
    deliverySwitchAnim: animations.deliverySwitchAnim,
    greetingSwitchAnim: animations.greetingSwitchAnim,
    themeIconRotate: animations.themeIconRotate,
    themeIconScale: animations.themeIconScale,
    notifIconRotate: animations.notifIconRotate,
    permIconScale: animations.permIconScale,
    greetingIconRotate: animations.greetingIconRotate,
    greetingIconScale: animations.greetingIconScale,
    themeRotateInterpolate: animations.themeRotateInterpolate,
    notifRotateInterpolate: animations.notifRotateInterpolate,
    greetingRotateInterpolate: animations.greetingRotateInterpolate,
    handleRefresh: radius.handleRefresh,
    handleSaveRadius: radius.handleSaveRadius,
    handleToggleDelivery: radius.handleToggleDelivery,
    handleToggleTheme: animations.handleToggleTheme,
    handleToggleGreeting: animations.handleToggleGreeting,
    handleConfirmEmail: email.handleConfirmEmail,
    handleSendOtpCode: password.handleSendOtpCode,
    handleConfirmFinal: password.handleConfirmFinal,
    handleToggleNotifications: permissions.handleToggleNotifications,
    handleOpenPermissions: animations.handleOpenPermissions,
    handlePressPermission: permissions.handlePressPermission,
    showErrorWithTimeout: password.showErrorWithTimeout,
    isPasswordMatch: password.isPasswordMatch,
    getFeatureReqDescription: permissions.getFeatureReqDescription,
    fetchRadius: radius.fetchRadius,
    checkAllPermissions: permissions.checkAllPermissions,
    requestCamera: permissions.requestCamera,
    requestGallery: permissions.requestGallery,
    requestLocation: permissions.requestLocation,
    requestNotifications: permissions.requestNotifications,
    registerForPushNotificationsAsync: permissions.registerForPushNotificationsAsync,
    sendLocalTestNotification: permissions.sendLocalTestNotification,
  };
}
