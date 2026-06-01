import { useState, useContext } from 'react';
import { Alert, Linking, Platform, Animated } from 'react-native';
import { AuthContext } from '../../../contexts/AuthContext';
import { supabase } from '../../../../data/datasources/supabase/client';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import Constants from 'expo-constants';

export function useAdminSettingsPermissions(notifIconRotate: Animated.Value) {
  const { user } = useContext(AuthContext);

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<string>('checking');
  const [galleryPermission, setGalleryPermission] = useState<string>('checking');
  const [locationPermission, setLocationPermission] = useState<string>('checking');
  const [notificationsPermission, setNotificationsPermission] = useState<string>('checking');
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

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

  /* istanbul ignore next */
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
          [{ text: 'Maravilha!', onPress: () => sendLocalTestNotification().catch(/* istanbul ignore next */ () => {}) }]
        );
      }
    }
  };

  return {
    notificationsEnabled,
    setNotificationsEnabled,
    cameraPermission,
    galleryPermission,
    locationPermission,
    notificationsPermission,
    setCameraPermission,
    setGalleryPermission,
    setLocationPermission,
    setNotificationsPermission,
    showPermissionsModal,
    setShowPermissionsModal,
    checkAllPermissions,
    requestCamera,
    requestGallery,
    requestLocation,
    requestNotifications,
    handlePressPermission,
    getFeatureReqDescription,
    handleToggleNotifications,
    registerForPushNotificationsAsync,
    sendLocalTestNotification,
  };
}
