import React from 'react';
import {
  View, Text, Dimensions, StatusBar, TouchableOpacity, ScrollView, TextInput, Image, Modal, StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AdminHeader from '../../../components/AdminHeader';
import { AdminUserMenu } from '../../../components/AdminUserMenu';
import NoPhotoSvg from '../../../assets/tela8/No photo.svg';
import EnviarFotoSvg from '../../../assets/tela8/Enviar foto.svg';
import FundoRegistrarSvg from '../../../assets/tela8/formulario/registrar/Fundo.svg';
import RegistrarSvg from '../../../assets/tela8/formulario/registrar/Registrar.svg';
import DigiteNomeSvg from '../../../assets/tela8/formulario/nome produto/Digite o nome do produto....svg';
import DigiteDescricaoSvg from '../../../assets/tela8/formulario/descricao/Digite a descrição do produto....svg';
import PrecoSvg from '../../../assets/tela8/formulario/preco/Preço_ ....svg';
import QuantidadeSvg from '../../../assets/tela8/formulario/quantidade/Quantidade_ ....svg';
import { useProductCreateScreen } from './useProductCreateScreen';
import { styles } from './styles';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CATEGORIES = ['Ração', 'Pesca', 'Sementes', 'Adubo'];

export default function ProductCreateScreen() {
  const h = useProductCreateScreen();

  const renderTag = (category: string) => {
    const isSelected = h.activeCategory === category;
    return (
      <TouchableOpacity
        key={category}
        onPress={() => { h.setActiveCategory(category); h.navigation.navigate('Gerenciar', { categories: [category] }); }}
        activeOpacity={0.7}
        style={[styles.tagItem, { backgroundColor: isSelected ? '#5B86E5' : 'transparent' }]}
      >
        <Text style={[styles.tagText, { color: isSelected ? '#FFFFFF' : h.labelColor, fontWeight: isSelected ? 'bold' : 'normal' }]}>{category}</Text>
      </TouchableOpacity>
    );
  };

  const renderNoPhoto = () => (
    <View style={{ alignItems: 'center' }}>
      <NoPhotoSvg width={310} height={220} />
      <TouchableOpacity testID="enviar-foto-btn" style={styles.enviarFotoBtn} onPress={h.handleSelectPhoto}>
        {h.isDarkMode ? (
          <Text style={{ fontSize: 19, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', minWidth: 140 }}>Enviar foto</Text>
        ) : (
          <EnviarFotoSvg width={140} height={24} />
        )}
      </TouchableOpacity>
    </View>
  );

  const renderPhotoCarousel = () => (
    <View style={{ alignItems: 'center', width: '100%' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', height: 220 }}>
        <View style={{ width: 45, height: 160, justifyContent: 'center', alignItems: 'center' }}>
          {h.currentPhotoIndex > 0 ? (
            <TouchableOpacity activeOpacity={0.7} onPress={() => h.setCurrentPhotoIndex(h.currentPhotoIndex - 1)}>
              <Image source={{ uri: h.photos[h.currentPhotoIndex - 1].uri }} style={{ width: 35, height: 140, borderRadius: 8, opacity: 0.3, resizeMode: 'cover' }} />
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={{ width: 220, height: 220, borderRadius: 15, overflow: 'hidden', marginHorizontal: 8, backgroundColor: h.isDarkMode ? '#1E1E24' : '#FFFFFF' }}>
          <Image source={{ uri: h.photos[h.currentPhotoIndex].uri }} style={[styles.productPhoto, { width: '100%', height: '100%' }]} />
        </View>
        <View style={{ width: 45, height: 160, justifyContent: 'center', alignItems: 'center' }}>
          {h.currentPhotoIndex < h.photos.length - 1 ? (
            <TouchableOpacity activeOpacity={0.7} onPress={() => h.setCurrentPhotoIndex(h.currentPhotoIndex + 1)}>
              <Image source={{ uri: h.photos[h.currentPhotoIndex + 1].uri }} style={{ width: 35, height: 140, borderRadius: 8, opacity: 0.3, resizeMode: 'cover' }} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      {h.photos.length > 1 && (
        <View style={{ flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 15, width: 120, height: 30, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, marginTop: 15 }}>
          <TouchableOpacity onPress={() => h.setCurrentPhotoIndex(Math.max(0, h.currentPhotoIndex - 1))} disabled={h.currentPhotoIndex === 0} style={{ opacity: h.currentPhotoIndex === 0 ? 0.3 : 1 }}>
            <Feather name="chevron-left" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={{ width: 1, height: 14, backgroundColor: 'rgba(255,255,255,0.3)' }} />
          <TouchableOpacity onPress={() => h.setCurrentPhotoIndex(Math.min(h.photos.length - 1, h.currentPhotoIndex + 1))} disabled={h.currentPhotoIndex === h.photos.length - 1} style={{ opacity: h.currentPhotoIndex === h.photos.length - 1 ? 0.3 : 1 }}>
            <Feather name="chevron-right" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
      <View style={{ flexDirection: 'row', gap: 10, marginTop: 15, width: '90%', justifyContent: 'center' }}>
        {h.photos.length < 5 && (
          <TouchableOpacity style={{ flex: 1, backgroundColor: '#339914', paddingVertical: 8, borderRadius: 8, alignItems: 'center' }} onPress={h.handleSelectPhoto}>
            <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>Adicionar foto</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={{ flex: 1, backgroundColor: '#FF3B30', paddingVertical: 8, borderRadius: 8, alignItems: 'center' }} onPress={h.removePhoto}>
          <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>Remover atual</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderInput = (testID: string, value: string, onChange: (v: string) => void, svg: any, opts?: { area?: boolean; numeric?: boolean; prefix?: boolean; }) => (
    <View style={styles.inputContainer}>
      {value.length === 0 && React.cloneElement(svg, { width: opts?.prefix ? 70 : (opts?.area ? 230 : 200), height: 14, style: [styles.placeholderSvg, opts?.area ? { top: 15 } : undefined] })}
      {opts?.prefix && value.length > 0 && <Text style={[styles.currencyPrefix, { color: h.isDarkMode ? '#919191' : h.colors.textDark }]}>R$</Text>}
      <TextInput
        testID={testID}
        style={[styles.inputField, opts?.area ? styles.textArea : undefined, { backgroundColor: h.isDarkMode ? '#1E1E24' : '#E3E4EB', color: h.isDarkMode ? '#919191' : h.colors.textDark }, opts?.prefix && value.length > 0 ? { paddingLeft: 42 } : undefined]}
        value={value}
        onChangeText={onChange}
        multiline={opts?.area}
        maxLength={opts?.area ? 500 : undefined}
        textAlignVertical={opts?.area ? 'top' : undefined}
        keyboardType={opts?.numeric ? 'numeric' : undefined}
      />
    </View>
  );

  return (
    <View style={[styles.mainContainer, { backgroundColor: h.isDarkMode ? '#18181C' : '#F5F5F5' }]}>
      <StatusBar backgroundColor={h.colors.headerBackground} barStyle={h.isDarkMode ? 'light-content' : 'dark-content'} />
      <AdminHeader title="registrar_produto" searchValue={h.searchText} onSearchChange={(text) => { h.setSearchText(text); h.navigation.navigate('Gerenciar', { searchText: text }); }} />
      <View style={[styles.filterContainer, { backgroundColor: h.isDarkMode ? '#18181C' : '#F5F5F5' }]}>
        <View style={[styles.filterPill, { backgroundColor: h.isDarkMode ? '#2E2E38' : '#E3E4EB' }]}>
          <View style={styles.filterBtn}>
            <Feather name="sliders" size={12} color={h.labelColor} />
            <Text style={[styles.filterBtnText, { color: h.labelColor }]}>Filtro</Text>
          </View>
          <View style={[styles.filterSep, { backgroundColor: h.sepColor }]} />
          <Text style={[styles.categoryLabelText, { color: h.labelColor }]}>Categoria</Text>
          <View style={[styles.filterSep, { backgroundColor: h.sepColor }]} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
            {CATEGORIES.map(renderTag)}
          </ScrollView>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.formCard, { backgroundColor: h.isDarkMode ? '#2E2E38' : '#FFFFFF' }]}>
          <View style={styles.photoSection}>
            {h.photos.length === 0 ? renderNoPhoto() : renderPhotoCarousel()}
          </View>
          <View style={styles.fieldsContainer}>
            {renderInput('product-name-input', h.name, h.setName, <DigiteNomeSvg />)}
            {renderInput('product-description-input', h.description, h.setDescription, <DigiteDescricaoSvg />, { area: true })}
            <View style={styles.row}>
              <View style={styles.smallInputWrapper}>
                {renderInput('product-price-input', h.price, h.setPrice, <PrecoSvg />, { prefix: true, numeric: true })}
              </View>
              <View style={styles.smallInputWrapper}>
                {renderInput('product-quantity-input', h.quantity, h.setQuantity, <QuantidadeSvg />, { numeric: true })}
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.smallInputWrapper} />
              <View style={styles.smallInputWrapper}>
                <TouchableOpacity testID="register-product-btn" style={styles.registerBtn} onPress={h.handleRegister}>
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: '#339914', borderRadius: 10 }]} />
                  <RegistrarSvg width="100%" height={20} style={{ zIndex: 1 }} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      <Modal visible={h.showImagePickerOptions} transparent animationType="fade" onRequestClose={() => h.setShowImagePickerOptions(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => h.setShowImagePickerOptions(false)}>
          <View style={[styles.modalContainer, { backgroundColor: h.isDarkMode ? '#1E1E24' : '#FFFFFF' }]}>
            <Text style={[styles.modalTitle, { color: h.colors.textDark }]}>Adicionar Foto do Produto</Text>
            <TouchableOpacity style={styles.modalOption} onPress={h.openCamera}>
              <Text style={[styles.modalOptionText, { color: h.colors.textDark }]}>Tirar Foto</Text>
            </TouchableOpacity>
            <View style={[styles.modalSeparator, { backgroundColor: h.isDarkMode ? '#333333' : '#E3E4EB' }]} />
            <TouchableOpacity style={styles.modalOption} onPress={h.openGallery}>
              <Text style={[styles.modalOptionText, { color: h.colors.textDark }]}>Escolher da Galeria</Text>
            </TouchableOpacity>
            <View style={[styles.modalSeparator, { backgroundColor: h.isDarkMode ? '#333333' : '#E3E4EB' }]} />
            <TouchableOpacity style={[styles.modalOption, { marginTop: 10 }]} onPress={() => h.setShowImagePickerOptions(false)}>
              <Text style={[styles.modalOptionText, styles.modalCancelText]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      <AdminUserMenu />
    </View>
  );
}
