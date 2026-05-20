import React, { useContext, useState } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  TextInput,
  Text,
  Platform,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CartContext } from '../../contexts/CartContext';
import { useUserMenu } from '../../contexts/UserMenuContext';

import { CatalogHeader } from '../../components/CatalogHeader';

// === HEADER SVGs ===
// Removidos MiniLogo, Lupa, PersonIcon e CarrinhoTitle (usados no CatalogHeader)

// === CART SVGs ===
import MeuCarrinho from '../../assets/tela8/cart/MeuCarrinho.svg';
import RemoverBtn from '../../assets/tela8/cart/RemoverBtn.svg';

// === BUTTON SVGs ===
import ContinuarText from '../../assets/tela8/buttons/ContinuarText.svg';
import ProsseguirText from '../../assets/tela8/buttons/ProsseguirText.svg';
import PedidosText from '../../assets/tela8/buttons/PedidosText.svg';

export default function CartScreen() {
  const navigation = useNavigation<any>();
  const { toggleMenu } = useUserMenu();
  const { cart, removeFromCart, clearCart, total } = useContext(CartContext);
  const [searchText, setSearchText] = useState('');

  // Agrupa produtos por id somando quantidades
  const groupedCart = cart.reduce((acc: any[], item: any) => {
    const existing = acc.find((p: any) => p.id === item.id);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      acc.push({ ...item });
    }
    return acc;
  }, []);

  const handleRemoveAll = () => {
    if (cart.length === 0) return;
    Alert.alert('Remover tudo', 'Deseja limpar o carrinho?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sim', onPress: clearCart, style: 'destructive' },
    ]);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      Alert.alert('Carrinho vazio', 'Adicione produtos antes de prosseguir.');
      return;
    }
    navigation.navigate('PaymentScreen');
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar backgroundColor="#1C2434" barStyle="light-content" />

      {/* Header Unificado */}
      <CatalogHeader 
        title="Carrinho"
        searchText={searchText}
        onSearchChange={setSearchText}
      />

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ========== "Meu carrinho:" + Remover ========== */}
        <View style={styles.titleRow}>
          <MeuCarrinho width={158} height={19} />
          <TouchableOpacity onPress={handleRemoveAll} activeOpacity={0.7} style={{ borderRadius: 20, overflow: 'hidden' }}>
            <RemoverBtn width={125} height={38} />
          </TouchableOpacity>
        </View>

        {/* ========== PRODUTOS (cards individuais) ========== */}
        {groupedCart.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Carrinho vazio</Text>
          </View>
        ) : (
          groupedCart.map((item: any) => (
            <View key={item.id} style={styles.productRow}>
              {/* Foto (82x80) */}
              <View style={styles.productPhoto}>
                {item.image_url ? (
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.productImage, { backgroundColor: '#d9d9d9', justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ color: '#999', fontSize: 10 }}>N/A</Text>
                  </View>
                )}
              </View>

              {/* Separador 1 */}
              <View style={styles.colSep} />

              {/* Cód. do produto */}
              <View style={styles.colInfo}>
                <Text style={styles.colHeader}>Cód. do{'\n'}produto</Text>
                <Text style={styles.colValue}>{item.id?.substring(0, 7) || '---'}</Text>
              </View>

              {/* Separador 2 */}
              <View style={styles.colSep} />

              {/* Nome do produto */}
              <View style={styles.colInfo}>
                <Text style={styles.colHeader}>Nome do{'\n'}produto</Text>
                <Text style={styles.colValue} numberOfLines={2}>{item.name}</Text>
              </View>

              {/* Separador 3 */}
              <View style={styles.colSep} />

              {/* Quantidade */}
              <View style={styles.colQty}>
                <Text style={styles.colHeader}>Quantidade</Text>
                <Text style={styles.qtyNumber}>{item.quantity}</Text>
              </View>
            </View>
          ))
        )}

      </ScrollView>

      {/* ========== BOTÕES (fixos acima da barra de baixo) ========== */}
      <View style={styles.buttonsContainer}>
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={styles.btnContinuar}
            onPress={() => navigation.navigate('Menu')}
            activeOpacity={0.7}
          >
            <ContinuarText width={90} height={38} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnProsseguir}
            onPress={handleCheckout}
            activeOpacity={0.7}
          >
            <ProsseguirText width={115} height={38} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.btnPedidos}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('OrdersScreen')}
        >
          <PedidosText width={155} height={24} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  mainContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  // ========== CONTEÚDO ==========
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },

  // "Meu carrinho:" + Remover
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#919191',
  },

  // ========== PRODUTO ROW (card individual, sem borda preta) ==========
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3E4EB',
    borderRadius: 15,
    height: 110,
    marginBottom: 10,
    overflow: 'hidden',
  },

  // Foto
  productPhoto: {
    width: 90,
    height: 90,
    marginLeft: 8,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },

  // Separador entre colunas (cor do fundo da tela)
  colSep: {
    width: 1.5,
    height: 100,
    backgroundColor: '#F5F5F5',
  },

  // Colunas de info (Cód, Nome)
  colInfo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    gap: 8,
  },
  colHeader: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },
  colValue: {
    fontSize: 11,
    color: '#000000',
    textAlign: 'center',
  },

  // Coluna Quantidade
  colQty: {
    width: 75,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  qtyNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },

  // ========== BOTÕES (fixos acima da barra de baixo) ==========
  buttonsContainer: {
    position: 'absolute',
    bottom: 115,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 10,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 14,
  },

  // Continuar comprando: 160x65, sem borda
  btnContinuar: {
    width: 160,
    height: 65,
    borderRadius: 15,
    backgroundColor: '#E3E4EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Prosseguir: 160x65, fundo #1C2434
  btnProsseguir: {
    width: 160,
    height: 65,
    borderRadius: 15,
    backgroundColor: '#1C2434',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Meus pedidos: 220x65, fundo #2A7420
  btnPedidos: {
    width: 220,
    height: 65,
    borderRadius: 15,
    backgroundColor: '#2A7420',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
