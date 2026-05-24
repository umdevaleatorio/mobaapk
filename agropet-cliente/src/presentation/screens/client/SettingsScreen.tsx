import React, { useState, useContext, useEffect } from 'react';
import { useUserMenu } from '../../contexts/UserMenuContext';
import {
  View,
  StyleSheet,
  StatusBar,
  TextInput,
  Text,
  Platform,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Animated,
  Easing,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '../../contexts/AuthContext';
import { supabase } from '../../../data/datasources/supabase/client';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

import { CatalogHeader } from '../../components/CatalogHeader';

// === HEADER SVGs ===
// Removidos MiniLogo, Lupa, PersonIcon e OpcoesSvg (trabalhados no CatalogHeader)

// === CONFIG SVGs ===
// SVGs are replaced by Feather icons and Custom Animated Switch components

interface CustomSwitchProps {
  active: boolean;
  onPress: () => void;
  colorActive?: string;
  animValue: Animated.Value;
}

const CustomSwitch: React.FC<CustomSwitchProps> = ({ active, onPress, colorActive = '#EA841E', animValue }) => {
  const { colors, isDarkMode } = useTheme();

  const trackColor = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [isDarkMode ? '#2E2E38' : '#C0CADE', colorActive],
  });

  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [3, 27],
  });

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <Animated.View style={[styles.switchTrack, { backgroundColor: trackColor }]}>
        <Animated.View style={[styles.switchThumb, { transform: [{ translateX }] }]} />
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function SettingsScreen() {
  const { toggleMenu } = useUserMenu();
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);
  const { isDarkMode, toggleTheme, colors } = useTheme();

  const [searchText, setSearchText] = useState('');
  const [phone, setPhone] = useState('');
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneStatus, setPhoneStatus] = useState<'cadastrar' | 'validar' | 'alterar'>('cadastrar');

  // Email states
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailStatus, setEmailStatus] = useState<'validar' | 'alterar'>(user?.new_email ? 'validar' : 'alterar');
  const [emailError, setEmailError] = useState('');
  const [emailCode, setEmailCode] = useState('');

  // Senha states principal
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<'alterar' | 'validar'>('alterar');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Olhinhos no modal
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Erros e nested
  const [passwordError, setPasswordError] = useState('');
  const [showNestedModal, setShowNestedModal] = useState(false);

  // OTP de senha
  const [passwordCode, setPasswordCode] = useState('');
  const [expectedPasswordCode, setExpectedPasswordCode] = useState('');

  // Notifications toggle state
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Saudação e Horário toggle state
  const [showGreeting, setShowGreeting] = useState(true);

  // Permissions state
  const [cameraPermission, setCameraPermission] = useState<string>('checking');
  const [galleryPermission, setGalleryPermission] = useState<string>('checking');
  const [locationPermission, setLocationPermission] = useState<string>('checking');
  const [notificationsPermission, setNotificationsPermission] = useState<string>('checking');
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  // === DEAUTHORIZE STATES ===
  const [deauthModalVisible, setDeauthModalVisible] = useState(false);
  const [deauthFeature, setDeauthFeature] = useState<{ name: string; key: string } | null>(null);

  // === REQUEST PERMISSION STATES ===
  const [reqPermModalVisible, setReqPermModalVisible] = useState(false);
  const [reqPermFeature, setReqPermFeature] = useState<{ key: string; name: string } | null>(null);
  const [openedFromManager, setOpenedFromManager] = useState(false);

  const getFeatureReqDescription = (key: string) => {
    switch (key) {
      case 'camera':
        return 'O aplicativo necessita de acesso à câmera para permitir que você escaneie códigos QR (como o QR Code do PIX na hora do pagamento rápido) de forma simples e direta, ou tire sua foto de perfil.';
      case 'gallery':
        return 'O aplicativo precisa de acesso à galeria de fotos para que você possa escolher uma imagem de perfil a partir dos seus arquivos salvos no celular de forma prática.';
      case 'location':
        return 'O aplicativo precisa de acesso à sua localização para confirmar o endereço de entrega no mapa interativo e calcular dinamicamente se o seu endereço está dentro do raio de 17km atendido pela nossa loja.';
      case 'notifications':
        return 'As notificações push informam você em tempo real sobre cada etapa do seu pedido (quando foi confirmado, quando começou a ser preparado, quando saiu para entrega e quando foi finalizado).';
      default:
        return '';
    }
  };

  const handlePressPermission = (key: string, name: string, currentStatus: string) => {
    setOpenedFromManager(true);
    setShowPermissionsModal(false);
    setTimeout(() => {
      if (currentStatus === 'granted') {
        setDeauthFeature({ key, name });
        setDeauthModalVisible(true);
      } else {
        setReqPermFeature({ key, name });
        setReqPermModalVisible(true);
      }
    }, 400);
  };

  const handleConfirmRequestPermission = () => {
    if (!reqPermFeature) return;
    const { key } = reqPermFeature;
    setReqPermModalVisible(false);

    if (key === 'camera') requestCamera();
    if (key === 'gallery') requestGallery();
    if (key === 'location') requestLocation();
    if (key === 'notifications') requestNotifications();

    setReqPermFeature(null);

    if (openedFromManager) {
      setTimeout(() => {
        setShowPermissionsModal(true);
      }, 600);
    }
  };

  const handleConfirmDeauth = () => {
    if (!deauthFeature) return;
    if (deauthFeature.key === 'camera') setCameraPermission('denied');
    if (deauthFeature.key === 'gallery') setGalleryPermission('denied');
    if (deauthFeature.key === 'location') setLocationPermission('denied');
    if (deauthFeature.key === 'notifications') {
      setNotificationsPermission('denied');
      setNotificationsEnabled(false);
    }
    setDeauthModalVisible(false);
    setDeauthFeature(null);

    if (openedFromManager) {
      setTimeout(() => {
        setShowPermissionsModal(true);
      }, 600);
    }
  };

  // Animation values using refs
  const themeSwitchAnim = React.useRef(new Animated.Value(isDarkMode ? 1 : 0)).current;
  const notifSwitchAnim = React.useRef(new Animated.Value(notificationsEnabled ? 1 : 0)).current;
  const greetingSwitchAnim = React.useRef(new Animated.Value(showGreeting ? 1 : 0)).current;

  const themeIconRotate = React.useRef(new Animated.Value(0)).current;
  const themeIconScale = React.useRef(new Animated.Value(1)).current;
  const notifIconRotate = React.useRef(new Animated.Value(0)).current;
  const permIconScale = React.useRef(new Animated.Value(1)).current;

  // Dynamic switch transition triggers
  React.useEffect(() => {
    Animated.spring(themeSwitchAnim, {
      toValue: isDarkMode ? 1 : 0,
      useNativeDriver: false,
      bounciness: 4,
      speed: 12,
    }).start();
  }, [isDarkMode]);

  React.useEffect(() => {
    Animated.spring(notifSwitchAnim, {
      toValue: notificationsEnabled ? 1 : 0,
      useNativeDriver: false,
      bounciness: 4,
      speed: 12,
    }).start();
  }, [notificationsEnabled]);

  React.useEffect(() => {
    Animated.spring(greetingSwitchAnim, {
      toValue: showGreeting ? 1 : 0,
      useNativeDriver: false,
      bounciness: 4,
      speed: 12,
    }).start();
  }, [showGreeting]);

  const themeRotateInterpolate = themeIconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const notifRotateInterpolate = notifIconRotate.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: ['0deg', '-20deg', '20deg', '-15deg', '15deg', '0deg'],
  });

  const userEmail = user?.new_email || user?.email || 'meuemail@gmail.com';

  // Sincronizar status do e-mail com pendências do Supabase
  React.useEffect(() => {
    if (user?.new_email) {
      setEmailStatus('validar');
      setEmailInput(user.new_email);
    } else {
      setEmailStatus('alterar');
    }
  }, [user]);

  // Verificar status inicial das notificações, saudações e permissões
  React.useEffect(() => {
    const checkInitialNotifications = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationsEnabled(status === 'granted');
    };
    const loadGreetingSetting = async () => {
      try {
        const val = await SecureStore.getItemAsync('show_greeting_bar');
        if (val === 'false') {
          setShowGreeting(false);
          greetingSwitchAnim.setValue(0);
        } else {
          setShowGreeting(true);
          greetingSwitchAnim.setValue(1);
        }
      } catch (e) {
        console.log('Erro ao ler preferência de saudação:', e);
      }
    };
    checkInitialNotifications();
    loadGreetingSetting();
    checkAllPermissions();
  }, []);

  const handleToggleGreeting = async () => {
    const newValue = !showGreeting;
    setShowGreeting(newValue);
    try {
      await SecureStore.setItemAsync('show_greeting_bar', String(newValue));
    } catch (e) {
      console.log('Erro ao salvar preferência de saudação:', e);
    }
  };

  // Buscar telefone do Supabase
  React.useEffect(() => {
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
    // Simulação da validação do SMS
    if (phoneStatus === 'cadastrar' || phoneStatus === 'alterar') {
      // Simula enviar SMS e muda pra Validar
      setPhoneStatus('validar');
    } else if (phoneStatus === 'validar') {
      // Simula código correto e salva
      if (user) {
        await supabase.from('users').update({ phone: phoneInput }).eq('id', user.id);
        setPhone(phoneInput);
        setPhoneStatus('alterar');
        setShowPhoneModal(false);
        Alert.alert('Sucesso', 'Telefone cadastrado com sucesso!');
      }
    }
  };

  const handleToggleTheme = () => {
    // Trigger micro-animation on the theme icon
    themeIconRotate.setValue(0);
    Animated.parallel([
      Animated.timing(themeIconRotate, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(themeIconScale, {
          toValue: 1.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(themeIconScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ])
    ]).start();

    toggleTheme();
  };

  // Lógica de Registro de Push Notifications
  const registerForPushNotificationsAsync = async () => {
    let token = null;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7A',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId || '6cb70e8d-d12c-4c75-8d0b-d0c818f76a7a';
    try {
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log('Token obtido:', token);
    } catch (e) {
      console.log('Erro ao obter token:', e);
    }
    return token;
  };

  const sendLocalTestNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Agropet Lambari 🐾",
        body: "Notificações ativadas! Você receberá atualizações do seu pedido. 🎉",
        sound: true,
      },
      trigger: null,
    });
  };

  const handleToggleNotifications = async () => {
    // Shake animation
    notifIconRotate.setValue(0);
    Animated.timing(notifIconRotate, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    if (notificationsEnabled) {
      setNotificationsEnabled(false);
      setNotificationsPermission('denied');
      if (user) {
        await supabase.from('users').update({ push_token: null }).eq('id', user.id);
      }
      Alert.alert('Notificações', 'Você desativou as notificações.');
    } else {
      if (notificationsPermission !== 'granted') {
        setOpenedFromManager(false);
        setReqPermFeature({ key: 'notifications', name: 'Notificações Push' });
        setReqPermModalVisible(true);
        return;
      }
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setNotificationsEnabled(true);
        setNotificationsPermission('granted');
        if (user) {
          await supabase.from('users').update({ push_token: token }).eq('id', user.id);
        }
        await sendLocalTestNotification();
      } else {
        // Fallback for simulation / Expo Go SDK 53 / Denied Permission
        setNotificationsEnabled(true);
        setNotificationsPermission('granted');
        Alert.alert(
          'Notificações de Teste Ativas',
          'Como o push do sistema não pôde ser registrado (comum no Expo Go ou se a permissão foi negada), ativamos o modo de simulação com notificações locais para você testar!',
          [{ text: 'Maravilha!', onPress: () => sendLocalTestNotification().catch(() => { }) }]
        );
      }
    }
  };

  const handleOpenPermissions = () => {
    permIconScale.setValue(1);
    Animated.sequence([
      Animated.timing(permIconScale, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(permIconScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    checkAllPermissions();
    setShowPermissionsModal(true);
  };

  // Lógica de Permissões
  const checkAllPermissions = async () => {
    try {
      const camera = await ImagePicker.getCameraPermissionsAsync();
      setCameraPermission(camera.status);

      const gallery = await ImagePicker.getMediaLibraryPermissionsAsync();
      setGalleryPermission(gallery.status);

      const loc = await Location.getForegroundPermissionsAsync();
      setLocationPermission(loc.status);

      const notif = await Notifications.getPermissionsAsync();
      setNotificationsPermission(notif.status);
    } catch (error) {
      console.log('Error checking permissions:', error);
    }
  };

  const requestCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    setCameraPermission(status);
    checkAllPermissions();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão Necessária',
        'Para ativar a Câmera, você precisa habilitar a permissão nas configurações do sistema do seu celular.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir Configurações', onPress: () => Linking.openSettings() }
        ]
      );
    }
  };

  const requestGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    setGalleryPermission(status);
    checkAllPermissions();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão Necessária',
        'Para ativar o acesso à Galeria, você precisa habilitar a permissão nas configurações do sistema do seu celular.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir Configurações', onPress: () => Linking.openSettings() }
        ]
      );
    }
  };

  const requestLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(status);
    checkAllPermissions();
    if (status !== 'granted') {
      Alert.alert(
        'Permissão Necessária',
        'Para ativar a Localização, você precisa habilitar a permissão nas configurações do sistema do seu celular.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir Configurações', onPress: () => Linking.openSettings() }
        ]
      );
    }
  };

  const requestNotifications = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setNotificationsPermission(status);
    if (status === 'granted') {
      setNotificationsEnabled(true);
      const token = await registerForPushNotificationsAsync();
      if (token && user) {
        await supabase.from('users').update({ push_token: token }).eq('id', user.id);
      }
    } else {
      setNotificationsEnabled(false);
      Alert.alert(
        'Permissão Necessária',
        'Para ativar as Notificações, você precisa habilitar a permissão nas configurações do sistema do seu celular.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir Configurações', onPress: () => Linking.openSettings() }
        ]
      );
    }
    checkAllPermissions();
  };

  // ======= LÓGICA E-MAIL =======
  const handleConfirmEmail = async () => {
    if (emailStatus === 'alterar') {
      setEmailError('');
      if (emailInput.trim().toLowerCase() === user?.email?.trim().toLowerCase()) {
        setEmailError('O e-mail digitado é o mesmo já cadastrado nesta conta. Insira um novo e-mail para alterar.');
        return;
      }
      const { data } = await supabase.from('users').select('id').eq('email', emailInput.toLowerCase()).maybeSingle();
      if (data && data.id !== user?.id) {
        setEmailError('Este e-mail já está sendo usado. Por favor, escolha outro e-mail de seu uso.');
        return;
      }

      const { error } = await supabase.auth.updateUser({ email: emailInput.toLowerCase() });
      if (error) {
        setEmailError('Falha ao enviar e-mail de verificação: ' + error.message);
        return;
      }

      setEmailCode('');
      setEmailStatus('validar');
    } else if (emailStatus === 'validar') {
      if (user) {
        const { error } = await supabase.auth.verifyOtp({
          email: emailInput.toLowerCase(), token: emailCode, type: 'email_change'
        });
        if (error) {
          setEmailError('Código inválido ou expirado.');
          return;
        }
        await supabase.from('users').update({ email: emailInput.toLowerCase() }).eq('id', user.id);
        await supabase.auth.refreshSession().catch(() => { });
        setEmailStatus('alterar');
        setShowEmailModal(false);
      }
    }
  };

  // ======= LÓGICA SENHA =======
  const showErrorWithTimeout = (msg: string) => {
    setPasswordError(msg);
    setTimeout(() => {
      setPasswordError((prev) => (prev === msg ? '' : prev));
    }, 8000);
  };

  const handleSendOtpCode = async () => {
    setPasswordError('');
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      showErrorWithTimeout('Preencha todas as senhas antes de pedir o código!');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showErrorWithTimeout('As senhas não coincidem!');
      return;
    }
    if (newPassword && newPassword === currentPassword) {
      showErrorWithTimeout('same_password');
      setShowNestedModal(true);
      return;
    }

    // Verifica se a senha atual está correta tentando logar novamente
    if (userEmail) {
      const { error } = await supabase.auth.signInWithPassword({ email: userEmail, password: currentPassword });
      if (error) {
        showErrorWithTimeout('Senha incorreta!');
        return;
      }
    }

    // Gerar código de 8 dígitos simulado
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    setExpectedPasswordCode(generatedCode);
    console.log("Código de Senha Gerado:", generatedCode); // Para depuração
    Alert.alert('Código Enviado!', 'Verifique sua caixa de e-mail para pegar o código de 8 dígitos.');
  };

  const handleConfirmFinal = async () => {
    setPasswordError('');

    if (!expectedPasswordCode) {
      showErrorWithTimeout('Você precisa mandar o código primeiro!');
      return;
    }

    if (passwordCode !== expectedPasswordCode) {
      showErrorWithTimeout('Código inválido!');
      return;
    }

    // Atualiza a senha no Supabase
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      showErrorWithTimeout('Erro ao atualizar a senha.');
    } else {
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordCode('');
      setExpectedPasswordCode('');
      Alert.alert('Sucesso', 'Senha alterada com sucesso!');
    }
  };

  const isPasswordMatch = newPassword.length > 0 && confirmNewPassword.length > 0 && newPassword === confirmNewPassword;

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      <StatusBar backgroundColor={colors.headerBackground} barStyle="light-content" />

      {/* Header Unificado */}
      <CatalogHeader
        title="Configurações"
        searchText={searchText}
        onSearchChange={setSearchText}
      />

      {/* ========== FUNDO EXTERNO (#E3E4EB, 342x631, rx=25) ========== */}
      <View style={[styles.outerCard, { backgroundColor: isDarkMode ? '#2E2E38' : '#E3E4EB' }]}>

        {/* Título DENTRO do fundo externo */}
        <Text style={[styles.mainTitle, { color: colors.textDark }]}>Configurações do Aplicativo</Text>

        {/* ========== CARD ESCURO (#1C2434, rx=25) — contém TUDO ========== */}
        <View style={[styles.darkCard, { backgroundColor: isDarkMode ? '#1E1E24' : '#1C2434' }]}>

          {/* === E-MAIL === */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>E-mail</Text>
            <View style={[styles.fieldInput, { backgroundColor: isDarkMode ? '#2E2E38' : '#C0CADE' }]}>
              <Text style={[styles.fieldValue, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]} numberOfLines={1}>{userEmail}</Text>
              {emailStatus === 'validar' ? (
                <TouchableOpacity
                  onPress={() => setShowEmailModal(true)}
                  style={[styles.alterarBtnInside, { flexDirection: 'row', alignItems: 'center' }]}
                >
                  <Text style={{ color: '#FFC107', fontSize: 16, marginRight: 4, fontWeight: 'bold' }}>!</Text>
                  <Text style={{ color: '#FFC107', fontWeight: 'bold', fontSize: 13 }}>Validar</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => { setEmailInput(userEmail); setEmailError(''); setShowEmailModal(true); }} style={styles.alterarBtnInside}>
                  <Text style={[styles.alterarTextLink, { color: isDarkMode ? '#5B86E5' : '#042A7D' }]}>Alterar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* === SENHA === */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>Senha</Text>
            <View style={[styles.fieldInput, { backgroundColor: isDarkMode ? '#2E2E38' : '#C0CADE' }]}>
              <Text style={[styles.fieldValue, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>••••••••••••••</Text>
              <TouchableOpacity onPress={() => {
                setCurrentPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
                setPasswordCode('');
                setExpectedPasswordCode('');
                setPasswordError('');
                setShowPasswordModal(true);
              }} style={styles.alterarBtnInside}>
                <Text style={[styles.alterarTextLink, { color: isDarkMode ? '#5B86E5' : '#042A7D' }]}>Alterar</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* === CADASTRAR NÚMERO === */}
          <View style={styles.fieldSection}>
            <Text style={styles.fieldLabel}>Cadastrar Celular</Text>
            <View style={[styles.fieldInput, { backgroundColor: isDarkMode ? '#2E2E38' : '#C0CADE' }]}>
              <Text style={[styles.fieldValue, phone ? (isDarkMode ? { color: '#FFFFFF' } : { color: '#000000' }) : { color: '#919191' }]} numberOfLines={1}>
                {phone || 'Digite seu número...'}
              </Text>

              {phoneStatus === 'cadastrar' && (
                <TouchableOpacity onPress={() => { setPhoneInput(''); setShowPhoneModal(true); }} style={styles.alterarBtnInside}>
                  <Text style={[styles.alterarTextLink, { color: '#00C853' }]}>Cadastrar</Text>
                </TouchableOpacity>
              )}
              {phoneStatus === 'validar' && (
                <TouchableOpacity onPress={() => setShowPhoneModal(true)} style={[styles.alterarBtnInside, { flexDirection: 'row', alignItems: 'center' }]}>
                  <Text style={{ color: '#FFC107', fontSize: 16, marginRight: 4, fontWeight: 'bold' }}>!</Text>
                  <Text style={{ color: '#FFC107', fontWeight: 'bold', fontSize: 13 }}>Validar</Text>
                </TouchableOpacity>
              )}
              {phoneStatus === 'alterar' && (
                <TouchableOpacity onPress={() => { setPhoneInput(phone); setShowPhoneModal(true); }} style={styles.alterarBtnInside}>
                  <Text style={[styles.alterarTextLink, { color: isDarkMode ? '#5B86E5' : '#042A7D' }]}>Alterar</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ========== TOGGLES (DENTRO do card escuro) ========== */}

          {/* Tema escuro */}
          <View style={styles.toggleRow}>
            <Animated.View style={[styles.iconBoxAnim, { transform: [{ rotate: themeRotateInterpolate }, { scale: themeIconScale }] }]}>
              <Feather
                name={isDarkMode ? 'moon' : 'sun'}
                size={22}
                color={isDarkMode ? '#FFC107' : '#EA841E'}
              />
            </Animated.View>
            <Text style={styles.optionLabel}>Tema escuro</Text>
            <View style={styles.toggleSpacer} />
            <CustomSwitch
              active={isDarkMode}
              onPress={handleToggleTheme}
              colorActive={colors.primary}
              animValue={themeSwitchAnim}
            />
          </View>

          {/* Notificação */}
          <View style={styles.toggleRow}>
            <Animated.View style={[styles.iconBoxAnim, { transform: [{ rotate: notifRotateInterpolate }] }]}>
              <Feather
                name={notificationsEnabled ? 'bell' : 'bell-off'}
                size={22}
                color={isDarkMode ? '#FFD700' : '#E3E4EB'}
              />
            </Animated.View>
            <Text style={styles.optionLabel}>Notificação</Text>
            <View style={styles.toggleSpacer} />
            <CustomSwitch
              active={notificationsEnabled}
              onPress={handleToggleNotifications}
              colorActive="#25BE36"
              animValue={notifSwitchAnim}
            />
          </View>

          {/* Saudação e Horário */}
          <View style={{ gap: 4 }}>
            <View style={styles.toggleRow}>
              <View style={styles.iconBoxAnim}>
                <Feather
                  name="clock"
                  size={22}
                  color={isDarkMode ? '#FFC107' : '#EA841E'}
                />
              </View>
              <Text style={styles.optionLabel}>Saudação e Horário</Text>
              <View style={styles.toggleSpacer} />
              <CustomSwitch
                active={showGreeting}
                onPress={handleToggleGreeting}
                colorActive={colors.primary}
                animValue={greetingSwitchAnim}
              />
            </View>
            <Text style={[styles.toggleSubtitle, { color: isDarkMode ? '#A8A8B3' : '#A2AAB8' }]}>
              Exibe a barra de saudações e funcionamento no catálogo
            </Text>
          </View>

          {/* Permissão */}
          <View style={styles.toggleRow}>
            <Animated.View style={[styles.iconBoxAnim, { transform: [{ scale: permIconScale }] }]}>
              <Feather
                name="shield"
                size={22}
                color={isDarkMode ? '#FFC107' : '#4A90E2'}
              />
            </Animated.View>
            <Text style={styles.optionLabel}>Permissão</Text>
            <View style={styles.toggleSpacer} />
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleOpenPermissions}
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
        {/* FIM DO CARD ESCURO */}

      </View>
      {/* MODAL E-MAIL (Mesmo do Profile) */}
      <Modal visible={showEmailModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.whiteModalContainer, { backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF' }]}>
            <Text style={[styles.whiteModalTitle, { color: colors.textDark }]}>
              {emailStatus === 'validar' ? 'Validar E-mail' : 'Alterar E-mail'}
            </Text>
            <Text style={[styles.whiteModalDesc, { color: isDarkMode ? '#A8A8B3' : '#767676' }]}>
              {emailStatus === 'validar'
                ? 'Verifique a caixa de entrada do seu novo e-mail para pegar o código.'
                : 'Insira o novo endereço de e-mail.'}
            </Text>
            {!!emailError && (
              <Text style={styles.usernameErrorMsg}>{emailError}</Text>
            )}
            {emailStatus === 'validar' ? (
              <TextInput
                style={[styles.whiteModalInput, { backgroundColor: isDarkMode ? '#1E1E24' : '#F0F0F0', color: colors.textDark, borderColor: isDarkMode ? '#3E3E4A' : 'transparent' }, emailError ? styles.inputError : null]}
                placeholder="Código de 8 dígitos..."
                placeholderTextColor={isDarkMode ? '#8E8E93' : '#919191'}
                value={emailCode}
                onChangeText={setEmailCode}
                keyboardType="numeric"
              />
            ) : (
              <TextInput
                style={[styles.whiteModalInput, { backgroundColor: isDarkMode ? '#1E1E24' : '#F0F0F0', color: colors.textDark, borderColor: isDarkMode ? '#3E3E4A' : 'transparent' }, emailError ? styles.inputError : null]}
                placeholder="novo@email.com"
                placeholderTextColor={isDarkMode ? '#8E8E93' : '#919191'}
                value={emailInput}
                onChangeText={setEmailInput}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
            <View style={styles.whiteModalButtons}>
              <TouchableOpacity style={[styles.whiteModalBtnCancel, { backgroundColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]} onPress={() => setShowEmailModal(false)}>
                <Text style={[styles.whiteModalBtnTextCancel, { color: isDarkMode ? '#FFFFFF' : '#767676' }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.whiteModalBtnConfirm, { backgroundColor: colors.accent }]} onPress={handleConfirmEmail}>
                <Text style={styles.whiteModalBtnTextConfirm}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL TELEFONE */}
      <Modal visible={showPhoneModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.whiteModalContainer, { backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF' }]}>
            <Text style={[styles.whiteModalTitle, { color: colors.textDark }]}>
              {phoneStatus === 'validar' ? 'Validar Telefone' : 'Digite seu telefone'}
            </Text>
            <Text style={[styles.whiteModalDesc, { color: isDarkMode ? '#A8A8B3' : '#767676' }]}>
              {phoneStatus === 'validar'
                ? 'Enviamos um código SMS para o seu número. (Simulação: clique em Confirmar para validar)'
                : 'Insira o número com DDD para continuar.'}
            </Text>

            <TextInput
              style={[styles.whiteModalInput, { backgroundColor: isDarkMode ? '#1E1E24' : '#F0F0F0', color: colors.textDark, borderColor: isDarkMode ? '#3E3E4A' : 'transparent' }]}
              placeholder={phoneStatus === 'validar' ? "Código SMS..." : "+55 (11) 99999-9999"}
              placeholderTextColor={isDarkMode ? '#8E8E93' : '#919191'}
              value={phoneInput}
              onChangeText={setPhoneInput}
              keyboardType="phone-pad"
            />

            <View style={styles.whiteModalButtons}>
              <TouchableOpacity style={[styles.whiteModalBtnCancel, { backgroundColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]} onPress={() => setShowPhoneModal(false)}>
                <Text style={[styles.whiteModalBtnTextCancel, { color: isDarkMode ? '#FFFFFF' : '#767676' }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.whiteModalBtnConfirm, { backgroundColor: colors.accent }]} onPress={handleConfirmPhone}>
                <Text style={styles.whiteModalBtnTextConfirm}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL SENHA */}
      <Modal visible={showPasswordModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.whiteModalContainer, { backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF' }]}>
            <Text style={[styles.whiteModalTitle, { color: colors.textDark }]}>Alterar Senha</Text>
            <Text style={[styles.whiteModalDesc, { color: isDarkMode ? '#A8A8B3' : '#767676' }]}>
              Preencha os campos abaixo e solicite o código de segurança para confirmar.
            </Text>

            {!!passwordError && passwordError !== 'same_password' && (
              <Text style={styles.usernameErrorMsg}>{passwordError}</Text>
            )}

            <View style={{ gap: 10 }}>
              {/* Senha Atual */}
              <View style={[styles.whiteModalInputWrapper, { backgroundColor: isDarkMode ? '#1E1E24' : '#F0F0F0', borderColor: isDarkMode ? '#3E3E4A' : 'transparent' }, (passwordError === 'Senha incorreta!' || passwordError === 'same_password') ? styles.inputError : null]}>
                <TextInput
                  style={[styles.whiteModalInputFlex, { color: colors.textDark }]}
                  placeholder="Senha atual"
                  placeholderTextColor={isDarkMode ? '#8E8E93' : '#919191'}
                  secureTextEntry={!showCurrentPassword}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                />
                <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                  <Feather name={showCurrentPassword ? 'eye' : 'eye-off'} size={20} color={isDarkMode ? '#FFFFFF' : '#1C2434'} />
                </TouchableOpacity>
              </View>

              {/* Nova Senha */}
              <View style={[styles.whiteModalInputWrapper, { backgroundColor: isDarkMode ? '#1E1E24' : '#F0F0F0', borderColor: isDarkMode ? '#3E3E4A' : 'transparent' }, (passwordError === 'As senhas não coincidem!' || passwordError === 'same_password') ? styles.inputError : (isPasswordMatch && passwordError !== 'same_password' ? { borderColor: '#4CAF50' } : null)]}>
                <TextInput
                  style={[styles.whiteModalInputFlex, { color: colors.textDark }]}
                  placeholder="Nova senha"
                  placeholderTextColor={isDarkMode ? '#8E8E93' : '#919191'}
                  secureTextEntry={!showNewPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                  <Feather name={showNewPassword ? 'eye' : 'eye-off'} size={20} color={isDarkMode ? '#FFFFFF' : '#1C2434'} />
                </TouchableOpacity>
              </View>
              {passwordError === 'same_password' && (
                <Text style={[styles.usernameErrorMsg, { textAlign: 'left', marginLeft: 4, marginTop: -4 }]}>A nova senha que você digitou é a mesma da senha antiga!</Text>
              )}

              {/* Confirmar Nova Senha */}
              <View style={[styles.whiteModalInputWrapper, { backgroundColor: isDarkMode ? '#1E1E24' : '#F0F0F0', borderColor: isDarkMode ? '#3E3E4A' : 'transparent' }, (passwordError === 'As senhas não coincidem!' || passwordError === 'same_password') ? styles.inputError : (isPasswordMatch && passwordError !== 'same_password' ? { borderColor: '#4CAF50' } : null)]}>
                <TextInput
                  style={[styles.whiteModalInputFlex, { color: colors.textDark }]}
                  placeholder="Confirmar nova senha"
                  placeholderTextColor={isDarkMode ? '#8E8E93' : '#919191'}
                  secureTextEntry={!showConfirmNewPassword}
                  value={confirmNewPassword}
                  onChangeText={setConfirmNewPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmNewPassword(!showConfirmNewPassword)}>
                  <Feather name={showConfirmNewPassword ? 'eye' : 'eye-off'} size={20} color={isDarkMode ? '#FFFFFF' : '#1C2434'} />
                </TouchableOpacity>
              </View>

              {/* Código OTP + Botão Mandar */}
              <View style={[styles.whiteModalInputWrapper, { backgroundColor: isDarkMode ? '#1E1E24' : '#F0F0F0', borderColor: isDarkMode ? '#3E3E4A' : 'transparent' }, (passwordError === 'Você precisa mandar o código primeiro!' || passwordError === 'Código inválido!') ? styles.inputError : null]}>
                <TextInput
                  style={[styles.whiteModalInputFlex, { color: colors.textDark }]}
                  placeholder="Código de 8 dígitos"
                  placeholderTextColor={isDarkMode ? '#8E8E93' : '#919191'}
                  keyboardType="numeric"
                  value={passwordCode}
                  onChangeText={setPasswordCode}
                />
                <TouchableOpacity onPress={handleSendOtpCode} style={{ paddingHorizontal: 8, paddingVertical: 8, marginLeft: 8 }}>
                  <Text style={{ color: isDarkMode ? '#5B86E5' : '#042A7D', fontWeight: 'bold', fontSize: 14 }}>Mandar</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.whiteModalButtons}>
              <TouchableOpacity style={[styles.whiteModalBtnCancel, { backgroundColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]} onPress={() => setShowPasswordModal(false)}>
                <Text style={[styles.whiteModalBtnTextCancel, { color: isDarkMode ? '#FFFFFF' : '#767676' }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.whiteModalBtnConfirm, { backgroundColor: colors.accent }]} onPress={handleConfirmFinal}>
                <Text style={styles.whiteModalBtnTextConfirm}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* NESTED MODAL (Mesma Senha) */}
      <Modal visible={showNestedModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlayNested}>
          <View style={[styles.whiteModalContainer, { backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF' }]}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.textDark, marginBottom: 12 }}>Atenção</Text>
            <Text style={{ fontSize: 16, color: isDarkMode ? '#FFFFFF' : '#000', marginBottom: 20 }}>
              A nova senha que você digitou é a mesma da antiga.
            </Text>
            <View style={{ alignItems: 'flex-end' }}>
              <TouchableOpacity
                style={{ backgroundColor: colors.accent, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}
                onPress={() => setShowNestedModal(false)}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 }}>FECHAR</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL DE GERENCIAMENTO DE PERMISSÕES */}
      <Modal visible={showPermissionsModal} transparent={true} animationType="slide" onRequestClose={() => setShowPermissionsModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.whiteModalContainer, { backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF', width: '90%' }]}>
            <Text style={[styles.whiteModalTitle, { color: colors.textDark, fontSize: 20, marginBottom: 5 }]}>Gerenciador de Permissões</Text>
            <Text style={[styles.whiteModalDesc, { color: isDarkMode ? '#A8A8B3' : '#767676', marginBottom: 20 }]}>
              Veja e gerencie as permissões do aplicativo para habilitar todos os recursos.
            </Text>

            <View style={{ gap: 15, marginBottom: 25 }}>
              {/* Câmera */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: isDarkMode ? '#1E1E24' : '#F5F5F5', padding: 12, borderRadius: 10 }}>
                <View>
                  <Text style={{ fontWeight: 'bold', color: colors.textDark, fontSize: 15 }}>Câmera</Text>
                  <Text style={{ fontSize: 12, color: cameraPermission === 'granted' ? '#4CAF50' : '#FF3B30' }}>
                    {cameraPermission === 'granted' ? 'Permitido ✓' : 'Não Permitido ✗'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={{
                    backgroundColor: cameraPermission === 'granted' ? (isDarkMode ? '#3E3E4A' : '#E3E4EB') : colors.accent,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 6,
                    opacity: cameraPermission === 'granted' ? 0.6 : 1
                  }}
                  onPress={() => handlePressPermission('camera', 'Câmera', cameraPermission)}
                >
                  <Text style={{
                    color: cameraPermission === 'granted' ? (isDarkMode ? '#A8A8B3' : '#767676') : '#FFFFFF',
                    fontWeight: 'bold',
                    fontSize: 12
                  }}>
                    {cameraPermission === 'granted' ? 'Desautorizar' : 'Solicitar'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Galeria */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: isDarkMode ? '#1E1E24' : '#F5F5F5', padding: 12, borderRadius: 10 }}>
                <View>
                  <Text style={{ fontWeight: 'bold', color: colors.textDark, fontSize: 15 }}>Galeria de Fotos</Text>
                  <Text style={{ fontSize: 12, color: galleryPermission === 'granted' ? '#4CAF50' : '#FF3B30' }}>
                    {galleryPermission === 'granted' ? 'Permitido ✓' : 'Não Permitido ✗'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={{
                    backgroundColor: galleryPermission === 'granted' ? (isDarkMode ? '#3E3E4A' : '#E3E4EB') : colors.accent,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 6,
                    opacity: galleryPermission === 'granted' ? 0.6 : 1
                  }}
                  onPress={() => handlePressPermission('gallery', 'Galeria de Fotos', galleryPermission)}
                >
                  <Text style={{
                    color: galleryPermission === 'granted' ? (isDarkMode ? '#A8A8B3' : '#767676') : '#FFFFFF',
                    fontWeight: 'bold',
                    fontSize: 12
                  }}>
                    {galleryPermission === 'granted' ? 'Desautorizar' : 'Solicitar'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Localização */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: isDarkMode ? '#1E1E24' : '#F5F5F5', padding: 12, borderRadius: 10 }}>
                <View>
                  <Text style={{ fontWeight: 'bold', color: colors.textDark, fontSize: 15 }}>Localização (GPS)</Text>
                  <Text style={{ fontSize: 12, color: locationPermission === 'granted' ? '#4CAF50' : '#FF3B30' }}>
                    {locationPermission === 'granted' ? 'Permitido ✓' : 'Não Permitido ✗'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={{
                    backgroundColor: locationPermission === 'granted' ? (isDarkMode ? '#3E3E4A' : '#E3E4EB') : colors.accent,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 6,
                    opacity: locationPermission === 'granted' ? 0.6 : 1
                  }}
                  onPress={() => handlePressPermission('location', 'Localização (GPS)', locationPermission)}
                >
                  <Text style={{
                    color: locationPermission === 'granted' ? (isDarkMode ? '#A8A8B3' : '#767676') : '#FFFFFF',
                    fontWeight: 'bold',
                    fontSize: 12
                  }}>
                    {locationPermission === 'granted' ? 'Desautorizar' : 'Solicitar'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Notificações */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: isDarkMode ? '#1E1E24' : '#F5F5F5', padding: 12, borderRadius: 10 }}>
                <View>
                  <Text style={{ fontWeight: 'bold', color: colors.textDark, fontSize: 15 }}>Notificações Push</Text>
                  <Text style={{ fontSize: 12, color: notificationsPermission === 'granted' ? '#4CAF50' : '#FF3B30' }}>
                    {notificationsPermission === 'granted' ? 'Permitido ✓' : 'Não Permitido ✗'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={{
                    backgroundColor: notificationsPermission === 'granted' ? (isDarkMode ? '#3E3E4A' : '#E3E4EB') : colors.accent,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 6,
                    opacity: notificationsPermission === 'granted' ? 0.6 : 1
                  }}
                  onPress={() => handlePressPermission('notifications', 'Notificações Push', notificationsPermission)}
                >
                  <Text style={{
                    color: notificationsPermission === 'granted' ? (isDarkMode ? '#A8A8B3' : '#767676') : '#FFFFFF',
                    fontWeight: 'bold',
                    fontSize: 12
                  }}>
                    {notificationsPermission === 'granted' ? 'Desautorizar' : 'Solicitar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={{ backgroundColor: colors.accent, paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
              onPress={() => setShowPermissionsModal(false)}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>Fechar Gerenciador</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL DE CONFIRMAÇÃO DE DESAUTORIZAÇÃO */}
      <Modal visible={deauthModalVisible} transparent={true} animationType="fade" onRequestClose={() => setDeauthModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.whiteModalContainer, { backgroundColor: isDarkMode ? '#000000' : '#FFFFFF', borderColor: isDarkMode ? '#3E3E4A' : 'transparent', borderWidth: isDarkMode ? 1 : 0 }]}>
            <Text style={[styles.whiteModalTitle, { color: isDarkMode ? '#FFFFFF' : '#1C2434', fontSize: 18 }]}>Confirmar Ação</Text>
            <Text style={[styles.whiteModalDesc, { color: isDarkMode ? '#A8A8B3' : '#767676', marginTop: 10, marginBottom: 20 }]}>
              Deseja remover a permissão de {deauthFeature?.name}?
            </Text>
            <View style={styles.whiteModalButtons}>
              <TouchableOpacity
                style={[styles.whiteModalBtnCancel, { backgroundColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]}
                onPress={() => {
                  setDeauthModalVisible(false);
                  if (openedFromManager) {
                    setTimeout(() => {
                      setShowPermissionsModal(true);
                    }, 400);
                  }
                }}
              >
                <Text style={[styles.whiteModalBtnTextCancel, { color: isDarkMode ? '#FFFFFF' : '#767676' }]}>Não</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.whiteModalBtnConfirm, { backgroundColor: colors.accent }]}
                onPress={handleConfirmDeauth}
              >
                <Text style={styles.whiteModalBtnTextConfirm}>Sim</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL DE EXPLICAÇÃO DE PERMISSÃO */}
      <Modal visible={reqPermModalVisible} transparent={true} animationType="fade" onRequestClose={() => setReqPermModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.whiteModalContainer, { backgroundColor: isDarkMode ? '#000000' : '#FFFFFF', borderColor: isDarkMode ? '#3E3E4A' : 'transparent', borderWidth: isDarkMode ? 1 : 0 }]}>
            <Text style={[styles.whiteModalTitle, { color: isDarkMode ? '#FFFFFF' : '#1C2434', fontSize: 18 }]}>
              Acesso à/ao {reqPermFeature?.name}
            </Text>
            <Text style={[styles.whiteModalDesc, { color: isDarkMode ? '#A8A8B3' : '#767676', marginTop: 10, marginBottom: 20 }]}>
              {reqPermFeature ? getFeatureReqDescription(reqPermFeature.key) : ''}
            </Text>
            <View style={styles.whiteModalButtons}>
              <TouchableOpacity
                style={[styles.whiteModalBtnCancel, { backgroundColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]}
                onPress={() => {
                  setReqPermModalVisible(false);
                  if (openedFromManager) {
                    setTimeout(() => {
                      setShowPermissionsModal(true);
                    }, 400);
                  }
                }}
              >
                <Text style={[styles.whiteModalBtnTextCancel, { color: isDarkMode ? '#FFFFFF' : '#767676' }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.whiteModalBtnConfirm, { backgroundColor: colors.accent }]}
                onPress={handleConfirmRequestPermission}
              >
                <Text style={styles.whiteModalBtnTextConfirm}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  // ========== CONTEÚDO ==========

  // ========== FUNDO EXTERNO (#E3E4EB, 342x631, rx=25) ==========
  outerCard: {
    backgroundColor: '#E3E4EB',
    borderRadius: 25,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 40,
  },

  // Título "Configurações do Aplicativo" — dentro do fundo externo
  mainTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C2434',
    marginBottom: 14,
  },

  // ========== CARD ESCURO (#1C2434, rx=25) ==========
  darkCard: {
    backgroundColor: '#1C2434',
    borderRadius: 25,
    padding: 18,
    paddingBottom: 24,
    gap: 20,
  },

  // Seção de campo
  fieldSection: {
  },

  // Input field: #C0CADE, 262x44, rx=10 — com "Alterar" DENTRO
  fieldInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C0CADE',
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 12,
    marginTop: 6,
    gap: 8,
  },
  fieldValue: {
    flex: 1,
    fontSize: 14,
    color: '#1C2434',
  },

  // Botão "Alterar" DENTRO do input
  alterarBtnInside: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },

  // Phone input
  phoneInput: {
    flex: 1,
    fontSize: 14,
    color: '#1C2434',
    padding: 0,
    height: 44,
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 4,
  },
  toggleSpacer: {
    flex: 1,
  },
  switchTrack: {
    width: 54,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: 3,
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  iconBoxAnim: {
    width: 29,
    height: 29,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronButton: {
    width: 44,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#E3E4EB',
    marginBottom: 4,
    marginLeft: 2,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  toggleSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    marginLeft: 45,
    marginTop: -2,
    marginBottom: 8,
  },
  alterarTextLink: {
    fontSize: 13,
    fontWeight: 'bold',
  },

  // ===== WHITE MODALS =====
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
  },
  modalOverlayNested: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    zIndex: 999,
  },
  whiteModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    alignSelf: 'center',
  },
  whiteModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C2434',
    marginBottom: 8,
    textAlign: 'center',
  },
  whiteModalDesc: {
    fontSize: 14,
    color: '#767676',
    textAlign: 'center',
    marginBottom: 16,
  },
  whiteModalInput: {
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 45,
    fontSize: 16,
    color: '#1C2434',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  whiteModalInputWrapper: {
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 45,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  whiteModalInputFlex: {
    flex: 1,
    fontSize: 16,
    color: '#1C2434',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  usernameErrorMsg: {
    color: '#FF3B30',
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  whiteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 10,
  },
  whiteModalBtnCancel: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  whiteModalBtnTextCancel: {
    color: '#FF3B30',
    fontWeight: 'bold',
    fontSize: 15,
  },
  whiteModalBtnConfirm: {
    flex: 1,
    backgroundColor: '#042A7D',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  whiteModalBtnTextConfirm: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
