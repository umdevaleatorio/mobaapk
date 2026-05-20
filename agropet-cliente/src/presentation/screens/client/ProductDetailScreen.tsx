import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Text,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CartContext } from '../../contexts/CartContext';
import { useUserMenu } from '../../contexts/UserMenuContext';
import { useTheme } from '../../contexts/ThemeContext';
import { CatalogHeader, CatalogFilter } from '../../components/CatalogHeader';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../../data/datasources/supabase/client';
import { useFilter, CATEGORY_KEYWORDS } from '../../contexts/FilterContext';

// SVGs do carrinho restaurados
import CartBig from '../../assets/tela5/carrinho/CartBig.svg';
import PlusIcon from '../../assets/tela5/carrinho/PlusIcon.svg';

// SVGs da barra de baixo (Tela 5 - todos inativos/mesma cor)
import HomeIcon from '../../assets/tela5/barra/Home.svg';
import MapIcon from '../../assets/tela5/barra/Map.svg';
import BarCartIcon from '../../assets/tela5/barra/Cart.svg';
import GearIcon from '../../assets/tela5/barra/Gear.svg';
import MenuLabel from '../../assets/tela5/barra/MenuLabel.svg';
import MapaLabel from '../../assets/tela5/barra/MapaLabel.svg';
import CarrinhoLabel from '../../assets/tela5/barra/CarrinhoLabel.svg';
import OpcoesLabel from '../../assets/tela5/barra/OpcoesLabel.svg';

