import React, { useState, useEffect, useRef } from 'react';
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

// Filter SVGs
import FiltroIcon from '../../assets/tela9/filtro/Filtro Icon.svg';
import FiltroText from '../../assets/tela9/filtro/Filtro.svg';
import CategoriaText from '../../assets/tela9/filtro/Categoria_.svg';
import RacaoText from '../../assets/tela9/filtro/Ração.svg';
import PescaText from '../../assets/tela9/filtro/Pesca.svg';
import SementesText from '../../assets/tela9/filtro/Sementes.svg';
import AduboText from '../../assets/tela9/filtro/Adubo ....svg';
import SeparadorFiltro from '../../assets/tela9/filtro/Separador.svg';

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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ProductEditScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const product = route.params?.product;

  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(product?.category_id || null);
  const [showImagePickerOptions, setShowImagePickerOptions] = useState(false);

  // Form states
  const [photoUri, setPhotoUri] = useState<string | null>(product?.image_url || null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product?.price?.toString() || '');
  const [quantity, setQuantity] = useState(product?.stock?.toString() || '');

  // Edit mode states
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [isEditingQty, setIsEditingQty] = useState(false);

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
      allowsEditing: false,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
      setPhotoBase64(result.assets[0].base64 || null);
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

    const updateData: any = {
      name,
      description,
      price: parseFloat(price.replace(',', '.')),
      stock: parseInt(quantity, 10),
      category_id: activeCategory,
    };

    if (photoBase64) {
      updateData.image_url = `data:image/jpeg;base64,${photoBase64}`;
    }

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

  return (
    <View style={styles.mainContainer}>
      <StatusBar backgroundColor="#1C2434" barStyle="light-content" />

      {/* Header with search bar */}
      <AdminHeader title="editar_produto" searchValue={searchText} onSearchChange={setSearchText} />

      {/* Filter Bar */}
      <View style={styles.filterContainer}>
        <View style={styles.filterBar}>
          <FiltroIcon width={14} height={14} />
          <FiltroText width={28} height={11} />
          <SeparadorFiltro width={1} height={22} />
          <CategoriaText width={58} height={13} />
          <TouchableOpacity 
            style={[styles.filterTag, activeCategory === 'Ração' && styles.filterTagActive]}
            onPress={() => setActiveCategory(activeCategory === 'Ração' ? null : 'Ração')}
          >
            <RacaoText width={36} height={13} />
          </TouchableOpacity>
          <SeparadorFiltro width={1} height={22} />
          <TouchableOpacity 
            style={[styles.filterTag, activeCategory === 'Pesca' && styles.filterTagActive]}
            onPress={() => setActiveCategory(activeCategory === 'Pesca' ? null : 'Pesca')}
          >
            <PescaText width={35} height={11} />
          </TouchableOpacity>
          <SeparadorFiltro width={1} height={22} />
          <TouchableOpacity 
            style={[styles.filterTag, activeCategory === 'Sementes' && styles.filterTagActive]}
            onPress={() => setActiveCategory(activeCategory === 'Sementes' ? null : 'Sementes')}
          >
            <SementesText width={56} height={11} />
          </TouchableOpacity>
          <SeparadorFiltro width={1} height={22} />
          <TouchableOpacity 
            style={[styles.filterTag, activeCategory === 'Adubo' && styles.filterTagActive]}
            onPress={() => setActiveCategory(activeCategory === 'Adubo' ? null : 'Adubo')}
          >
            <AduboText width={62} height={11} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          {/* Photo Section */}
          <View style={styles.photoSection}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.productPhoto} />
            ) : (
              <NoPhotoSvg width={310} height={220} />
            )}
            <TouchableOpacity style={styles.enviarFotoBtn} onPress={handleSelectPhoto}>
              <TrocarFotoSvg width={140} height={24} />
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.fieldsContainer}>
            {/* Nome */}
            <View style={styles.inputContainer}>
              <TextInput
                ref={nameRef}
                style={[styles.inputField, isEditingName && styles.inputFieldEditing]}
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
                <EditIconNome width={16} height={16} />
              </TouchableOpacity>
            </View>

            {/* Descrição */}
            <View style={styles.inputContainer}>
              <TextInput
                ref={descRef}
                style={[styles.inputField, styles.textArea, isEditingDesc && styles.inputFieldEditing]}
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
                <EditIconDesc width={16} height={16} />
              </TouchableOpacity>
            </View>

            {/* Preço (50% left), Empty (50% right) */}
            <View style={styles.row}>
              <View style={styles.smallInputWrapper}>
                <View style={styles.inputContainer}>
                  {price.length > 0 && (
                    <Text style={styles.currencyPrefix}>R$</Text>
                  )}
                  <TextInput
                    ref={priceRef}
                    style={[styles.inputField, price.length > 0 && { paddingLeft: 42 }, isEditingPrice && styles.inputFieldEditing]}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                    editable={isEditingPrice}
                    placeholder={isEditingPrice && price.length === 0 ? "0,00" : ""}
                    placeholderTextColor="#919191"
                  />
                  <TouchableOpacity 
                    style={styles.editIconRight} 
                    onPress={() => {
                      setIsEditingPrice(true);
                      setTimeout(() => priceRef.current?.focus(), 100);
                    }}
                  >
                    <EditIconPreco width={16} height={16} />
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
                    style={[styles.inputField, isEditingQty && styles.inputFieldEditing]}
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
                    <EditIconQtd width={16} height={16} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.smallInputWrapper}>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                  <FundoConfirmarSvg width="100%" height={50} style={{ position: 'absolute', borderRadius: 10 }} />
                  <ConfirmarSvg width="70%" height={20} style={{ zIndex: 1 }} />
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
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Trocar Foto do Produto</Text>
            
            <TouchableOpacity style={styles.modalOption} onPress={openCamera}>
              <Text style={styles.modalOptionText}>Tirar Foto</Text>
            </TouchableOpacity>
            
            <View style={styles.modalSeparator} />
            
            <TouchableOpacity style={styles.modalOption} onPress={openGallery}>
              <Text style={styles.modalOptionText}>Escolher da Galeria</Text>
            </TouchableOpacity>
            
            <View style={styles.modalSeparator} />
            
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
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3E4EB',
    borderRadius: 25,
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 6,
  },
  filterTag: {
    paddingHorizontal: 3,
    paddingVertical: 3,
    borderRadius: 4,
  },
  filterTagActive: {
    backgroundColor: 'rgba(249, 125, 1, 0.2)',
    borderRadius: 6,
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
