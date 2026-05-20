import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  Text,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Colors from '../../theme/colors';
import { useTheme } from '../../contexts/ThemeContext';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../../../data/datasources/supabase/client';

import { CartContext } from '../../contexts/CartContext';
import { CatalogHeader, CatalogFilter } from '../../components/CatalogHeader';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useFilter, isProductInCategories } from '../../contexts/FilterContext';

// === PRODUTO SVGs ===
// AddCartIcon substituído por Feather
import VerItemSvg from '../../assets/tela4/produto/VerItem.svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;
const PHOTO_WIDTH = CARD_WIDTH - 20;
const PHOTO_HEIGHT = (PHOTO_WIDTH * 120) / 129;

export default function HomeScreen() {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<any>();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { searchText, setSearchText, selectedCategories } = useFilter();
  const { addToCart } = useContext(CartContext);

  const [esgotadoAlert, setEsgotadoAlert] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (!error) setProducts(data || []);
    setLoading(false);
  };

  const checkRecentEsgotados = async () => {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('products')
        .select('id, name, updated_at')
        .eq('active', false)
        .gte('updated_at', oneDayAgo);
        
      if (error || !data || data.length === 0) return;
      
      const seenRaw = await SecureStore.getItemAsync('seen_esgotados');
      const seenList: string[] = seenRaw ? JSON.parse(seenRaw) : [];
      
      const unseen = data.find(p => !seenList.includes(p.id));
      if (unseen) {
        setEsgotadoAlert(unseen.name);
        seenList.push(unseen.id);
        await SecureStore.setItemAsync('seen_esgotados', JSON.stringify(seenList));
      }
    } catch (e) {
      console.log('Erro ao verificar esgotados:', e);
    }
  };

  useEffect(() => {
    fetchProducts();
    checkRecentEsgotados();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = isProductInCategories(p.name, selectedCategories);
    return matchesSearch && matchesCategory;
  });

  const renderProductCard = ({ item, index }: { item: any; index: number }) => (
    <View style={[
      styles.productCard,
      { 
        backgroundColor: colors.cardBackground,
        marginLeft: index % 2 === 0 ? 16 : 8, 
        marginRight: index % 2 === 1 ? 16 : 8 
      }
    ]}>
      {/* Foto do produto */}
      <View style={styles.productImageWrapper}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.productImage} resizeMode="cover" />
        ) : (
          <View style={[styles.productImage, styles.noImage, { backgroundColor: isDarkMode ? '#3A3A44' : '#d9d9d9' }]}>
            <Text style={[styles.noImageText, { color: isDarkMode ? '#888' : '#999' }]}>Sem Imagem</Text>
          </View>
        )}
      </View>

      {/* Nome do produto */}
      <Text style={[styles.productName, { color: colors.textDark }]} numberOfLines={2}>{item.name}</Text>

      {/* Linha inferior: AddCartIcon | Preço + VerItem */}
      <View style={styles.productBottomRow}>
        {/* Ícone carrinho animado/customizado (substituindo o AddCartIcon SVG bugado) */}
        <TouchableOpacity 
          onPress={() => addToCart(item)} 
          activeOpacity={0.7}
          style={[styles.addCartBtn, { backgroundColor: isDarkMode ? '#1E1E1E' : '#1C2434' }]}
        >
          <MaterialIcons name="shopping-cart" size={26} color="#FFFFFF" />
          <View style={styles.addCartPlusBadge}>
            <Feather name="plus" size={9} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* Coluna: Preço + Ver Item, centralizado */}
        <View style={styles.priceAndButton}>
          <Text style={[styles.productPrice, { color: colors.textDark }]}>R$ {item.price?.toFixed(2)}</Text>
          {/* Botão Ver Item: 80x30, rx=15, #EA841E */}
          <TouchableOpacity
            style={styles.verItemBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ProductDetail', { product: item })}
          >
            <VerItemSvg width={45} height={10} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.backgroundLight }]}>
      <StatusBar backgroundColor={colors.headerBackground} barStyle="light-content" />

      {/* Header + Filtro compartilhados */}
      <CatalogHeader searchText={searchText} onSearchChange={setSearchText} />
      
      {esgotadoAlert && (
        <View style={[
          styles.esgotadoBanner,
          { backgroundColor: isDarkMode ? '#2C1D1E' : '#FFF0F0', borderColor: '#FF3B30' }
        ]}>
          <Feather name="alert-circle" size={16} color="#FF3B30" style={{ marginRight: 8 }} />
          <Text style={[styles.esgotadoBannerText, { color: isDarkMode ? '#FF8A8A' : '#D32F2F' }]} numberOfLines={2}>
            Aviso: O produto "{esgotadoAlert}" esgotou e não está mais disponível no catálogo.
          </Text>
          <TouchableOpacity onPress={() => setEsgotadoAlert(null)} style={{ marginLeft: 'auto', paddingLeft: 10 }}>
            <Feather name="x" size={16} color={isDarkMode ? '#FF8A8A' : '#D32F2F'} />
          </TouchableOpacity>
        </View>
      )}

      <CatalogFilter />

      {/* ========== GRID DE PRODUTOS ========== */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryDark} />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProductCard}
          numColumns={2}
          contentContainerStyle={styles.productsGrid}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textDark, textAlign: 'center', paddingHorizontal: 20 }]}>
                {selectedCategories.length > 0 
                  ? "Não temos produto desta categoria no momento, volte mais tarde!"
                  : "Nenhum produto encontrado"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  // ========== GRID DE PRODUTOS ==========
  productsGrid: {
    paddingTop: 12,
    paddingBottom: 110,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#919191',
  },

  // ========== CARD DO PRODUTO ==========
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: '#E3E4EB',
    borderRadius: 25,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 10,
    marginBottom: 16,
    alignItems: 'center',
  },
  productImageWrapper: {
    width: PHOTO_WIDTH,
    height: PHOTO_HEIGHT,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    marginBottom: 6,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    backgroundColor: '#d9d9d9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#999',
    fontSize: 11,
  },
  productName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1C2434',
    textAlign: 'center',
    marginBottom: 4,
  },

  // Linha inferior
  productBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 4,
  },
  // Preço centralizado com Ver Item
  priceAndButton: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1C2434',
  },
  // Botão Ver Item: 80x30, rx=15, #EA841E
  verItemBtn: {
    backgroundColor: '#EA841E',
    borderRadius: 15,
    width: 85,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCartBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginRight: 4,
  },
  addCartPlusBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#25BE36',
    justifyContent: 'center',
    alignItems: 'center',
  },
  esgotadoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 10,
  },
  esgotadoBannerText: {
    fontSize: 13,
    fontWeight: 'bold',
    flexShrink: 1,
  },
});
