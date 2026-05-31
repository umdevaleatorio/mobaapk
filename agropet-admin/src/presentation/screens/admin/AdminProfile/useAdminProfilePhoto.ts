import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../../../../data/datasources/supabase/client';

export function useAdminProfilePhoto(user: any) {
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [showImagePickerOptions, setShowImagePickerOptions] = useState(false);
  const [showViewPhotoModal, setShowViewPhotoModal] = useState(false);

  const avatarKey = user ? `av_${user.id.slice(0, 8)}` : 'av_guest';

  useEffect(() => {
    const loadPhoto = async () => {
      try {
        const savedUri = await SecureStore.getItemAsync(avatarKey);
        if (savedUri) {
          setPhotoUri(savedUri);
        }
      } catch (e) { }
    };
    loadPhoto();
    if (user?.user_metadata?.avatar_url) {
      supabase.auth.updateUser({ data: { avatar_url: null } }).catch(() => { });
    }
  }, [user]);

  const handleSelectPhoto = () => {
    setShowImagePickerOptions(true);
  };

  const openCamera = async () => {
    setShowImagePickerOptions(false);
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permissão necessária', 'Você precisa permitir o acesso à câmera para tirar uma foto.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.5,
    });
    /* istanbul ignore next */
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setPhotoUri(uri);
      try { await SecureStore.setItemAsync(avatarKey, uri); } catch (e) { }
    }
  };

  const openGallery = async () => {
    setShowImagePickerOptions(false);
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permissão necessária', 'Você precisa permitir o acesso à galeria para selecionar uma foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.5,
    });
    /* istanbul ignore next */
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setPhotoUri(uri);
      try { await SecureStore.setItemAsync(avatarKey, uri); } catch (e) { }
    }
  };

  return {
    photoUri, setPhotoUri,
    showImagePickerOptions, setShowImagePickerOptions,
    showViewPhotoModal, setShowViewPhotoModal,
    avatarKey,
    handleSelectPhoto, openCamera, openGallery,
  };
}
