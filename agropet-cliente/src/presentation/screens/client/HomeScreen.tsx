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
import { supabase } from '../../../data/datasources/supabase/client';
import { CartContext } from '../../contexts/CartContext';
import { CatalogHeader, CatalogFilter } from '../../components/CatalogHeader';

// === PRODUTO SVGs ===
import AddCartIcon from '../../assets/tela4/produto/AddCartIcon.svg';
import VerItemSvg from '../../assets/tela4/produto/VerItem.svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;
const PHOTO_WIDTH = CARD_WIDTH - 20;
const PHOTO_HEIGHT = (PHOTO_WIDTH * 120) / 129;

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const { addToCart } = useContext(CartContext);

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

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderProductCard = ({ item, index }: { item: any; index: number }) => (
    <View style={[
      styles.productCard,
      { marginLeft: index % 2 === 0 ? 16 : 8, marginRight: index % 2 === 1 ? 16 : 8 }
    ]}>
      {/* Foto do produto */}
      <View style={styles.productImageWrapper}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.productImage} resizeMode="cover" />
        ) : (
          <View style={[styles.productImage, styles.noImage]}>
            <Text style={styles.noImageText}>Sem Imagem</Text>
          </View>
        )}
      </View>

      {/* Nome do produto */}
      <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>

      {/* Linha inferior: AddCartIcon | Preço + VerItem */}
      <View style={styles.productBottomRow}>
        {/* Ícone carrinho (55x55, sem fundo extra) */}
        <TouchableOpacity onPress={() => addToCart(item)} activeOpacity={0.7}>
          <AddCartIcon width={55} height={55} />
        </TouchableOpacity>

        {/* Coluna: Preço + Ver Item, centralizado */}
        <View style={styles.priceAndButton}>
          <Text style={styles.productPrice}>R$ {item.price?.toFixed(2)}</Text>
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
    <View style={styles.mainContainer}>
      <StatusBar backgroundColor="#1C2434" barStyle="light-content" />

      {/* Header + Filtro compartilhados */}
      <CatalogHeader searchText={searchText} onSearchChange={setSearchText} />
      <CatalogFilter />

      {/* ========== GRID DE PRODUTOS ========== */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryDark} />
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
              <Text style={styles.emptyText}>Nenhum produto encontrado</Text>
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
});