// SVGs produtos relacionados substituídos por Feather
// import RelCartIcon from '../../assets/tela5/relacionados/CartIcon1.svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { colors, isDarkMode } = useTheme();
  const { toggleMenu } = useUserMenu();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { addToCart } = useContext(CartContext);
  const { searchText, setSearchText } = useFilter();

  const product = route.params?.product;
  const [stock, setStock] = useState(product?.stock ?? 0);
  const [quantity, setQuantity] = useState(1);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(true);

  useEffect(() => {
    if (!product?.id) return;

    const fetchStock = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('stock')
          .eq('id', product.id)
          .single();

        if (data && !error) {
          setStock(data.stock);
        }
      } catch (err) {
        console.error('Erro ao buscar estoque:', err);
      }
    };

    fetchStock();

    // Inscrição em tempo real para mudanças no estoque do produto
    const channel = supabase
      .channel(`product_stock_${product.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
          filter: `id=eq.${product.id}`,
        },
        (payload: any) => {
          if (payload.new && typeof payload.new.stock === 'number') {
            setStock(payload.new.stock);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [product?.id]);

  const fetchRelatedProducts = async () => {
    try {
      setLoadingRelated(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .neq('id', product.id);

      if (!error && data) {
        const currentNameLower = product.name.toLowerCase();
        let matchedKeywords: string[] = [];

        for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
          if (keywords.some(kw => currentNameLower.includes(kw))) {
            matchedKeywords = keywords;
            break;
          }
        }

        let filtered = data.filter(p => {
          const nameLower = p.name.toLowerCase();
          return matchedKeywords.some(kw => nameLower.includes(kw));
        });

        if (filtered.length === 0) {
          const words = currentNameLower.split(' ').filter((w: string) => w.length > 3);
          filtered = data.filter(p => {
            const nameLower = p.name.toLowerCase();
            return words.some((w: string) => nameLower.includes(w));
          });
        }

        setRelatedProducts(filtered);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoadingRelated(false);
    }
  };

  useEffect(() => {
    fetchRelatedProducts();
  }, [product]);

  if (!product) return null;

  const increment = () => setQuantity(q => q + 1);
  const decrement = () => setQuantity(q => (q > 1 ? q - 1 : 1));

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.backgroundLight }]}>
      <StatusBar backgroundColor={colors.headerBackground} barStyle="light-content" />

      {/* Header + Filtro (compartilhado) */}
      <CatalogHeader searchText={searchText} onSearchChange={setSearchText} />
      <CatalogFilter />

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ========== CARD DO PRODUTO (#E3E4EB, 326x406, rx=25) ========== */}
        <View style={[styles.productCard, { backgroundColor: colors.cardBackground }]}>
          {/* Parte de cima: Foto à esquerda (159x215) + Info à direita */}
          <View style={styles.topRow}>
            {/* Foto do produto */}
            <View style={[styles.photoWrapper, { backgroundColor: isDarkMode ? '#1E1E24' : '#FFFFFF' }]}>
              {product.image_url ? (
                <Image
                  source={{ uri: product.image_url }}
                  style={styles.photo}
                  resizeMode="contain"
                />
              ) : (
                <View style={[styles.photo, { backgroundColor: isDarkMode ? '#3A3A44' : '#d9d9d9', justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ color: isDarkMode ? '#888' : '#999' }}>Sem Foto</Text>
                </View>
              )}
            </View>

            {/* Info à direita: Nome + "Informações na Embalagem" */}
            <View style={styles.infoColumn}>
              <View style={{ flex: 1, justifyContent: 'flex-start' }}>
                <Text style={[styles.productTitle, { color: colors.textDark }]}>{product.name}</Text>
                {product.description ? (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 13, color: colors.textDark, marginBottom: 2 }}>
                      Descrição do produto:
                    </Text>
                    <Text style={[styles.productSubtitle, { color: colors.textDark }]}>{product.description}</Text>
                  </View>
                ) : (
                  <Text style={[styles.infoEmbalagem, { color: colors.textDark }]}>
                    Informações{'\n'}na{'\n'}Embalagem
                  </Text>
                )}
              </View>
              <Text style={{
                fontSize: 14,
                fontWeight: 'bold',
                color: isDarkMode ? '#919191' : '#042A7D',
                marginTop: 8,
                textAlign: 'left',
                paddingLeft: 4
              }}>
                Estoque: {stock} unidades
              </Text>
            </View>
          </View>

          {/* Preço */}
          <Text style={[styles.precoText, { color: colors.textDark }]}>
            R$ {product.price?.toFixed(2)} Un.
          </Text>

          {/* ======= SEÇÃO CARRINHO (sobreposição) ======= */}
          <View style={styles.cartSection}>
            {/* Barra de quantidade (#435270, rx=20) — fica POR TRÁS do cart */}
            <View style={styles.quantityBar}>
              {/* Espaço para o carrinho sobrepor à esquerda */}
              <View style={{ width: 65 }} />

              {/* "Quantidade:" */}
              <Text style={styles.quantityLabel}>Quantidade:</Text>

              {/* Separador */}
              <View style={styles.quantitySep} />

              {/* Botões à direita */}
              <View style={styles.quantityControls}>
                {/* Botão - (#C41919) */}
                <TouchableOpacity style={styles.btnMinus} onPress={decrement}>
                  <View style={styles.minusLine} />
                </TouchableOpacity>

                {/* Número (#1A1A1A) */}
                <View style={styles.quantityNum}>
                  <Text style={styles.quantityNumText}>{quantity}</Text>
                </View>

                {/* Botão + (#25BE36) */}
                <TouchableOpacity style={styles.btnPlus} onPress={increment}>
                  <View style={styles.plusLineH} />
                  <View style={styles.plusLineV} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Botão Cart SOBREPÕE a barra à esquerda */}
            <TouchableOpacity
              style={styles.cartBigBtn}
              onPress={handleAddToCart}
              activeOpacity={0.7}
            >
              <CartBig width={42} height={42} />
              {/* +Icon.svg: bolinha verde diagonal superior direita */}
              <View style={styles.cartPlusBadge}>
                <PlusIcon width={13} height={13} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ========== PRODUTOS RELACIONADOS ========== */}
        <Text style={[styles.relatedTitle, { color: colors.textDark }]}>Produtos Relacionados:</Text>

        {loadingRelated ? (
          <ActivityIndicator size="small" color={colors.primaryDark} style={{ marginVertical: 20 }} />
        ) : relatedProducts.length === 0 ? (
          <Text style={[styles.noRelatedText, { color: colors.textDark }]}>
            No momento, não há nenhum produto relacionado à {product.name}
          </Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.relatedScroll}
          >
            {relatedProducts.map((relProduct) => (
              <TouchableOpacity
                key={relProduct.id}
                onPress={() => navigation.replace('ProductDetail', { product: relProduct })}
                activeOpacity={0.7}
                style={[styles.relatedCard, { backgroundColor: colors.cardBackground }]}
              >
                {/* Foto */}
                <View style={[styles.relatedPhotoBox, { backgroundColor: isDarkMode ? '#1E1E24' : '#FFFFFF' }]}>
                  {relProduct.image_url ? (
                    <Image source={{ uri: relProduct.image_url }} style={styles.relatedPhoto} resizeMode="contain" />
                  ) : (
                    <View style={styles.relatedPhotoPlaceholder}>
                      <Text style={{ fontSize: 40 }}>📦</Text>
                    </View>
                  )}
                </View>

                {/* Info: cart icon + nome + preço */}
                <View style={styles.relatedInfoRow}>
                  <TouchableOpacity 
                    style={[styles.relatedCartCircle, { backgroundColor: isDarkMode ? '#FFFFFF' : '#E3DAD9' }]}
                    onPress={() => addToCart(relProduct)}
                    activeOpacity={0.7}
                  >
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

      {/* ========== BARRA DE BAIXO (igual Tela 4) ========== */}
      <View style={styles.bottomBarOuter}>
        <View style={[styles.bottomBarInner, { backgroundColor: isDarkMode ? '#000000' : colors.cardBackground }]}>
          {/* Menu */}
          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Menu' })}>
            <View style={styles.iconBg}>
              <HomeIcon width={32} height={32} fill={isDarkMode ? '#FFFFFF' : undefined} stroke={isDarkMode ? '#FFFFFF' : undefined} />
            </View>
            <MenuLabel width={33} height={9} fill={isDarkMode ? '#FFFFFF' : undefined} stroke={isDarkMode ? '#FFFFFF' : undefined} />
          </TouchableOpacity>

          <View style={[styles.tabSep, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.4)' : '#8A7268' }]} />

          {/* Mapa */}
          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Mapa' })}>
            <View style={styles.iconBg}>
              <MapIcon width={32} height={32} fill={isDarkMode ? '#FFFFFF' : undefined} stroke={isDarkMode ? '#FFFFFF' : undefined} />
            </View>
            <MapaLabel width={32} height={12} fill={isDarkMode ? '#FFFFFF' : undefined} stroke={isDarkMode ? '#FFFFFF' : undefined} />
          </TouchableOpacity>

          <View style={[styles.tabSep, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.4)' : '#8A7268' }]} />

          {/* Carrinho */}
          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Carrinho' })}>
            <View style={styles.iconBg}>
              <BarCartIcon width={32} height={32} fill={isDarkMode ? '#FFFFFF' : undefined} stroke={isDarkMode ? '#FFFFFF' : undefined} />
            </View>
            <CarrinhoLabel width={52} height={10} fill={isDarkMode ? '#FFFFFF' : undefined} stroke={isDarkMode ? '#FFFFFF' : undefined} />
          </TouchableOpacity>

          <View style={[styles.tabSep, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.4)' : '#8A7268' }]} />

          {/* Opções */}
          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs', { screen: 'Opções' })}>
            <View style={styles.iconBg}>
              <GearIcon width={32} height={32} fill={isDarkMode ? '#FFFFFF' : undefined} stroke={isDarkMode ? '#FFFFFF' : undefined} />
            </View>
            <OpcoesLabel width={42} height={12} fill={isDarkMode ? '#FFFFFF' : undefined} stroke={isDarkMode ? '#FFFFFF' : undefined} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const CARD_PADDING = 16;
const CARD_INNER = SCREEN_WIDTH - 32 - (CARD_PADDING * 2);

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
  },

  // ========== CARD PRODUTO (326x406, #E3E4EB, rx=25) ==========
  productCard: {
    backgroundColor: '#E3E4EB',
    borderRadius: 25,
    padding: CARD_PADDING,
    marginBottom: 16,
  },

  // Linha superior: foto + info
  topRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  // Foto: proporção 159x215 do SVG
  photoWrapper: {
    width: CARD_INNER * 0.48,
    aspectRatio: 159 / 215,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  // Info à direita
  infoColumn: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C2434',
    textAlign: 'center',
    marginBottom: 16,
  },
  productSubtitle: {
    fontSize: 14,
    color: '#1C2434',
    textAlign: 'center',
  },
  infoEmbalagem: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1C2434',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Descrição
  descricaoText: {
    fontSize: 13,
    color: '#1C2434',
    textAlign: 'center',
    marginBottom: 6,
  },

  // Preço
  precoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C2434',
    textAlign: 'center',
    marginBottom: 12,
  },

  // ========== SEÇÃO CARRINHO (sobreposição) ==========
  cartSection: {
    position: 'relative',
    marginTop: 4,
  },
  // Cart grande: Fundo-2.svg = 69x69, #1C2434, rx=25
  // Posicionado SOBRE a barra de quantidade à esquerda
  cartBigBtn: {
    position: 'absolute',
    left: 0,
    top: -10,
    width: 69,
    height: 69,
    borderRadius: 25,
    backgroundColor: '#1C2434',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  // Badge verde: +Icon.svg = 13x13, #25BE36 circle
  cartPlusBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Barra quantidade: Preenchimento.svg = 266x59, #435270, rx=20
  quantityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#435270',
    borderRadius: 20,
    height: 50,
    paddingLeft: 12,
    paddingRight: 12,
  },
  quantityLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
  // Separador
  quantitySep: {
    width: 1,
    height: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 8,
  },
  // Agrupa os controles à direita
  quantityControls: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },

  // Botão -: 23x23, branco, traço #C41919
  btnMinus: {
    width: 23,
    height: 23,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  minusLine: {
    width: 12,
    height: 2.5,
    backgroundColor: '#C41919',
  },

  // Número: 30x30, #1A1A1A
  quantityNum: {
    width: 30,
    height: 30,
    borderRadius: 2,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityNumText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Botão +: 23x23, branco, #25BE36
  btnPlus: {
    width: 23,
    height: 23,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusLineH: {
    position: 'absolute',
    width: 12,
    height: 2.5,
    backgroundColor: '#25BE36',
  },
  plusLineV: {
    position: 'absolute',
    width: 2.5,
    height: 12,
    backgroundColor: '#25BE36',
  },

  // ========== PRODUTOS RELACIONADOS ==========
  relatedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C2434',
    marginBottom: 12,
  },
  relatedScroll: {
    gap: 12,
    paddingBottom: 20,
  },
  // Card: fundo #E3E4EB, rx=20
  relatedCard: {
    backgroundColor: '#E3E4EB',
    borderRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 8,
    paddingBottom: 10,
    width: 170,
  },
  // Foto: 150x150, rx=20, fundo #E3E4EB
  relatedPhotoBox: {
    width: 154,
    height: 110,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    alignSelf: 'center',
    marginBottom: 6,
  },
  relatedPhotoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Info row: cart icon + textos
  relatedInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  relatedCartCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3DAD9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  relatedTexts: {
    flex: 1,
  },
  relatedName: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1C2434',
  },
  relatedPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1C2434',
  },

  // ========== BARRA DE BAIXO ==========
  bottomBarOuter: {
    position: 'absolute',
    bottom: 10,
    left: 16,
    right: 16,
  },
  bottomBarInner: {
    flexDirection: 'row',
    backgroundColor: '#E3E4EB',
    borderRadius: 30,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabSep: {
    width: 1,
    height: 49,
    backgroundColor: '#8A7268',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconBg: {
    width: 51,
    height: 41,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBgActive: {
    width: 51,
    height: 41,
    borderRadius: 20,
    backgroundColor: '#E3DAD9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  relatedPhoto: {
    width: 154,
    height: 110,
    borderRadius: 15,
  },
  noRelatedText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 20,
    paddingHorizontal: 16,
  },
});
