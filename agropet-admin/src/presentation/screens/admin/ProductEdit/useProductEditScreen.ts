import { useState, useEffect, useRef } from 'react';
import { Alert, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../../../data/datasources/supabase/client';
import { useTheme } from '../../../contexts/ThemeContext';

function getAllImageUrls(url: string | null | undefined): string[] {
  if (!url) return [];
  const trimmed = url.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.filter(u => !!u);
    } catch (_) {}
  }
  return [url];
}

export function useProductEditScreen() {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const product = route.params?.product;

  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(product?.category_id || null);
  const [showImagePickerOptions, setShowImagePickerOptions] = useState(false);
  const [photos, setPhotos] = useState<Array<{ uri: string; base64?: string | null }>>(() => {
    return getAllImageUrls(product?.image_url).map(u => ({ uri: u, base64: null }));
  });
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [quantity, setQuantity] = useState(product?.stock?.toString() || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [isEditingQty, setIsEditingQty] = useState(false);

  const nameRef = useRef<TextInput>(null);
  const descRef = useRef<TextInput>(null);
  const priceRef = useRef<TextInput>(null);
  const qtyRef = useRef<TextInput>(null);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', async () => {
      setSearchText('');
      setActiveCategory(product?.category_id || null);
      setCurrentPhotoIndex(0);
      setName(product?.name || '');
      setDescription(product?.description || '');
      setPrice(product?.price?.toString() || '');
      setQuantity(product?.stock?.toString() || '');
      setIsEditingName(false);
      setIsEditingDesc(false);
      setIsEditingPrice(false);
      setIsEditingQty(false);
      
      if (product?.id) {
        const { data } = await supabase.from('products').select('image_url').eq('id', product.id).single();
        if (data && data.image_url) {
          setPhotos(getAllImageUrls(data.image_url).map(u => ({ uri: u, base64: null })));
        } else {
          setPhotos([]);
        }
      } else {
        setPhotos([]);
      }
    });
    return unsubscribe;
  }, [navigation, product]);

  const handleSelectPhoto = () => setShowImagePickerOptions(true);

  const openCamera = async () => {
    setShowImagePickerOptions(false);
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permissão necessária', 'Você precisa permitir o acesso à câmera para tirar uma foto.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'], allowsEditing: false, quality: 0.5, base64: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setPhotos(prev => { const next = [...prev, { uri: asset.uri, base64: asset.base64 || null }]; setCurrentPhotoIndex(next.length - 1); return next; });
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
      mediaTypes: ['images'], allowsEditing: false, quality: 0.5, base64: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setPhotos(prev => { const next = [...prev, { uri: asset.uri, base64: asset.base64 || null }]; setCurrentPhotoIndex(next.length - 1); return next; });
    }
  };

  const handleConfirm = async () => {
    if (!name || !price || !quantity) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos do formulário.');
      return;
    }
    if (!product?.id) {
      Alert.alert('Erro', 'Nenhum produto selecionado para edição.');
      return;
    }
    const mappedImages = photos.map(p => p.base64 ? `data:image/jpeg;base64,${p.base64}` : p.uri);
    const updateData: any = {
      name, description,
      price: parseFloat(price.replace(',', '.')),
      stock: parseInt(quantity, 10),
      category_id: activeCategory,
      image_url: mappedImages.length > 0 ? JSON.stringify(mappedImages) : null,
    };
    const { error } = await supabase.from('products').update(updateData).eq('id', product.id);
    if (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o produto.');
      console.error(error);
    } else {
      Alert.alert('Sucesso', 'Produto atualizado com sucesso!', [
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
    colors, isDarkMode, navigation,
    product,
    searchText, setSearchText,
    activeCategory, setActiveCategory,
    showImagePickerOptions, setShowImagePickerOptions,
    photos, currentPhotoIndex, setCurrentPhotoIndex,
    name, setName,
    description, setDescription,
    price, setPrice,
    quantity, setQuantity,
    isEditingName, setIsEditingName,
    isEditingDesc, setIsEditingDesc,
    isEditingPrice, setIsEditingPrice,
    isEditingQty, setIsEditingQty,
    nameRef, descRef, priceRef, qtyRef,
    handleSelectPhoto, openCamera, openGallery, handleConfirm, removePhoto,
    labelColor, sepColor,
  };
}
