import React from 'react';
import {
  View,
  StatusBar,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Animated,
  Text,
} from 'react-native';
import { Image } from 'expo-image';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { CatalogHeader, CatalogFilter } from '../../../components/CatalogHeader';
import { getAllImageUrls } from '../../../../utils/imageUtils';
import VerItemSvg from '../../../assets/tela4/produto/VerItem.svg';
import { useTheme } from '../../../contexts/ThemeContext';
import useHomeScreen from './useHomeScreen';
import styles from './HomeScreen.styles';

function AnimatedProductImage({ imageUrl, style }: { imageUrl: string | null | undefined, style: any }) {
  const { isDarkMode } = useTheme();
  const urls = React.useMemo(() => getAllImageUrls(imageUrl), [imageUrl]);
  const [index, setIndex] = React.useState(0);
  const opacity = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (urls.length <= 1) {
      setIndex(0);
      return;
    }

    const interval = setInterval(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        setIndex(prev => (prev + 1) % urls.length);
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }).start();
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [urls]);

  if (urls.length === 0) {
    return (
      <View style={[style, { backgroundColor: isDarkMode ? '#3A3A44' : '#d9d9d9', justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: isDarkMode ? '#888' : '#999', fontSize: 11 }}>Sem Imagem</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[style, { opacity }]}>
      <Image
        source={{ uri: urls[index] }}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        cachePolicy="disk"
      />
    </Animated.View>
  );
}

export default function HomeScreen() {
  const {
    colors,
    isDarkMode,
    navigation,
    loading,
    refreshing,
    searchText,
    setSearchText,
    addToCart,
    selectedCategories,
    esgotadoAlert,
    setEsgotadoAlert,
    deliveryActive,
    showReactivatedAlert,
    greeting,
    shopStatus,
    showGreetingBar,
    greetingOpacity,
    greetingScale,
    closeButtonRotate,
    closeButtonScale,
    filteredProducts,
    handleRefresh,
    handleCloseReactivated,
    handleDismissGreeting,
  } = useHomeScreen();

  const renderProductCard = ({ item, index }: { item: any; index: number }) => (
    <View style={[
      styles.productCard,
      {
        backgroundColor: colors.cardBackground,
        marginLeft: index % 2 === 0 ? 16 : 8,
        marginRight: index % 2 === 1 ? 16 : 8
      }
    ]}>
      <View style={styles.productImageWrapper}>
        <AnimatedProductImage imageUrl={item.image_url} style={styles.productImage} />
      </View>

      <Text style={[styles.productName, { color: colors.textDark }]} numberOfLines={2}>{item.name}</Text>

      <View style={styles.productBottomRow}>
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

        <View style={styles.priceAndButton}>
          <Text style={[styles.productPrice, { color: colors.textDark }]}>R$ {item.price?.toFixed(2)}</Text>
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

      <CatalogHeader searchText={searchText} onSearchChange={setSearchText} />

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
          <Text style={[styles.countdownText, { color: shopStatus.isOpen ? '#4A90D9' : '#FF3B30' }]}>
            {shopStatus.isOpen ? shopStatus.countdownText : `Atualmente estamos fechados.\n${shopStatus.countdownText}`}
          </Text>
        </Animated.View>
      )}

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
