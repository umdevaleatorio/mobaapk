import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../../../data/datasources/supabase/client';
import { useTheme } from '../../../contexts/ThemeContext';

export function useProductCreateScreen() {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<any>();
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showImagePickerOptions, setShowImagePickerOptions] = useState(false);
  const [photos, setPhotos] = useState<Array<{ uri: string; base64?: string | null }>>([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setSearchText('');
      setActiveCategory(null);
      setPhotos([]);
      setCurrentPhotoIndex(0);
      setName('');
      setDescription('');
      setPrice('');
      setQuantity('');
    });
    return unsubscribe;
  }, [navigation]);

  const handleSelectPhoto = () => setShowImagePickerOptions(true);

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
      base64: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setPhotos(prev => {
        const next = [...prev, { uri: asset.uri, base64: asset.base64 || null }];
        setCurrentPhotoIndex(next.length - 1);
        return next;
      });
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
      base64: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setPhotos(prev => {
        const next = [...prev, { uri: asset.uri, base64: asset.base64 || null }];
        setCurrentPhotoIndex(next.length - 1);
        return next;
      });
    }
  };

  const handleRegister = async () => {
    if (!name || !price || !quantity) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos do formulário.');
      return;
    }
    if (!activeCategory) {
      Alert.alert('Atenção', 'Por favor, selecione uma categoria.');
      return;
    }
    const mappedImages = photos.map(p => p.base64 ? `data:image/jpeg;base64,${p.base64}` : p.uri);
    const { error } = await supabase.from('products').insert([{
      name,
      description,
      price: parseFloat(price.replace(',', '.')),
      stock: parseInt(quantity, 10),
      active: true,
      image_url: mappedImages.length > 0 ? JSON.stringify(mappedImages) : null,
      category_id: activeCategory,
    }]);
    if (error) {
      Alert.alert('Erro', 'Não foi possível registrar o produto.');
      console.error(error);
    } else {
      Alert.alert('Sucesso', 'Produto registrado com sucesso!', [
        { text: 'OK', onPress: () => navigation.navigate('Gerenciar') }
      ]);
    }
  };

  const removePhoto = () => {
    const newPhotos = [...photos];
    newPhotos.splice(currentPhotoIndex, 1);
    setPhotos(newPhotos);
    setCurrentPhotoIndex(prev => Math.max(0, prev - 1));
  };

  const labelColor = isDarkMode ? '#FFFFFF' : '#8A7268';
  const sepColor = isDarkMode ? 'rgba(255,255,255,0.2)' : '#8A7268';

  return {
    colors,
    isDarkMode,
    navigation,
    searchText, setSearchText,
    activeCategory, setActiveCategory,
    showImagePickerOptions, setShowImagePickerOptions,
    photos, setPhotos,
    currentPhotoIndex, setCurrentPhotoIndex,
    name, setName,
    description, setDescription,
    price, setPrice,
    quantity, setQuantity,
    handleSelectPhoto,
    openCamera,
    openGallery,
    handleRegister,
    removePhoto,
    labelColor, sepColor,
  };
}
