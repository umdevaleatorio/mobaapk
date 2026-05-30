import React, { useState, useEffect, useRef } from 'react';
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../../data/datasources/supabase/client';
import AdminHeader from '../../components/AdminHeader';
import { AdminUserMenu } from '../../components/AdminUserMenu';
import { Feather } from '@expo/vector-icons';

// Form SVGs
import NoPhotoSvg from '../../assets/tela8/No photo.svg'; // Reuse placeholder if no photo
import TrocarFotoSvg from '../../assets/tela9/formulario/Trocar foto.svg';
import ConfirmarSvg from '../../assets/tela9/formulario/confirmar/Confirmar.svg';
import FundoConfirmarSvg from '../../assets/tela9/formulario/confirmar/Fundo.svg';

// Edit Icons
import EditIconNome from '../../assets/tela9/formulario/nome produto/Edit.svg';
import EditIconDesc from '../../assets/tela9/formulario/descricao/Edit.svg';
import EditIconPreco from '../../assets/tela9/formulario/preco/Edit.svg';
import EditIconQtd from '../../assets/tela9/formulario/quantidade/Edit.svg';

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

export default function ProductEditScreen() {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const product = route.params?.product;

  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(product?.category_id || null);
  const [showImagePickerOptions, setShowImagePickerOptions] = useState(false);

  // Form states
  const [photos, setPhotos] = useState<Array<{ uri: string; base64?: string | null }>>(() => {
    const loadedUrls = getAllImageUrls(product?.image_url);
    return loadedUrls.map(u => ({ uri: u, base64: null }));
  });
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [quantity, setQuantity] = useState(product?.stock?.toString() || '');

  // Edit mode states
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [isEditingQty, setIsEditingQty] = useState(false);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setSearchText('');
      setActiveCategory(product?.category_id || null);
      
      const loadedUrls = getAllImageUrls(product?.image_url);
      setPhotos(loadedUrls.map(u => ({ uri: u, base64: null })));
      setCurrentPhotoIndex(0);

      setName(product?.name || '');
      setDescription(product?.description || '');
      setPrice(product?.price?.toString() || '');
      setQuantity(product?.stock?.toString() || '');
      setIsEditingName(false);
      setIsEditingDesc(false);
      setIsEditingPrice(false);
      setIsEditingQty(false);
    });
    return unsubscribe;
  }, [navigation, product]);

  // Refs to focus inputs
  const nameRef = useRef<TextInput>(null);
  const descRef = useRef<TextInput>(null);
  const priceRef = useRef<TextInput>(null);
  const qtyRef = useRef<TextInput>(null);

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
      name,
      description,
      price: parseFloat(price.replace(',', '.')),
      stock: parseInt(quantity, 10),
      category_id: activeCategory,
      image_url: mappedImages.length > 0 ? JSON.stringify(mappedImages) : null,
    };

    const { error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', product.id);

    if (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o produto.');
      console.error(error);
    } else {
      Alert.alert('Sucesso', 'Produto atualizado com sucesso!', [
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
        title="editar_produto" 
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
        <View style={[styles.formCard, { backgroundColor: isDarkMode ? '#2E2E38' : '#E3E4EB' }]}>
          {/* Photo Section */}
          <View style={styles.photoSection}>
            {photos.length === 0 ? (
              <View style={{ alignItems: 'center' }}>
                <NoPhotoSvg width={310} height={220} fill={isDarkMode ? '#FFFFFF' : undefined} stroke={isDarkMode ? '#FFFFFF' : undefined} />
                <TouchableOpacity style={styles.enviarFotoBtn} onPress={handleSelectPhoto}>
                  {isDarkMode ? (
                    <Text style={{ fontSize: 19, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', minWidth: 140 }}>
                      Trocar foto
                    </Text>
                  ) : (
                    <TrocarFotoSvg width={140} height={24} />
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ alignItems: 'center', width: '100%' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', height: 220 }}>
                  {/* Left adjacent preview */}
                  <View style={{ width: 45, height: 160, justifyContent: 'center', alignItems: 'center' }}>
                    {currentPhotoIndex > 0 ? (
                      <TouchableOpacity activeOpacity={0.7} onPress={() => setCurrentPhotoIndex(currentPhotoIndex - 1)}>
                        <Image 
                          source={{ uri: photos[currentPhotoIndex - 1].uri }} 
                          style={{ width: 35, height: 140, borderRadius: 8, opacity: 0.3, resizeMode: 'cover' }} 
                        />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {/* Main Active Photo */}
                  <View style={{ width: 220, height: 220, borderRadius: 15, overflow: 'hidden', marginHorizontal: 8, backgroundColor: isDarkMode ? '#1E1E24' : '#FFFFFF' }}>
                    <Image source={{ uri: photos[currentPhotoIndex].uri }} style={[styles.productPhoto, { width: '100%', height: '100%' }]} />
                  </View>

                  {/* Right adjacent preview */}
                  <View style={{ width: 45, height: 160, justifyContent: 'center', alignItems: 'center' }}>
                    {currentPhotoIndex < photos.length - 1 ? (
                      <TouchableOpacity activeOpacity={0.7} onPress={() => setCurrentPhotoIndex(currentPhotoIndex + 1)}>
                        <Image 
                          source={{ uri: photos[currentPhotoIndex + 1].uri }} 
                          style={{ width: 35, height: 140, borderRadius: 8, opacity: 0.3, resizeMode: 'cover' }} 
                        />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>

                {/* Wide and low-height chevron control pill */}
                {photos.length > 1 && (
                  <View style={{ 
                    flexDirection: 'row', 
                    backgroundColor: 'rgba(0,0,0,0.6)', 
                    borderRadius: 15, 
                    width: 120, 
                    height: 30, 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    paddingHorizontal: 12,
                    marginTop: 15 
                  }}>
                    <TouchableOpacity 
                      onPress={() => setCurrentPhotoIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentPhotoIndex === 0}
                      style={{ opacity: currentPhotoIndex === 0 ? 0.3 : 1 }}
                    >
                      <Feather name="chevron-left" size={20} color="#FFFFFF" />
                    </TouchableOpacity>

                    <View style={{ width: 1, height: 14, backgroundColor: 'rgba(255,255,255,0.3)' }} />

                    <TouchableOpacity 
                      onPress={() => setCurrentPhotoIndex(prev => Math.min(photos.length - 1, prev + 1))}
                      disabled={currentPhotoIndex === photos.length - 1}
                      style={{ opacity: currentPhotoIndex === photos.length - 1 ? 0.3 : 1 }}
                    >
                      <Feather name="chevron-right" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                )}

                {/* Sub-photo action buttons row */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 15, width: '90%', justifyContent: 'center' }}>
                  {photos.length < 5 && (
                    <TouchableOpacity 
                      style={{ 
                        flex: 1, 
                        backgroundColor: '#339914', 
                        paddingVertical: 8, 
                        borderRadius: 8, 
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onPress={handleSelectPhoto}
                    >
                      <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>Adicionar foto</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={{ 
                      flex: 1, 
                      backgroundColor: '#FF3B30', 
                      paddingVertical: 8, 
                      borderRadius: 8, 
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onPress={() => {
                      const newPhotos = [...photos];
                      newPhotos.splice(currentPhotoIndex, 1);
                      setPhotos(newPhotos);
                      setCurrentPhotoIndex(prev => Math.max(0, prev - 1));
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>Remover atual</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Form Fields */}
          <View style={styles.fieldsContainer}>
            {/* Nome */}
            <View style={styles.inputContainer}>
              <TextInput
                ref={nameRef}
                testID="product-name-input"
                style={[styles.inputField, { backgroundColor: isDarkMode ? '#1E1E24' : '#FFFFFF', color: colors.textDark }, isEditingName && styles.inputFieldEditing]}
                value={name}
                onChangeText={setName}
                editable={isEditingName}
                placeholder={isEditingName ? "Digite o nome..." : ""}
                placeholderTextColor="#919191"
              />
              <TouchableOpacity 
                style={styles.editIconRight} 
                onPress={() => {
                  setIsEditingName(true);
                  setTimeout(() => nameRef.current?.focus(), 100);
                }}
              >
                <EditIconNome width={16} height={16} fill={isDarkMode ? '#FFE082' : '#042A7D'} color={isDarkMode ? '#FFE082' : '#042A7D'} />
              </TouchableOpacity>
            </View>

            {/* Descrição */}
            <View style={styles.inputContainer}>
              <TextInput
                ref={descRef}
                style={[styles.inputField, styles.textArea, { backgroundColor: isDarkMode ? '#1E1E24' : '#FFFFFF', color: colors.textDark }, isEditingDesc && styles.inputFieldEditing]}
                value={description}
                onChangeText={setDescription}
                multiline
                maxLength={500}
                textAlignVertical="top"
                editable={isEditingDesc}
                placeholder={isEditingDesc ? "Digite a descrição..." : ""}
                placeholderTextColor="#919191"
              />
              <TouchableOpacity 
                style={styles.editIconBottomRight} 
                onPress={() => {
                  setIsEditingDesc(true);
                  setTimeout(() => descRef.current?.focus(), 100);
                }}
              >
                <EditIconDesc width={16} height={16} fill={isDarkMode ? '#FFE082' : '#042A7D'} color={isDarkMode ? '#FFE082' : '#042A7D'} />
              </TouchableOpacity>
            </View>

            {/* Preço (50% left), Empty (50% right) */}
            <View style={styles.row}>
              <View style={styles.smallInputWrapper}>
                <View style={styles.inputContainer}>
                  {price.length > 0 && (
                    <Text style={[styles.currencyPrefix, { color: colors.textDark }]}>R$</Text>
                  )}
                  <TextInput
                    ref={priceRef}
                    testID="product-price-input"
                    style={[styles.inputField, { backgroundColor: isDarkMode ? '#1E1E24' : '#FFFFFF', color: colors.textDark }, price.length > 0 && { paddingLeft: 42 }, isEditingPrice && styles.inputFieldEditing]}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                    editable={isEditingPrice}
                    placeholder={isEditingPrice && price.length === 0 ? "0,00" : ""}
                    placeholderTextColor="#919191"
                  />
                  <TouchableOpacity 
                    style={styles.editIconRight} 
                    testID="edit-price-btn"
                    onPress={() => {
                      setIsEditingPrice(true);
                      setTimeout(() => priceRef.current?.focus(), 100);
                    }}
                  >
                    <EditIconPreco width={16} height={16} fill={isDarkMode ? '#FFE082' : '#042A7D'} color={isDarkMode ? '#FFE082' : '#042A7D'} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.smallInputWrapper} />
            </View>

            {/* Quantidade (50% left), Confirmar (50% right) */}
            <View style={styles.row}>
              <View style={styles.smallInputWrapper}>
                <View style={styles.inputContainer}>
                  <TextInput
                    ref={qtyRef}
                    testID="product-quantity-input"
                    style={[styles.inputField, { backgroundColor: isDarkMode ? '#1E1E24' : '#FFFFFF', color: colors.textDark }, isEditingQty && styles.inputFieldEditing]}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                    editable={isEditingQty}
                    placeholder={isEditingQty ? "0" : ""}
                    placeholderTextColor="#919191"
                  />
                  <TouchableOpacity 
                    style={styles.editIconRight} 
                    onPress={() => {
                      setIsEditingQty(true);
                      setTimeout(() => qtyRef.current?.focus(), 100);
                    }}
                  >
                    <EditIconQtd width={16} height={16} fill={isDarkMode ? '#FFE082' : '#042A7D'} color={isDarkMode ? '#FFE082' : '#042A7D'} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.smallInputWrapper}>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} testID="save-product-btn">
                  <FundoConfirmarSvg width="100%" height={50} style={{ position: 'absolute', borderRadius: 10 }} />
                  <ConfirmarSvg width="70%" height={20} style={{ zIndex: 1 }} fill={isDarkMode ? '#FFFFFF' : undefined} />
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
            <Text style={[styles.modalTitle, { color: colors.textDark }]}>Trocar Foto do Produto</Text>
            
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
    backgroundColor: '#E3E4EB', // Reversed from Tela 8
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
  currencyPrefix: {
    position: 'absolute',
    left: 15,
    zIndex: 2,
    fontSize: 14,
    color: '#1C2434',
    fontWeight: 'bold',
  },
  inputField: {
    backgroundColor: '#FFFFFF', // Reversed from Tela 8
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    paddingRight: 40, // space for edit icon
    fontSize: 14,
    color: '#1C2434',
    minHeight: 45,
  },
  inputFieldEditing: {
    borderWidth: 1,
    borderColor: '#339914',
  },
  textArea: {
    height: 100,
    paddingRight: 15, // Icon is bottom-right, so top-right doesn't need padding
  },
  editIconRight: {
    position: 'absolute',
    right: 15,
    zIndex: 3,
  },
  editIconBottomRight: {
    position: 'absolute',
    right: 15,
    bottom: 15,
    zIndex: 3,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  smallInputWrapper: {
    flex: 1,
  },
  confirmBtn: {
    width: '100%',
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
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
