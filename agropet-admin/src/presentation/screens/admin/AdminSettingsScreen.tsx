import React, { useState, useContext, useEffect } from 'react';
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
  Linking,
} from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';
import { supabase } from '../../../data/datasources/supabase/client';
import { Feather } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import Constants from 'expo-constants';

import AdminHeader from '../../components/AdminHeader';
import { AdminUserMenu } from '../../components/AdminUserMenu';
import { useTheme } from '../../contexts/ThemeContext';

// === MIDDLE SVGs ===
import ConfigTitleSvg from '../../assets/tela4/meio/Configurações do Aplicativo.svg';

// Email
import EmailLabel from '../../assets/tela4/meio/email/E-mail.svg';
import EmailAlterar from '../../assets/tela4/meio/email/Alterar.svg';

// Senha
import SenhaLabel from '../../assets/tela4/meio/senha/Senha.svg';
import SenhaAlterar from '../../assets/tela4/meio/senha/Alterar.svg';

// Raio
import AlterarRaioLabel from '../../assets/tela4/meio/raio/Alterar alcance do raio.svg';
import RaioAlterar from '../../assets/tela4/meio/raio/Alterar.svg';
import DeAlcanceText from '../../assets/tela4/meio/raio/de alcance.svg';

// Toggles (Labels textuais mantidos para manter Figma design, mas switches agora são animados)
import TemaEscuroLabel from '../../assets/tela4/meio/tema escuro/Tema escuro_.svg';
import NotifLabel from '../../assets/tela4/meio/notificacoes/Notificação_.svg';
import PermLabel from '../../assets/tela4/meio/permissoes/Permissão_.svg';
import DesativarFreteLabel from '../../assets/tela4/meio/frete/Desativar frete_.svg';

interface CustomSwitchProps {
  active: boolean;
  onPress: () => void;
  colorActive?: string;
  animValue: Animated.Value;
  isDarkMode: boolean;
}

