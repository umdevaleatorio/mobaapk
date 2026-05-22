import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Alert,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../../data/datasources/supabase/client';
import AdminHeader from '../../components/AdminHeader';
import { AdminUserMenu } from '../../components/AdminUserMenu';
import { Feather } from '@expo/vector-icons';

// Form SVGs
import NoPhotoSvg from '../../assets/tela8/No photo.svg';
import EnviarFotoSvg from '../../assets/tela8/Enviar foto.svg';
import FundoRegistrarSvg from '../../assets/tela8/formulario/registrar/Fundo.svg';
import RegistrarSvg from '../../assets/tela8/formulario/registrar/Registrar.svg';
import DigiteNomeSvg from '../../assets/tela8/formulario/nome produto/Digite o nome do produto....svg';
import DigiteDescricaoSvg from '../../assets/tela8/formulario/descricao/Digite a descrição do produto....svg';
import PrecoSvg from '../../assets/tela8/formulario/preco/Preço_ ....svg';
import QuantidadeSvg from '../../assets/tela8/formulario/quantidade/Quantidade_ ....svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ProductCreateScreen() {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<any>();
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showImagePickerOptions, setShowImagePickerOptions] = useState(false);

  // Form states
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setSearchText('');
      setActiveCategory(null);
      setPhotoUri(null);
      setPhotoBase64(null);
      setName('');
      setDescription('');
      setPrice('');
      setQuantity('');
    });
    return unsubscribe;
  }, [navigation]);

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
      allowsEditing: false, // Removed cropping requirement
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
      setPhotoBase64(result.assets[0].base64 || null);
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
      allowsEditing: false, // Removed cropping requirement
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
      setPhotoBase64(result.assets[0].base64 || null);
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

    const { error } = await supabase.from('products').insert([
      {
        name,
        description,
        price: parseFloat(price.replace(',', '.')),
        stock: parseInt(quantity, 10),
        active: true, // Default to active as requested
        image_url: photoBase64 ? `data:image/jpeg;base64,${photoBase64}` : null,
        category_id: activeCategory,
      }
    ]);

    if (error) {
      Alert.alert('Erro', 'Não foi possível registrar o produto.');
      console.error(error);
    } else {
      Alert.alert('Sucesso', 'Produto registrado com sucesso!', [
        { text: 'OK', onPress: () => navigation.navigate('Gerenciar') }
      ]);
    }
  };

  const labelColor = isDarkMode ? '#FFFFFF' : '#8A7268';
  const sepColor = isDarkMode ? 'rgba(255,255,255,0.2)' : '#8A7268';

  return (
    <View style={[styles.mainContainer, { backgroundColor: isDarkMode ? '#18181C' : '#F5F5F5' }]}>
      <StatusBar backgroundColor={colors.headerBackground} barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header with search bar */}
      <AdminHeader 
        title="registrar_produto" 
        searchValue={searchText} 
        onSearchChange={(text) => {
          setSearchText(text);
          navigation.navigate('Gerenciar', { searchText: text });
        }} 
      />

      {/* Filter Bar */}
      <View style={[styles.filterContainer, { backgroundColor: isDarkMode ? '#18181C' : '#F5F5F5' }]}>
        <View style={[styles.filterPill, { backgroundColor: isDarkMode ? '#2E2E38' : '#E3E4EB' }]}>
          {/* FiltroIcon + texto */}
          <View style={styles.filterBtn}>
            <Feather name="sliders" size={12} color={labelColor} />
            <Text style={[styles.filterBtnText, { color: labelColor }]}>Filtro</Text>
          </View>

          <View style={[styles.filterSep, { backgroundColor: sepColor }]} />

          <Text style={[styles.categoryLabelText, { color: labelColor }]}>Categoria</Text>

          <View style={[styles.filterSep, { backgroundColor: sepColor }]} />

          {/* Tags — com destaque no ativo */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesRow}
          >
            {['Ração', 'Pesca', 'Sementes', 'Adubo'].map((category) => {
              const isSelected = activeCategory === category;
              
              let tagBg = 'transparent';
              if (isSelected) {
                tagBg = '#5B86E5';
              }

              let tagTextColor = isDarkMode ? '#FFFFFF' : '#8A7268';
              if (isSelected) {
                tagTextColor = '#FFFFFF';
              }

              return (
                <TouchableOpacity
                  key={category}
                  onPress={() => {
                    setActiveCategory(category);
                    navigation.navigate('Gerenciar', { categories: [category] });
                  }}
                  activeOpacity={0.7}
                  style={[
                    styles.tagItem,
                    { backgroundColor: tagBg }
                  ]}
                >
                  <Text 
                    style={[
                      styles.tagText, 
                      { 
                        color: tagTextColor,
                        fontWeight: isSelected ? 'bold' : 'normal'
                      }
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.formCard, { backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF' }]}>
          {/* Photo Section */}
          <View style={styles.photoSection}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.productPhoto} />
            ) : (
              <NoPhotoSvg width={310} height={220} fill={isDarkMode ? '#FFFFFF' : undefined} stroke={isDarkMode ? '#FFFFFF' : undefined} />
            )}
            <TouchableOpacity style={styles.enviarFotoBtn} onPress={handleSelectPhoto}>
              {isDarkMode ? (
                <Text style={{ fontSize: 19, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', minWidth: 140 }}>
                  Enviar foto
                </Text>
              ) : (
                <EnviarFotoSvg width={140} height={24} />
              )}
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.fieldsContainer}>
            {/* Nome */}
            <View style={styles.inputContainer}>
              {name.length === 0 && (
                <DigiteNomeSvg width={200} height={14} style={styles.placeholderSvg} fill={isDarkMode ? '#919191' : undefined} stroke={isDarkMode ? '#919191' : undefined} />
              )}
              <TextInput
                style={[styles.inputField, { backgroundColor: isDarkMode ? '#1E1E24' : '#E3E4EB', color: isDarkMode ? '#919191' : colors.textDark }]}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Descrição */}
            <View style={styles.inputContainer}>
              {description.length === 0 && (
                <DigiteDescricaoSvg width={230} height={14} style={[styles.placeholderSvg, { top: 15 }]} fill={isDarkMode ? '#919191' : undefined} stroke={isDarkMode ? '#919191' : undefined} />
              )}
              <TextInput
                style={[styles.inputField, styles.textArea, { backgroundColor: isDarkMode ? '#1E1E24' : '#E3E4EB', color: isDarkMode ? '#919191' : colors.textDark }]}
                value={description}
                onChangeText={setDescription}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
            </View>

            {/* Price, Quantity, Register Row */}
            <View style={styles.row}>
              <View style={styles.smallInputWrapper}>
                <View style={styles.inputContainer}>
                  {price.length === 0 && (
                    <PrecoSvg width={70} height={14} style={styles.placeholderSvg} fill={isDarkMode ? '#919191' : undefined} stroke={isDarkMode ? '#919191' : undefined} />
                  )}
                  {price.length > 0 && (
                    <Text style={[styles.currencyPrefix, { color: isDarkMode ? '#919191' : colors.textDark }]}>R$</Text>
                  )}
                  <TextInput
                    style={[styles.inputField, { backgroundColor: isDarkMode ? '#1E1E24' : '#E3E4EB', color: isDarkMode ? '#919191' : colors.textDark }, price.length > 0 && { paddingLeft: 42 }]}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={styles.smallInputWrapper}>
                <View style={styles.inputContainer}>
                  {quantity.length === 0 && (
                    <QuantidadeSvg width={100} height={14} style={styles.placeholderSvg} fill={isDarkMode ? '#919191' : undefined} stroke={isDarkMode ? '#919191' : undefined} />
                  )}
                  <TextInput
                    style={[styles.inputField, { backgroundColor: isDarkMode ? '#1E1E24' : '#E3E4EB', color: isDarkMode ? '#919191' : colors.textDark }]}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>

            {/* Registrar Button */}
            <View style={styles.row}>
              <View style={styles.smallInputWrapper} />
              <View style={styles.smallInputWrapper}>
                <TouchableOpacity style={styles.registerBtn} onPress={handleRegister}>
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: '#339914', borderRadius: 10 }]} />
                  <RegistrarSvg width="100%" height={20} style={{ zIndex: 1 }} fill={isDarkMode ? '#FFFFFF' : undefined} />
                </TouchableOpacity>
              </View>
            </View>

          </View>
        </View>
      </ScrollView>

      {/* Custom Image Picker Modal */}
      <Modal
        visible={showImagePickerOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImagePickerOptions(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowImagePickerOptions(false)}
        >
          <View style={[styles.modalContainer, { backgroundColor: isDarkMode ? '#1E1E24' : '#FFFFFF' }]}>
            <Text style={[styles.modalTitle, { color: colors.textDark }]}>Adicionar Foto do Produto</Text>
            
            <TouchableOpacity style={styles.modalOption} onPress={openCamera}>
              <Text style={[styles.modalOptionText, { color: colors.textDark }]}>Tirar Foto</Text>
            </TouchableOpacity>
            
            <View style={[styles.modalSeparator, { backgroundColor: isDarkMode ? '#333333' : '#E3E4EB' }]} />
            
            <TouchableOpacity style={styles.modalOption} onPress={openGallery}>
              <Text style={[styles.modalOptionText, { color: colors.textDark }]}>Escolher da Galeria</Text>
            </TouchableOpacity>
            
            <View style={[styles.modalSeparator, { backgroundColor: isDarkMode ? '#333333' : '#E3E4EB' }]} />
            
            <TouchableOpacity 
              style={[styles.modalOption, { marginTop: 10 }]} 
              onPress={() => setShowImagePickerOptions(false)}
            >
              <Text style={[styles.modalOptionText, styles.modalCancelText]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
  // ===== FILTER =====
  filterContainer: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  filterPill: {
    flexDirection: 'row',
    borderRadius: 30,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 10,
    width: '95%',
    alignSelf: 'center',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterSep: {
    width: 1,
    height: 20,
    backgroundColor: '#8A7268',
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  categoryLabelText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 10,
  },
  tagItem: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
  },
  // ===== FORM =====
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 15,
    paddingBottom: 110,
    alignItems: 'center',
    flexGrow: 1,
  },
  formCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingVertical: 25,
    paddingHorizontal: 15,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  productPhoto: {
    width: 310,
    height: 220,
    borderRadius: 15,
    resizeMode: 'cover',
  },
  enviarFotoBtn: {
    marginTop: 25,
    padding: 10,
  },
  fieldsContainer: {
    width: '100%',
    gap: 15,
  },
  inputContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  placeholderSvg: {
    position: 'absolute',
    left: 15,
    zIndex: 1,
    pointerEvents: 'none',
  },
  currencyPrefix: {
    position: 'absolute',
    left: 15,
    zIndex: 2,
    fontSize: 14,
    color: '#1C2434',
    fontWeight: 'bold',
  },
  inputField: {
    backgroundColor: '#E3E4EB',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1C2434',
    minHeight: 45,
  },
  textArea: {
    height: 100,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  smallInputWrapper: {
    flex: 1,
  },
  registerBtn: {
    width: '100%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  // ===== MODAL IMAGE PICKER =====
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1E1E1E', // VSCode Dark background
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40, // Padding for safe area
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EAEAEA',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOption: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#D4D4D4',
    fontWeight: '500',
  },
  modalCancelText: {
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  modalSeparator: {
    height: 1,
    backgroundColor: '#333333',
    width: '100%',
  },
});
