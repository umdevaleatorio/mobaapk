import { useState, useContext, useEffect, useRef } from 'react';
import { Animated, Platform, Alert, AppState, Linking } from 'react-native';
import { AuthContext } from '../../../contexts/AuthContext';
import { supabase } from '../../../../data/datasources/supabase/client';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import Constants from 'expo-constants';

export function useSettingsPermissions() {
  const { user } = useContext(AuthContext);

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<string>('checking');
  const [galleryPermission, setGalleryPermission] = useState<string>('checking');
  const [locationPermission, setLocationPermission] = useState<string>('checking');
  const [notificationsPermission, setNotificationsPermission] = useState<string>('checking');
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  const notifSwitchAnim = useRef(new Animated.Value(notificationsEnabled ? 1 : 0)).current;
  const notifIconRotate = useRef(new Animated.Value(0)).current;
  const permIconScale = useRef(new Animated.Value(1)).current;

  const notifRotateInterpolate = notifIconRotate.interpolate({
    inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: ['0deg', '-20deg', '20deg', '-15deg', '15deg', '0deg'],
  });

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        checkAllPermissions();
      }
    });
    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    Animated.spring(notifSwitchAnim, {
      toValue: notificationsEnabled ? 1 : 0,
      useNativeDriver: false,
      bounciness: 4,
      speed: 12,
    }).start();
  }, [notificationsEnabled]);

  useEffect(() => {
    const checkInitialNotifications = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      setNotificationsEnabled(status === 'granted');
    };
    checkInitialNotifications();
    checkAllPermissions();
  }, []);

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

  const handleToggleNotifications = async () => {
    notifIconRotate.setValue(0);
    Animated.timing(notifIconRotate, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    if (notificationsEnabled) {
      Alert.alert(
        'Notificações Push',
        'Para desativar as notificações, você precisa alterar nas configurações do sistema do seu celular.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir Configurações', onPress: () => Linking.openSettings() }
        ]
      );
    } else {
      if (notificationsPermission !== 'granted') {
        requestNotifications();
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

  const handlePressPermission = (key: string, name: string, currentStatus: string) => {
    if (currentStatus === 'granted') {
      Alert.alert(
        `Desativar ${name}`,
        `Para desativar o acesso de ${name}, você precisa alterar nas configurações do sistema do seu celular.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir Configurações', onPress: () => Linking.openSettings() }
        ]
      );
    } else {
      if (key === 'camera') requestCamera();
      if (key === 'gallery') requestGallery();
      if (key === 'location') requestLocation();
      if (key === 'notifications') requestNotifications();
    }
  };

  return {
    notificationsEnabled,
    cameraPermission,
    galleryPermission,
    locationPermission,
    notificationsPermission,
    showPermissionsModal,
    setShowPermissionsModal,
    notifSwitchAnim,
    notifIconRotate,
    permIconScale,
    notifRotateInterpolate,
    handleToggleNotifications,
    handleOpenPermissions,
    handlePressPermission,
  };
}