const CustomSwitch: React.FC<CustomSwitchProps> = ({ active, onPress, colorActive = '#EA841E', animValue, isDarkMode }) => {
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

export default function AdminSettingsScreen() {
  const { user } = useContext(AuthContext);
  const userEmail = user?.new_email || user?.email || 'admin@agropet.com';

  const { colors, isDarkMode, toggleTheme } = useTheme();

  // State for radius
  const [radius, setRadius] = useState('17');
  const [isEditingRadius, setIsEditingRadius] = useState(false);

  const fetchRadius = async () => {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('delivery_radius_km, delivery_active')
        .maybeSingle();
      
      if (data && !error) {
        if (data.delivery_radius_km !== null) {
          setRadius(String(Math.round(data.delivery_radius_km)));
        } else {
          setRadius('17');
        }
        if (data.delivery_active !== undefined) {
          setDeliveryDisabled(!data.delivery_active);
        }
      } else {
        setRadius('17');
        setDeliveryDisabled(false);
      }
    } catch (e) {
      console.log('Error loading radius/delivery from DB:', e);
      setRadius('17');
      setDeliveryDisabled(false);
    }
  };

  const handleSaveRadius = async (newRadius: string) => {
    const parsed = parseFloat(newRadius);
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert('Erro', 'Por favor, insira um número válido maior que zero.');
      return;
    }
    
    try {
      const { data: existing, error: selectError } = await supabase
        .from('store_settings')
        .select('id')
        .maybeSingle();
        
      if (selectError) throw selectError;
      
      if (existing) {
        const { error: updateError } = await supabase
          .from('store_settings')
          .update({ delivery_radius_km: parsed })
          .eq('id', existing.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('store_settings')
          .insert({ delivery_radius_km: parsed });
        if (insertError) throw insertError;
      }
      
      setRadius(String(Math.round(parsed)));
      setIsEditingRadius(false);
      Alert.alert('Sucesso', 'Raio de alcance atualizado com sucesso!');
    } catch (e) {
      console.error('Error saving radius:', e);
      Alert.alert('Erro', 'Não foi possível salvar o raio de alcance.');
    }
  };

  const handleToggleDelivery = async (newDisabledState: boolean) => {
    try {
      const activeValue = !newDisabledState;
      
      const { data: existing, error: selectError } = await supabase
        .from('store_settings')
        .select('id')
        .maybeSingle();
        
      if (selectError) throw selectError;
      
      if (existing) {
        const { error: updateError } = await supabase
          .from('store_settings')
          .update({ delivery_active: activeValue })
          .eq('id', existing.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('store_settings')
          .insert({ delivery_active: activeValue });
        if (insertError) throw insertError;
      }
      
      setDeliveryDisabled(newDisabledState);
      Alert.alert(
        'Sucesso', 
        newDisabledState 
          ? 'Frete desativado com sucesso!' 
          : 'Frete ativado com sucesso!'
      );
    } catch (e) {
      console.error('Error toggling delivery:', e);
      Alert.alert('Erro', 'Não foi possível alterar a configuração de frete.');
    }
  };

  // State for delivery disable toggle
  const [deliveryDisabled, setDeliveryDisabled] = useState(false);

  // === EMAIL STATES ===
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailStatus, setEmailStatus] = useState<'validar' | 'alterar'>(user?.new_email ? 'validar' : 'alterar');
  const [emailError, setEmailError] = useState('');
  const [emailCode, setEmailCode] = useState('');

  // === PASSWORD STATES ===
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showNestedModal, setShowNestedModal] = useState(false);
  const [passwordCode, setPasswordCode] = useState('');
  const [expectedPasswordCode, setExpectedPasswordCode] = useState('');

  // === NOTIFICATION STATES ===
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // === PERMISSION STATES ===
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

  const getFeatureReqDescription = (key: string) => {
    switch (key) {
      case 'camera':
        return 'O painel de administração necessita de acesso à câmera para que você possa tirar fotos em tempo real dos seus produtos na hora de cadastrá-los ou editá-los no estoque, além de poder capturar sua foto de perfil.';
      case 'gallery':
        return 'O painel de administração precisa de acesso à sua galeria de fotos para permitir que você escolha fotos de produtos já salvas em seu dispositivo ao criar novos itens ou atualizar o catálogo, ou para alterar sua foto de perfil.';
      case 'location':
        return 'O aplicativo do administrador precisa de acesso à sua localização GPS em tempo real para permitir o rastreamento das entregas no mapa, transmitindo de forma segura as coordenadas do entregador até a casa do cliente durante o trajeto.';
      case 'notifications':
        return 'As notificações push mantêm você instantaneamente informado sobre novos pedidos recebidos, cancelamentos por parte dos clientes e atualizações importantes do sistema, mesmo com o aplicativo fechado.';
      default:
        return '';
    }
  };

  const handlePressPermission = (key: string, name: string, currentStatus: string) => {
    if (currentStatus === 'granted') {
      setDeauthFeature({ key, name });
      setDeauthModalVisible(true);
    } else {
      setReqPermFeature({ key, name });
      setReqPermModalVisible(true);
    }
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
  };

  // === ANIMATION VALUES ===
  const themeSwitchAnim = React.useRef(new Animated.Value(isDarkMode ? 1 : 0)).current;
  const notifSwitchAnim = React.useRef(new Animated.Value(notificationsEnabled ? 1 : 0)).current;
  const deliverySwitchAnim = React.useRef(new Animated.Value(deliveryDisabled ? 1 : 0)).current;

  const themeIconRotate = React.useRef(new Animated.Value(0)).current;
  const themeIconScale = React.useRef(new Animated.Value(1)).current;
  const notifIconRotate = React.useRef(new Animated.Value(0)).current;
  const permIconScale = React.useRef(new Animated.Value(1)).current;

  // Spring switch animation triggers
  useEffect(() => {
    Animated.spring(themeSwitchAnim, {
      toValue: isDarkMode ? 1 : 0,
      useNativeDriver: false,
      bounciness: 4,
      speed: 12,
    }).start();
  }, [isDarkMode]);

  useEffect(() => {
    Animated.spring(notifSwitchAnim, {
      toValue: notificationsEnabled ? 1 : 0,
      useNativeDriver: false,
      bounciness: 4,
      speed: 12,
    }).start();
  }, [notificationsEnabled]);

  useEffect(() => {
    Animated.spring(deliverySwitchAnim, {
      toValue: deliveryDisabled ? 1 : 0,
      useNativeDriver: false,
      bounciness: 4,
      speed: 12,
    }).start();
  }, [deliveryDisabled]);

  const themeRotateInterpolate = themeIconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const notifRotateInterpolate = notifIconRotate.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: ['0deg', '-20deg', '20deg', '-15deg', '15deg', '0deg'],
  });

  // Sincronizar status do e-mail com pendências do Supabase
  useEffect(() => {
    if (user?.new_email) {
      setEmailStatus('validar');
      setEmailInput(user.new_email);
    } else {
      setEmailStatus('alterar');
    }
  }, [user]);

  // Verificar status inicial das notificações e permissões
  useEffect(() => {
    const checkInitialNotifications = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationsEnabled(status === 'granted');
    };
    checkInitialNotifications();
    checkAllPermissions();
    fetchRadius();
  }, []);

  // ======= EMAIL ACTIONS =======
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
        await supabase.auth.refreshSession().catch(() => {});
        setEmailStatus('alterar');
        setShowEmailModal(false);
        Alert.alert('Sucesso', 'E-mail alterado com sucesso!');
      }
    }
  };

  // ======= PASSWORD ACTIONS =======
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

    // Gerar código de 6 dígitos simulado
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    setExpectedPasswordCode(generatedCode);
    console.log("Código de Senha Gerado:", generatedCode); // Para depuração
    Alert.alert('Código Enviado!', 'Verifique sua caixa de e-mail para pegar o código de 6 dígitos.');
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

  // ======= THEME INTERACTION (MICRO-ANIMATION ONLY) =======
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

  // ======= PUSH NOTIFICATION ACTIONS =======
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
        title: "Agropet Lambari Admin 🐾",
        body: "Notificações administrativas ativadas! 🎉",
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
        // Fallback for simulation
        setNotificationsEnabled(true);
        setNotificationsPermission('granted');
        Alert.alert(
          'Notificações de Teste Ativas',
          'Como o push do sistema não pôde ser registrado (comum no Expo Go ou se a permissão foi negada), ativamos o modo de simulação com notificações locais para você testar!',
          [{ text: 'Maravilha!', onPress: () => sendLocalTestNotification().catch(() => {}) }]
        );
      }
    }
  };

  // ======= DEVICE PERMISSIONS ACTIONS =======
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

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.backgroundLight }]}>
      <StatusBar backgroundColor={colors.headerBackground} barStyle="light-content" />

      {/* Header Admin */}
      <AdminHeader title="opcoes" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ========== EXTERNAL BACKGROUND ========== */}
        <View style={[styles.outerCard, { backgroundColor: isDarkMode ? '#2E2E38' : '#E3E4EB' }]}>

          {/* Title inside outer background */}
          <View style={{ marginBottom: 24, alignItems: 'center' }}>
            {isDarkMode ? (
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' }}>
                Configurações do Aplicativo
              </Text>
            ) : (
              <ConfigTitleSvg width={300} height={25} />
            )}
          </View>

          {/* ========== DARK CARD ========== */}
          <View style={[styles.darkCard, { backgroundColor: isDarkMode ? '#1E1E24' : '#1C2434' }]}>

            {/* === E-MAIL === */}
            <View style={styles.fieldSection}>
              <View style={{ marginBottom: 6 }}>
                <EmailLabel width={48} height={13} />
              </View>
              <View style={[styles.fieldInput, { backgroundColor: isDarkMode ? '#2E2E38' : '#C0CADE' }]}>
                <Text style={[styles.fieldValue, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]} numberOfLines={1}>
                  {userEmail}
                </Text>
                
                {emailStatus === 'validar' ? (
                  <TouchableOpacity 
                    onPress={() => setShowEmailModal(true)} 
                    style={[styles.alterarBtnInside, { flexDirection: 'row', alignItems: 'center' }]}
                  >
                    <Text style={{ color: '#FFC107', fontSize: 16, marginRight: 4, fontWeight: 'bold' }}>!</Text>
                    <Text style={{ color: '#FFC107', fontWeight: 'bold', fontSize: 13 }}>Validar</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    onPress={() => { setEmailInput(userEmail); setEmailError(''); setShowEmailModal(true); }} 
                    style={styles.alterarBtnInside}
                  >
                    {isDarkMode ? (
                      <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>Alterar</Text>
                    ) : (
                      <EmailAlterar width={50} height={12} />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* === SENHA (Sem olho redundante, pois a pessoa altera se esqueceu) === */}
            <View style={styles.fieldSection}>
              <View style={{ marginBottom: 6 }}>
                <SenhaLabel width={49} height={13} />
              </View>
              <View style={[styles.fieldInput, { backgroundColor: isDarkMode ? '#2E2E38' : '#C0CADE' }]}>
                <Text style={[styles.fieldValue, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>
                  ••••••••••••••
                </Text>
                <TouchableOpacity 
                  onPress={() => {
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmNewPassword('');
                    setPasswordCode('');
                    setExpectedPasswordCode('');
                    setPasswordError('');
                    setShowPasswordModal(true);
                  }} 
                  style={styles.alterarBtnInside}
                >
                  {isDarkMode ? (
                    <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>Alterar</Text>
                  ) : (
                    <SenhaAlterar width={50} height={12} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* === ALCANCE DO RAIO === */}
            <View style={styles.fieldSection}>
              <View style={{ marginBottom: 6 }}>
                <AlterarRaioLabel 
                  width={160} 
                  height={14} 
                  fill={isDarkMode ? '#FFFFFF' : undefined} 
                  stroke={isDarkMode ? '#FFFFFF' : undefined} 
                />
              </View>
              <View style={[styles.fieldInput, { backgroundColor: isDarkMode ? '#2E2E38' : '#C0CADE' }]}>
                {isEditingRadius ? (
                  <TextInput
                    style={[styles.fieldValue, { fontWeight: 'bold', color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}
                    value={radius}
                    onChangeText={setRadius}
                    keyboardType="numeric"
                    autoFocus
                    onSubmitEditing={() => handleSaveRadius(radius)}
                  />
                ) : (
                  <Text style={[styles.fieldValue, { color: isDarkMode ? '#A8A8B3' : '#888', fontWeight: 'bold' }]}>
                    {radius}Km
                  </Text>
                )}

                <View style={{ marginRight: 10 }}>
                  {isDarkMode ? (
                    <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500' }}>de alcance</Text>
                  ) : (
                    <DeAlcanceText width={76} height={14} />
                  )}
                </View>
                
                <TouchableOpacity 
                  style={styles.alterarBtnInside} 
                  onPress={() => {
                    if (isEditingRadius) {
                      handleSaveRadius(radius);
                    } else {
                      setIsEditingRadius(true);
                    }
                  }}
                >
                  {isEditingRadius ? (
                    <Text style={{ color: isDarkMode ? '#FFC107' : '#042A7D', fontWeight: 'bold', fontSize: 13 }}>
                      Salvar
                    </Text>
                  ) : (
                    isDarkMode ? (
                      <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>Alterar</Text>
                    ) : (
                      <RaioAlterar width={50} height={12} />
                    )
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* ========== TOGGLES COM FEATHER E SWITCHES DO CLIENTE ========== */}

            {/* Tema escuro */}
            <View style={styles.toggleRow}>
              <Animated.View style={[styles.iconBoxAnim, { transform: [{ rotate: themeRotateInterpolate }, { scale: themeIconScale }] }]}>
                <Feather 
                  name={isDarkMode ? 'moon' : 'sun'} 
                  size={22} 
                  color={isDarkMode ? '#FFC107' : '#EA841E'} 
                />
              </Animated.View>
              <TemaEscuroLabel width={107} height={14} />
              <View style={styles.toggleSpacer} />
              <CustomSwitch 
                active={isDarkMode} 
                onPress={handleToggleTheme} 
                colorActive={colors.primary} 
                animValue={themeSwitchAnim} 
                isDarkMode={isDarkMode}
              />
            </View>

            {/* Notificações */}
            <View style={styles.toggleRow}>
              <Animated.View style={[styles.iconBoxAnim, { transform: [{ rotate: notifRotateInterpolate }] }]}>
                <Feather 
                  name={notificationsEnabled ? 'bell' : 'bell-off'} 
                  size={22} 
                  color={isDarkMode ? '#FFD700' : '#E3E4EB'} 
                />
              </Animated.View>
              <NotifLabel width={95} height={18} />
              <View style={styles.toggleSpacer} />
              <CustomSwitch 
                active={notificationsEnabled} 
                onPress={handleToggleNotifications} 
                colorActive="#25BE36" 
                animValue={notifSwitchAnim} 
                isDarkMode={isDarkMode}
              />
            </View>

            {/* Permissões */}
            <View style={styles.toggleRow}>
              <Animated.View style={[styles.iconBoxAnim, { transform: [{ scale: permIconScale }] }]}>
                <Feather 
                  name="shield" 
                  size={22} 
                  color={isDarkMode ? '#FFC107' : '#4A90E2'} 
                />
              </Animated.View>
              <PermLabel width={86} height={14} />
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

            {/* Desativar frete */}
            <View style={styles.toggleRow}>
              <View style={{ width: 29, height: 29, justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                <Feather 
                  name="truck" 
                  size={22} 
                  color={isDarkMode ? '#FFC107' : '#EA841E'} 
                />
                <Animated.View 
                  style={{
                    position: 'absolute',
                    width: 26,
                    height: 2.5,
                    backgroundColor: '#FF3B30', // Premium red diagonal slash
                    transform: [
                      { scaleX: deliverySwitchAnim },
                      { rotate: '-45deg' }
                    ],
                    opacity: deliverySwitchAnim,
                    borderRadius: 1,
                  }}
                />
              </View>
              <View style={{ marginLeft: 3 }}>
                <DesativarFreteLabel width={105} height={14} />
              </View>
              <View style={styles.toggleSpacer} />
              <CustomSwitch 
                active={deliveryDisabled} 
                onPress={() => handleToggleDelivery(!deliveryDisabled)} 
                colorActive="#FF3B30" 
                animValue={deliverySwitchAnim} 
                isDarkMode={isDarkMode}
              />
            </View>

          </View>
          {/* END DARK CARD */}

        </View>
        {/* END EXTERNAL BACKGROUND */}
      </ScrollView>

      {/* MODAL E-MAIL */}
      <Modal visible={showEmailModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.whiteModalContainer, { backgroundColor: colors.white }]}>
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
                style={[
                  styles.whiteModalInput, 
                  { 
                    backgroundColor: isDarkMode ? '#1E1E24' : '#F0F0F0', 
                    color: colors.textDark, 
                    borderColor: isDarkMode ? '#3E3E4A' : 'transparent' 
                  }, 
                  emailError ? styles.inputError : null
                ]}
                placeholder="Código de 6 dígitos..."
                placeholderTextColor={isDarkMode ? '#8E8E93' : '#919191'}
                value={emailCode}
                onChangeText={setEmailCode}
                keyboardType="numeric"
              />
            ) : (
              <TextInput
                style={[
                  styles.whiteModalInput, 
                  { 
                    backgroundColor: isDarkMode ? '#1E1E24' : '#F0F0F0', 
                    color: colors.textDark, 
                    borderColor: isDarkMode ? '#3E3E4A' : 'transparent' 
                  }, 
                  emailError ? styles.inputError : null
                ]}
                placeholder="novo@email.com"
                placeholderTextColor={isDarkMode ? '#8E8E93' : '#919191'}
                value={emailInput}
                onChangeText={setEmailInput}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}
            <View style={styles.whiteModalButtons}>
              <TouchableOpacity 
                style={[styles.whiteModalBtnCancel, { backgroundColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]} 
                onPress={() => setShowEmailModal(false)}
              >
                <Text style={[styles.whiteModalBtnTextCancel, { color: isDarkMode ? '#FFFFFF' : '#767676' }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.whiteModalBtnConfirm, { backgroundColor: colors.accent }]} onPress={handleConfirmEmail}>
                <Text style={styles.whiteModalBtnTextConfirm}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL SENHA */}
      <Modal visible={showPasswordModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.whiteModalContainer, { backgroundColor: colors.white }]}>
            <Text style={[styles.whiteModalTitle, { color: colors.textDark }]}>Alterar Senha</Text>
            <Text style={[styles.whiteModalDesc, { color: isDarkMode ? '#A8A8B3' : '#767676' }]}>
              Preencha os campos abaixo e solicite o código de segurança para confirmar.
            </Text>
            
            {!!passwordError && passwordError !== 'same_password' && (
              <Text style={styles.usernameErrorMsg}>{passwordError}</Text>
            )}

            <View style={{ gap: 10 }}>
              {/* Senha Atual */}
              <View style={[
                styles.whiteModalInputWrapper, 
                { backgroundColor: isDarkMode ? '#1E1E24' : '#F0F0F0', borderColor: isDarkMode ? '#3E3E4A' : 'transparent' }, 
                (passwordError === 'Senha incorreta!' || passwordError === 'same_password') ? styles.inputError : null
              ]}>
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
              <View style={[
                styles.whiteModalInputWrapper, 
                { backgroundColor: isDarkMode ? '#1E1E24' : '#F0F0F0', borderColor: isDarkMode ? '#3E3E4A' : 'transparent' }, 
                (passwordError === 'As senhas não coincidem!' || passwordError === 'same_password') ? styles.inputError : (isPasswordMatch && passwordError !== 'same_password' ? { borderColor: '#4CAF50' } : null)
              ]}>
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
              <View style={[
                styles.whiteModalInputWrapper, 
                { backgroundColor: isDarkMode ? '#1E1E24' : '#F0F0F0', borderColor: isDarkMode ? '#3E3E4A' : 'transparent' }, 
                (passwordError === 'As senhas não coincidem!' || passwordError === 'same_password') ? styles.inputError : (isPasswordMatch && passwordError !== 'same_password' ? { borderColor: '#4CAF50' } : null)
              ]}>
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
              <View style={[
                styles.whiteModalInputWrapper, 
                { backgroundColor: isDarkMode ? '#1E1E24' : '#F0F0F0', borderColor: isDarkMode ? '#3E3E4A' : 'transparent' }, 
                (passwordError === 'Você precisa mandar o código primeiro!' || passwordError === 'Código inválido!') ? styles.inputError : null
              ]}>
                <TextInput
                  style={[styles.whiteModalInputFlex, { color: colors.textDark }]}
                  placeholder="Código de 6 dígitos"
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
              <TouchableOpacity 
                style={[styles.whiteModalBtnCancel, { backgroundColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]} 
                onPress={() => setShowPasswordModal(false)}
              >
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
          <View style={[styles.whiteModalContainer, { backgroundColor: colors.white }]}>
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
          <View style={[styles.whiteModalContainer, { backgroundColor: colors.white, width: '90%' }]}>
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
                onPress={() => setDeauthModalVisible(false)}
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
                onPress={() => setReqPermModalVisible(false)}
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

      <AdminUserMenu />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingBottom: 112, // Space for bottom bar
  },

  // ========== OUTER BACKGROUND ==========
  outerCard: {
    backgroundColor: '#E3E4EB',
    borderRadius: 25,
    padding: 20,
    paddingBottom: 30,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 60,
  },

  // ========== DARK CARD ==========
  darkCard: {
    backgroundColor: '#1C2434',
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingTop: 30,
    paddingBottom: 40,
    gap: 25,
  },

  // Input sections
  fieldSection: {},

  // Input field container
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
  alterarBtnInside: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },

  // Toggle Row
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 10,
  },
  toggleSpacer: {
    flex: 1,
  },

  // ===== CUSTOM SWITCH AND ANIMATED ELEMENTS =====
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

  // ===== WHITE MODALS (Identical layout to Client's Settings) =====
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
