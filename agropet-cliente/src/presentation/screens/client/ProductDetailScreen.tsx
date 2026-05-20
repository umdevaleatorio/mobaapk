import React, { useState, useContext } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Text,
  Image,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CartContext } from '../../contexts/CartContext';
import { useUserMenu } from '../../contexts/UserMenuContext';
import { CatalogHeader, CatalogFilter } from '../../components/CatalogHeader';

// SVGs do carrinho
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

// SVGs produtos relacionados
import RelCartIcon from '../../assets/tela5/relacionados/CartIcon1.svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { toggleMenu } = useUserMenu();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { addToCart } = useContext(CartContext);

  const product = route.params?.product;
  const [quantity, setQuantity] = useState(2);
  const [searchText, setSearchText] = useState('');

  if (!product) return null;

  const increment = () => setQuantity(q => q + 1);
  const decrement = () => setQuantity(q => (q > 1 ? q - 1 : 1));

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar backgroundColor="#1C2434" barStyle="light-content" />

      {/* Header + Filtro (compartilhado) */}
      <CatalogHeader searchText={searchText} onSearchChange={setSearchText} />
      <CatalogFilter activeCategory="Ração" />

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ========== CARD DO PRODUTO (#E3E4EB, 326x406, rx=25) ========== */}
        <View style={styles.productCard}>
          {/* Parte de cima: Foto à esquerda (159x215) + Info à direita */}
          <View style={styles.topRow}>
            {/* Foto do produto */}
            <View style={styles.photoWrapper}>
              {product.image_url ? (
                <Image
                  source={{ uri: product.image_url }}
                  style={styles.photo}
                  resizeMode="contain"
                />
              ) : (
                <View style={[styles.photo, { backgroundColor: '#d9d9d9', justifyContent: 'center', alignItems: 'center' }]}>
                  <Text style={{ color: '#999' }}>Sem Foto</Text>
                </View>
              )}
            </View>

            {/* Info à direita: Nome + "Informações na Embalagem" */}
            <View style={styles.infoColumn}>
              <Text style={styles.productTitle}>{product.name}</Text>
              {product.description ? (
                <Text style={styles.productSubtitle}>{product.description}</Text>
              ) : (
                <Text style={styles.infoEmbalagem}>
                  Informações{'\n'}na{'\n'}Embalagem
                </Text>
              )}
            </View>
          </View>

          {/* Descrição do produto */}
          <Text style={styles.descricaoText}>
            Descrição do produto: {product.description || product.name}
          </Text>

          {/* Preço */}
          <Text style={styles.precoText}>
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
        <Text style={styles.relatedTitle}>Produtos Relacionados:</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.relatedScroll}
        >
          {/* Card Produto Relacionado 1 */}
          <View style={styles.relatedCard}>
            {/* Foto (150x150, rx=20, #E3E4EB fundo) */}
            <View style={styles.relatedPhotoBox}>
              <View style={styles.relatedPhotoPlaceholder}>
                <Text style={{ fontSize: 40 }}>📦</Text>
              </View>
            </View>

            {/* Info: cart icon + nome + preço */}
            <View style={styles.relatedInfoRow}>
              <View style={styles.relatedCartCircle}>
                <RelCartIcon width={24} height={24} />
              </View>
              <View style={styles.relatedTexts}>
                <Text style={styles.relatedName} numberOfLines={1}>Ração Besser 15Kg</Text>
                <Text style={styles.relatedPrice}>45,99 Un.</Text>
              </View>
            </View>
          </View>

          {/* Card Produto Relacionado 2 */}
          <View style={styles.relatedCard}>
            <View style={styles.relatedPhotoBox}>
              <View style={styles.relatedPhotoPlaceholder}>
                <Text style={{ fontSize: 40 }}>📦</Text>
              </View>
            </View>

            <View style={styles.relatedInfoRow}>
              <View style={styles.relatedCartCircle}>
                <RelCartIcon width={24} height={24} />
              </View>
              <View style={styles.relatedTexts}>
                <Text style={styles.relatedName} numberOfLines={1}>Ração Pedigree 15Kg</Text>
                <Text style={styles.relatedPrice}>54,50 Un.</Text>
              </View>
            </View>
          </View>
        </ScrollView>

      </ScrollView>

      {/* ========== BARRA DE BAIXO (igual Tela 4) ========== */}
      <View style={styles.bottomBarOuter}>
        <View style={styles.bottomBarInner}>
          {/* Menu */}
          <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ClientTabs')}>
            <View style={styles.iconBg}>
              <HomeIcon width={32} height={32} />
            </View>
            <MenuLabel width={33} height={9} />
          </TouchableOpacity>

          <View style={styles.tabSep} />

          {/* Mapa */}
          <TouchableOpacity style={styles.tabItem}>
            <View style={styles.iconBg}>
              <MapIcon width={32} height={32} />
            </View>
            <MapaLabel width={32} height={12} />
          </TouchableOpacity>

          <View style={styles.tabSep} />

          {/* Carrinho */}
          <TouchableOpacity style={styles.tabItem}>
            <View style={styles.iconBg}>
              <BarCartIcon width={32} height={32} />
            </View>
            <CarrinhoLabel width={52} height={10} />
          </TouchableOpacity>

          <View style={styles.tabSep} />

          {/* Opções */}
          <TouchableOpacity style={styles.tabItem}>
            <View style={styles.iconBg}>
              <GearIcon width={32} height={32} />
            </View>
            <OpcoesLabel width={42} height={12} />
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
});
