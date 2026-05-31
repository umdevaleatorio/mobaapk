import React from 'react';
import {
  View,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Text,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { CatalogHeader, CatalogFilter } from '../../../components/CatalogHeader';
import CartBig from '../../../assets/tela5/carrinho/CartBig.svg';
import PlusIcon from '../../../assets/tela5/carrinho/PlusIcon.svg';
import HomeIcon from '../../../assets/tela5/barra/Home.svg';
import HomeIconDark from '../../../assets/tela5/barra/HomeDark.svg';
import MapIcon from '../../../assets/tela5/barra/Map.svg';
import MapIconDark from '../../../assets/tela5/barra/MapDark.svg';
import BarCartIcon from '../../../assets/tela5/barra/Cart.svg';
import BarCartIconDark from '../../../assets/tela5/barra/CartDark.svg';
import GearIcon from '../../../assets/tela5/barra/Gear.svg';
import GearIconDark from '../../../assets/tela5/barra/GearDark.svg';
import MenuLabel from '../../../assets/tela5/barra/MenuLabel.svg';
import MapaLabel from '../../../assets/tela5/barra/MapaLabel.svg';
import CarrinhoLabel from '../../../assets/tela5/barra/CarrinhoLabel.svg';
import OpcoesLabel from '../../../assets/tela5/barra/OpcoesLabel.svg';
import useProductDetailScreen from './useProductDetailScreen';
import { styles } from './ProductDetailScreen.styles';

export default function ProductDetailScreen() {
  const {
    colors,
    isDarkMode,
    navigation,
    product,
    stock,
    quantity,
    increment,
    decrement,
    handleAddToCart,
    relatedProducts,
    loadingRelated,
    photos,
    currentPhotoIndex,
    setCurrentPhotoIndex,
    dismissAlert,
    setDismissAlert,
    clientName,
    searchText,
    setSearchText,
    getFirstImageUrl,
    addToCart,
  } = useProductDetailScreen();

  if (!product) return null;

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.backgroundLight }]}>
      <StatusBar backgroundColor={colors.headerBackground} barStyle="light-content" />
      <CatalogHeader searchText={searchText} onSearchChange={setSearchText} />
      <CatalogFilter />
      <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={[styles.productCard, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.topRow}>
            <View style={[styles.photoWrapper, { backgroundColor: isDarkMode ? '#1E1E24' : '#FFFFFF', justifyContent: 'center', alignItems: 'center' }]}>
              {photos.length === 0 ? (
                <View style={[styles.photo, { backgroundColor: isDarkMode ? '#3A3A44' : '#d9d9d9', justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ color: isDarkMode ? '#888' : '#999', fontSize: 12 }}>Sem Foto</Text>
                </View>
              ) : (
                <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', height: '80%' }}>
                    <View style={{ width: 18, height: '70%', justifyContent: 'center', alignItems: 'center' }}>
                      {currentPhotoIndex > 0 ? (
                        <TouchableOpacity activeOpacity={0.7} onPress={() => setCurrentPhotoIndex(currentPhotoIndex - 1)}>
                          <Image source={{ uri: photos[currentPhotoIndex - 1] }} style={{ width: 12, height: '100%', borderRadius: 4, opacity: 0.3, resizeMode: 'cover' }} />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    <View style={{ flex: 1, height: '100%', marginHorizontal: 4, borderRadius: 8, overflow: 'hidden' }}>
                      <Image source={{ uri: photos[currentPhotoIndex] }} style={{ width: '100%', height: '100%', resizeMode: 'contain' }} />
                    </View>
                    <View style={{ width: 18, height: '70%', justifyContent: 'center', alignItems: 'center' }}>
                      {currentPhotoIndex < photos.length - 1 ? (
                        <TouchableOpacity activeOpacity={0.7} onPress={() => setCurrentPhotoIndex(currentPhotoIndex + 1)}>
                          <Image source={{ uri: photos[currentPhotoIndex + 1] }} style={{ width: 12, height: '100%', borderRadius: 4, opacity: 0.3, resizeMode: 'cover' }} />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                  {photos.length > 1 && (
                    <View style={{ flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, width: 80, height: 22, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, marginTop: 4 }}>
                      <TouchableOpacity onPress={() => setCurrentPhotoIndex(prev => Math.max(0, prev - 1))} disabled={currentPhotoIndex === 0} style={{ opacity: currentPhotoIndex === 0 ? 0.3 : 1 }}>
                        <Feather name="chevron-left" size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                      <View style={{ width: 1, height: 10, backgroundColor: 'rgba(255,255,255,0.3)' }} />
                      <TouchableOpacity onPress={() => setCurrentPhotoIndex(prev => Math.min(photos.length - 1, prev + 1))} disabled={currentPhotoIndex === photos.length - 1} style={{ opacity: currentPhotoIndex === photos.length - 1 ? 0.3 : 1 }}>
                        <Feather name="chevron-right" size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>
            <View style={styles.infoColumn}>
              <View style={{ flex: 1, justifyContent: 'flex-start' }}>
                <Text style={[styles.productTitle, { color: colors.textDark }]}>{product.name}</Text>
                {product.description ? (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 13, color: colors.textDark, marginBottom: 2 }}>Descrição do produto:</Text>
                    <Text style={[styles.productSubtitle, { color: colors.textDark }]}>{product.description}</Text>
                  </View>
                ) : (
                  <Text style={[styles.infoEmbalagem, { color: colors.textDark }]}>Informações{'\n'}na{'\n'}Embalagem</Text>
                )}
              </View>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: stock < 10 ? '#A72424' : (isDarkMode ? '#919191' : '#042A7D'), marginTop: 8, textAlign: 'left', paddingLeft: 4 }}>
                {stock < 10 ? `Estoque: ${stock} unidades!!!` : `Estoque: ${stock} unidades`}
              </Text>
            </View>
          </View>
          {stock < 10 && !dismissAlert && (
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderRadius: 10, backgroundColor: isDarkMode ? '#2C1D1E' : '#FFF0F0', borderColor: '#FF3B30', marginTop: 10, marginBottom: 10, position: 'relative' }}>
              <Feather name="alert-circle" size={16} color="#FF3B30" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: isDarkMode ? '#FF8A8A' : '#D32F2F', flexShrink: 1, lineHeight: 18, paddingRight: 20 }}>
                Atenção: Últimas unidades. Aproveite este produto, caro {clientName ? clientName : 'Cliente'}.
              </Text>
              <TouchableOpacity onPress={() => setDismissAlert(true)} style={{ position: 'absolute', right: 12, top: 12, padding: 2 }}>
                <Feather name="x" size={16} color={isDarkMode ? '#FF8A8A' : '#D32F2F'} />
              </TouchableOpacity>
            </View>
          )}
          <Text style={[styles.precoText, { color: colors.textDark }]}>R$ {product.price?.toFixed(2)} Un.</Text>
          <View style={styles.cartSection}>
            <View style={styles.quantityBar}>
              <View style={{ width: 65 }} />
              <Text style={styles.quantityLabel}>Quantidade:</Text>
              <View style={styles.quantitySep} />
              <View style={styles.quantityControls}>
                <TouchableOpacity style={styles.btnMinus} onPress={decrement}>
                  <View style={styles.minusLine} />
                </TouchableOpacity>
                <View style={styles.quantityNum}>
                  <Text style={styles.quantityNumText}>{quantity}</Text>
                </View>
                <TouchableOpacity style={styles.btnPlus} onPress={increment}>
                  <View style={styles.plusLineH} />
                  <View style={styles.plusLineV} />
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={styles.cartBigBtn} onPress={handleAddToCart} activeOpacity={0.7}>
              <CartBig width={42} height={42} />
              <View style={styles.cartPlusBadge}>
                <PlusIcon width={13} height={13} />
              </View>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={[styles.relatedTitle, { color: colors.textDark }]}>Produtos Relacionados:</Text>
        {loadingRelated ? (
          <ActivityIndicator size="small" color={colors.primaryDark} style={{ marginVertical: 20 }} />
        ) : relatedProducts.length === 0 ? (
          <Text style={[styles.noRelatedText, { color: colors.textDark }]}>No momento, não há nenhum produto relacionado à {product.name}</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedScroll}>
            {relatedProducts.map((relProduct) => (
              <TouchableOpacity key={relProduct.id} onPress={() => navigation.replace('ProductDetail', { product: relProduct })} activeOpacity={0.7} style={[styles.relatedCard, { backgroundColor: colors.cardBackground }]}>
                <View style={[styles.relatedPhotoBox, { backgroundColor: isDarkMode ? '#1E1E24' : '#FFFFFF' }]}>
                  {relProduct.image_url ? (
                    <Image source={{ uri: getFirstImageUrl(relProduct.image_url) || '' }} style={styles.relatedPhoto} resizeMode="contain" />
                  ) : (
                    <View style={styles.relatedPhotoPlaceholder}>
                      <Text style={{ fontSize: 40 }}>📦</Text>
                    </View>
                  )}
                </View>
                <View style={styles.relatedInfoRow}>
                  <TouchableOpacity style={[styles.relatedCartCircle, { backgroundColor: isDarkMode ? '#FFFFFF' : '#E3DAD9' }]} onPress={() => addToCart(relProduct)} activeOpacity={0.7}>
                    <MaterialIcons name="shopping-cart" size={16} color={isDarkMode ? '#5B86E5' : '#042A7D'} />
                  </TouchableOpacity>
                  <View style={styles.relatedTexts}>
                    <Text style={[styles.relatedName, { color: colors.textDark }]} numberOfLines={1}>{relProduct.name}</Text>
                    <Text style={[styles.relatedPrice, { color: colors.textDark }]}>R$ {relProduct.price?.toFixed(2)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </ScrollView>
      <View style={styles.bottomBarOuter}>
        <View style={[styles.bottomBarInner, { backgroundColor: isDarkMode ? '#000000' : colors.cardBackground }]}>
          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Menu' })}>
            <View style={isDarkMode ? { width: 51, height: 41, borderRadius: 15, alignItems: 'center', justifyContent: 'center' } : styles.iconBg}>
              {isDarkMode ? <HomeIconDark width={32} height={32} fill="#FFFFFF" stroke="#FFFFFF" /> : <HomeIcon width={32} height={32} />}
            </View>
            {isDarkMode ? <MenuLabel width={33} height={9} fill="#FFFFFF" stroke="#FFFFFF" /> : <MenuLabel width={33} height={9} />}
          </TouchableOpacity>
          <View style={[styles.tabSep, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.4)' : '#8A7268' }]} />
          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Mapa' })}>
            <View style={isDarkMode ? { width: 51, height: 41, borderRadius: 15, alignItems: 'center', justifyContent: 'center' } : styles.iconBg}>
              {isDarkMode ? <MapIconDark width={32} height={32} fill="#FFFFFF" stroke="#FFFFFF" /> : <MapIcon width={32} height={32} />}
            </View>
            {isDarkMode ? <MapaLabel width={32} height={12} fill="#FFFFFF" stroke="#FFFFFF" /> : <MapaLabel width={32} height={12} />}
          </TouchableOpacity>
          <View style={[styles.tabSep, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.4)' : '#8A7268' }]} />
          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Carrinho' })}>
            <View style={isDarkMode ? { width: 51, height: 41, borderRadius: 15, alignItems: 'center', justifyContent: 'center' } : styles.iconBg}>
              {isDarkMode ? <BarCartIconDark width={32} height={32} fill="#FFFFFF" stroke="#FFFFFF" /> : <BarCartIcon width={32} height={32} />}
            </View>
            {isDarkMode ? <CarrinhoLabel width={52} height={10} fill="#FFFFFF" stroke="#FFFFFF" /> : <CarrinhoLabel width={52} height={10} />}
          </TouchableOpacity>
          <View style={[styles.tabSep, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.4)' : '#8A7268' }]} />
          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Opções' })}>
            <View style={isDarkMode ? { width: 51, height: 41, borderRadius: 15, alignItems: 'center', justifyContent: 'center' } : styles.iconBg}>
              {isDarkMode ? <GearIconDark width={32} height={32} fill="#FFFFFF" stroke="#FFFFFF" /> : <GearIcon width={32} height={32} />}
            </View>
            {isDarkMode ? <OpcoesLabel width={42} height={12} fill="#FFFFFF" stroke="#FFFFFF" /> : <OpcoesLabel width={42} height={12} />}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
