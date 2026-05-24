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
  RefreshControl,
  Platform,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Colors from '../../theme/colors';
import { useTheme } from '../../contexts/ThemeContext';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../../../data/datasources/supabase/client';

import { CartContext } from '../../contexts/CartContext';
import { AuthContext } from '../../contexts/AuthContext';
import { CatalogHeader, CatalogFilter } from '../../components/CatalogHeader';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useFilter, isProductInCategories } from '../../contexts/FilterContext';
import { getShopStatus } from '../../../utils/shopHours';

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
  const [refreshing, setRefreshing] = useState(false);
  const { searchText, setSearchText, selectedCategories } = useFilter();
  const { addToCart } = useContext(CartContext);
  const { user } = useContext(AuthContext);

  const [esgotadoAlert, setEsgotadoAlert] = useState<string | null>(null);
  const [deliveryActive, setDeliveryActive] = useState(true);
  const [showReactivatedAlert, setShowReactivatedAlert] = useState(false);

  const [clientName, setClientName] = useState('');
  const [greeting, setGreeting] = useState('');
  const [shopStatus, setShopStatusState] = useState<any>(null);
  const [showGreetingBar, setShowGreetingBar] = useState(true);

  const greetingOpacity = React.useRef(new Animated.Value(1)).current;
  const greetingScale = React.useRef(new Animated.Value(1)).current;
  const closeButtonRotate = React.useRef(new Animated.Value(0)).current;
  const closeButtonScale = React.useRef(new Animated.Value(1)).current;

  // Buscar o nome do usuário autenticado para a saudação dinâmica
  const fetchProfileName = async () => {
    if (user?.id) {
      try {
        const { data } = await supabase
          .from('users')
          .select('name')
          .eq('id', user.id)
          .single();
        if (data?.name) {
          const firstName = data.name.trim().split(' ')[0];
          setClientName(firstName);
        } else {
          setClientName('');
        }
      } catch (e) {
        console.log('Erro ao buscar nome do cliente para a saudação:', e);
      }
    } else {
      setClientName('');
    }
  };

  const checkGreetingPreference = async () => {
    try {
      const val = await SecureStore.getItemAsync('show_greeting_bar');
      if (val === 'false') {
        setShowGreetingBar(false);
      } else {
        // Set starting animated values for entrance animation
        greetingOpacity.setValue(0);
        greetingScale.setValue(0.95);
        closeButtonRotate.setValue(0);
        closeButtonScale.setValue(1);
        setShowGreetingBar(true);

        // Run transition
        Animated.parallel([
          Animated.timing(greetingOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(greetingScale, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } catch (e) {
      console.log('Erro ao ler preferência de saudação:', e);
    }
  };

  const handleDismissGreeting = () => {
    Animated.parallel([
      Animated.timing(closeButtonRotate, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(closeButtonScale, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(greetingOpacity, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(greetingScale, {
        toValue: 0.95,
        duration: 450,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      setShowGreetingBar(false);
      try {
        await SecureStore.setItemAsync('show_greeting_bar', 'false');
      } catch (e) {
        console.log('Erro ao salvar preferência de saudação:', e);
      }
    });
  };

  useEffect(() => {
    fetchProfileName();
    checkGreetingPreference();
  }, [user]);

  // Atualizar a saudação e o contador em tempo real a cada 1 segundo
  useEffect(() => {
    const updateStatus = () => {
      const now = new Date();
      const status = getShopStatus(now);
      setShopStatusState(status);

      const hour = now.getHours();
      const isDay = hour >= 6 && hour < 18;
      const nameToUse = clientName || 'Cliente';
      if (isDay) {
        setGreeting(`Bom dia, ${nameToUse}!`);
      } else {
        setGreeting(`Boa noite, ${nameToUse}!`);
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);
    return () => clearInterval(interval);
  }, [clientName]);

  const fetchProducts = async (showLoadingIndicator = true) => {
    if (showLoadingIndicator) setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (!error) setProducts(data || []);
    if (showLoadingIndicator) setLoading(false);
  };

  const handleRefresh = async () => {
    setShowReactivatedAlert(false);
    setRefreshing(true);
    await Promise.all([
      fetchProducts(false),
      checkRecentEsgotados(),
      checkDeliveryStatus()
    ]);
    setRefreshing(false);
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

  const checkDeliveryStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('delivery_active')
        .maybeSingle();

      if (data && !error && data.delivery_active !== undefined) {
        const currentActive = data.delivery_active;
        setDeliveryActive(currentActive);

        // Sincronizar parent ClientTabs
        if (typeof (global as any).refreshDeliveryTabs === 'function') {
          (global as any).refreshDeliveryTabs();
        }

        const lastKnownRaw = await SecureStore.getItemAsync('last_known_delivery_active');
        if (lastKnownRaw !== null) {
          const lastKnown = lastKnownRaw === 'true';
          if (!lastKnown && currentActive) {
            setShowReactivatedAlert(true);
            await SecureStore.setItemAsync('seen_reactivated_alert', 'true'); // Marca como visto imediatamente para a próxima sessão
          }
        } else {
          // Primeiro uso: marca como visto
          await SecureStore.setItemAsync('seen_reactivated_alert', 'true');
        }

        if (!currentActive) {
          // Se o frete foi desativado, preparamos o flag de visto para 'false' para a próxima reativação
          await SecureStore.setItemAsync('seen_reactivated_alert', 'false');
          setShowReactivatedAlert(false);
        }

        await SecureStore.setItemAsync('last_known_delivery_active', String(currentActive));
      }
    } catch (e) {
      console.log('Erro ao verificar status do frete na Home:', e);
    }
  };

  const handleCloseReactivated = async () => {
    setShowReactivatedAlert(false);
    await SecureStore.setItemAsync('seen_reactivated_alert', 'true');
  };

  useEffect(() => {
    fetchProducts();
    checkRecentEsgotados();
    checkDeliveryStatus();
    fetchProfileName();

    const unsubscribeBlur = navigation.addListener('blur', () => {
      setShowReactivatedAlert(false);
    });

    const unsubscribeFocus = navigation.addListener('focus', () => {
      fetchProfileName();
      checkGreetingPreference();
    });

    const channel = supabase
      .channel('store_settings_home')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'store_settings' },
        async (payload) => {
          if (payload.new && (payload.new as any).delivery_active !== undefined) {
            const currentActive = (payload.new as any).delivery_active;
            setDeliveryActive(currentActive);

            // Sincronizar parent ClientTabs
            if (typeof (global as any).refreshDeliveryTabs === 'function') {
              (global as any).refreshDeliveryTabs();
            }

            const lastKnownRaw = await SecureStore.getItemAsync('last_known_delivery_active');
            if (lastKnownRaw !== null) {
              const lastKnown = lastKnownRaw === 'true';
              if (!lastKnown && currentActive) {
                setShowReactivatedAlert(true);
                await SecureStore.setItemAsync('seen_reactivated_alert', 'true'); // Marca como visto imediatamente para a próxima sessão
              }
            } else {
              await SecureStore.setItemAsync('seen_reactivated_alert', 'true');
            }

            if (!currentActive) {
              await SecureStore.setItemAsync('seen_reactivated_alert', 'false');
              setShowReactivatedAlert(false);
            }

            await SecureStore.setItemAsync('last_known_delivery_active', String(currentActive));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      unsubscribeBlur();
      unsubscribeFocus();
    };
  }, [navigation]);

  const filteredProducts = products.filter(p => {
    const name = (p.name || '').toLowerCase();
    const desc = (p.description || '').toLowerCase();
    const query = searchText.toLowerCase();
    const matchesSearch = name.includes(query) || desc.includes(query);
    const matchesCategory = isProductInCategories(p, selectedCategories);
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

      {/* Card Permanente de Domingo ou Feriado */}
      {shopStatus?.isSundayOrHoliday && (
        <View style={[
          styles.domingoFeriadoCard,
          { backgroundColor: isDarkMode ? '#2C1D1E' : '#FFF0F0', borderColor: '#FF3B30' }
        ]}>
          <Feather name="alert-circle" size={18} color="#FF3B30" style={{ marginRight: 8, marginTop: 1 }} />
          <Text style={[styles.domingoFeriadoText, { color: isDarkMode ? '#FF8A8A' : '#D32F2F' }]}>
            {(() => {
              const now = new Date();
              const dayStr = String(now.getDate()).padStart(2, '0');
              const monthStr = String(now.getMonth() + 1).padStart(2, '0');
              const yearStr = now.getFullYear();
              const isSun = now.getDay() === 0;
              return isSun
                ? `Hoje é domingo, dia ${dayStr}-${monthStr}-${yearStr}. Não abrimos hoje.`
                : `Hoje é feriado, dia ${dayStr}-${monthStr}-${yearStr}. Não abrimos hoje.`;
            })()}
          </Text>
        </View>
      )}

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

      {/* Aviso de Frete Inativo */}
      {!deliveryActive && (
        <View style={[
          styles.freteBanner,
          { backgroundColor: isDarkMode ? '#2C1D1E' : '#FFF0F0', borderColor: '#FF3B30' }
        ]}>
          <Feather name="alert-circle" size={18} color="#FF3B30" style={{ marginRight: 8, marginTop: 2 }} />
          <Text style={[styles.freteBannerText, { color: isDarkMode ? '#FF8A8A' : '#D32F2F' }]}>
            Aviso: O frete encontra-se desativado no momento. Nesse período, você não conseguirá ver o mapa, rastrear pedido e nem prosseguir with a compra, mas você pode salvar suas compras no carrinho até ele voltar. Obrigado pela compreensão. Voltaremos em breve!
          </Text>
        </View>
      )}

      {/* Alerta de Frete Reativado */}
      {deliveryActive && showReactivatedAlert && (
        <View style={[
          styles.freteBanner,
          { backgroundColor: isDarkMode ? '#1D2A3A' : '#E8F4FD', borderColor: '#2196F3' }
        ]}>
          <Feather name="info" size={18} color="#2196F3" style={{ marginRight: 8, marginTop: 2 }} />
          <Text style={[styles.freteBannerText, { color: isDarkMode ? '#8AB4F8' : '#0D47A1' }]}>
            O frete foi reativado, Uhuu 🥳! Você pode voltar a comprar, ver o mapa e rastrear sua entrega
          </Text>
          <TouchableOpacity onPress={handleCloseReactivated} style={{ marginLeft: 'auto', paddingLeft: 10 }}>
            <Feather name="x" size={16} color={isDarkMode ? '#8AB4F8' : '#0D47A1'} />
          </TouchableOpacity>
        </View>
      )}

      <CatalogFilter />

      {/* SAUDAÇÃO DINÂMICA + CONTADOR REGRESSIVO */}
      {showGreetingBar && shopStatus && (
        <Animated.View style={[
          styles.greetingContainer,
          {
            backgroundColor: colors.cardBackground,
            opacity: greetingOpacity,
            transform: [{ scale: greetingScale }]
          }
        ]}>
          <TouchableOpacity
            style={styles.closeGreetingBtn}
            onPress={handleDismissGreeting}
            activeOpacity={0.7}
          >
            <Animated.View style={{
              transform: [
                {
                  rotate: closeButtonRotate.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '180deg']
                  })
                },
                { scale: closeButtonScale }
              ]
            }}>
              <Feather name="x" size={16} color={colors.textDark} />
            </Animated.View>
          </TouchableOpacity>
          <Text style={[styles.greetingText, { color: colors.textDark }]}>
            {greeting}
          </Text>
          <Text style={[styles.countdownText, { color: shopStatus.isOpen ? '#25BE36' : '#FF3B30' }]}>
            {shopStatus.isOpen ? shopStatus.countdownText : `Atualmente estamos fechados. ${shopStatus.countdownText}`}
          </Text>
        </Animated.View>
      )}

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
          refreshing={refreshing}
          onRefresh={handleRefresh}
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
  freteBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 10,
  },
  freteBannerText: {
    fontSize: 13,
    fontWeight: 'bold',
    flexShrink: 1,
    lineHeight: 18,
  },
  greetingContainer: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  greetingText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  countdownText: {
    fontSize: 12.5,
    fontWeight: 'bold',
  },
  domingoFeriadoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 10,
  },
  domingoFeriadoText: {
    fontSize: 13,
    fontWeight: 'bold',
    flexShrink: 1,
    lineHeight: 18,
  },
  closeGreetingBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
    zIndex: 10,
  },
});
