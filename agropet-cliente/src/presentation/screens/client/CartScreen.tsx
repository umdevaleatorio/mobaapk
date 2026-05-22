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
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../../data/datasources/supabase/client';
import * as SecureStore from 'expo-secure-store';


import { CatalogHeader } from '../../components/CatalogHeader';
import { Feather, MaterialIcons } from '@expo/vector-icons';

// === HEADER SVGs ===
// Removidos MiniLogo, Lupa, PersonIcon e CarrinhoTitle (usados no CatalogHeader)

// === CART SVGs substituídos ===
// import MeuCarrinho from '../../assets/tela8/cart/MeuCarrinho.svg';
// import RemoverBtn from '../../assets/tela8/cart/RemoverBtn.svg';

// === BUTTON SVGs substituídos ===
// import ContinuarText from '../../assets/tela8/buttons/ContinuarText.svg';
// import ProsseguirText from '../../assets/tela8/buttons/ProsseguirText.svg';
// import PedidosText from '../../assets/tela8/buttons/PedidosText.svg';

export default function CartScreen() {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<any>();
  const { toggleMenu } = useUserMenu();
  const { cart, addToCart, removeFromCart, clearCart, total } = useContext(CartContext);
  const [searchText, setSearchText] = useState('');

  // Estados do Modo de Edição/Remoção
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [decreases, setDecreases] = useState<Record<string, number>>({});
  const [removedAlert, setRemovedAlert] = useState<string | null>(null);

  React.useEffect(() => {
    if (cart.length === 0) return;
    
    const validateCartItems = async () => {
      try {
        const productIds = cart.map(item => item.id);
        const { data, error } = await supabase
          .from('products')
          .select('id, name, active, stock, updated_at')
          .in('id', productIds);
          
        if (error) return;
        
        const activeProducts = data || [];
        const removedNames: string[] = [];
        
        for (const item of cart) {
          const dbProd = activeProducts.find(p => p.id === item.id);
          if (!dbProd || !dbProd.active || dbProd.stock <= 0) {
            await removeFromCart(item.id);
            
            // Check if it was updated (esgotado) recently (within the last 24h)
            const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const updatedAtDate = dbProd?.updated_at ? new Date(dbProd.updated_at) : new Date(0);
            const isRecent = updatedAtDate >= oneDayAgo;
            
            if (isRecent) {
              removedNames.push(item.name);
            }
          } else if (dbProd.stock < item.quantity) {
            const diff = item.quantity - dbProd.stock;
            await addToCart(item, -diff);
            Alert.alert(
              'Ajuste de Estoque',
              `A quantidade de "${item.name}" foi reduzida para ${dbProd.stock} pois o estoque disponível diminuiu.`
            );
          }
        }
        
        if (removedNames.length > 0) {
          try {
            const seenRaw = await SecureStore.getItemAsync('seen_removed_carrinho');
            const seenList: string[] = seenRaw ? JSON.parse(seenRaw) : [];
            
            const unseenNames = removedNames.filter(name => !seenList.includes(name));
            
            if (unseenNames.length > 0) {
              setRemovedAlert(unseenNames.join(', '));
              
              const updatedSeenList = [...seenList, ...unseenNames];
              await SecureStore.setItemAsync('seen_removed_carrinho', JSON.stringify(updatedSeenList));
            }
          } catch (storageErr) {
            console.log('Erro ao ler/salvar no SecureStore:', storageErr);
            setRemovedAlert(removedNames.join(', '));
          }
        }
      } catch (err) {
        console.log('Erro ao validar itens do carrinho:', err);
      }
    };
    
    validateCartItems();
  }, [cart.length]);

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

  const handleToggleSelect = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedItems(new Set(groupedCart.map((item: any) => item.id)));
  };

  const handleDecrease = (id: string, maxQty: number) => {
    setDecreases(prev => {
      const currentDec = prev[id] || 0;
      if (currentDec < maxQty - 1) {
        return { ...prev, [id]: currentDec + 1 };
      }
      return prev;
    });
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setSelectedItems(new Set());
    setDecreases({});
  };

  const handleRemoverPress = async () => {
    if (!isEditMode) {
      if (cart.length === 0) return;
      setIsEditMode(true);
      setSelectedItems(new Set());
      setDecreases({});
      return;
    }

    const checkedCount = selectedItems.size;
    const decreasedCount = Object.keys(decreases).filter(id => decreases[id] > 0).length;

    if (checkedCount === 0 && decreasedCount === 0) {
      setIsEditMode(false);
      return;
    }

    const findItemName = (id: string) => {
      const item = cart.find(i => i.id === id);
      return item ? item.name : 'Produto';
    };

    let message = '';

    if (checkedCount === groupedCart.length && decreasedCount === 0) {
      message = 'Tem certeza que deseja apagar todos os itens do carrinho?';
    } else if (checkedCount === 0 && decreasedCount === 1) {
      const id = Object.keys(decreases).find(k => decreases[k] > 0) || '';
      message = `Tem certeza que deseja diminuir a quantidade de ${findItemName(id)}?`;
    } else if (checkedCount === 1 && decreasedCount === 0) {
      const id = Array.from(selectedItems)[0];
      message = `Tem certeza que deseja excluir ${findItemName(id)} do carrinho?`;
    } else if (checkedCount === 1 && decreasedCount === 1) {
      const decId = Object.keys(decreases).find(k => decreases[k] > 0) || '';
      const checkId = Array.from(selectedItems)[0];
      message = `Tem certeza que deseja diminuir a quantidade do item ${findItemName(decId)} e excluir o item ${findItemName(checkId)} do carrinho?`;
    } else {
      message = `Tem certeza que deseja diminuir a quantidade de ${decreasedCount} item(ns) e excluir ${checkedCount} item(ns) do carrinho?`;
    }

    Alert.alert('Confirmação', message, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sim',
        style: 'destructive',
        onPress: async () => {
          try {
            // Remove os itens selecionados
            for (const id of Array.from(selectedItems)) {
              await removeFromCart(id);
            }

            // Diminui a quantidade dos itens alterados
            for (const [id, qty] of Object.entries(decreases)) {
              if (selectedItems.has(id)) continue;
              if (qty > 0) {
                const item = cart.find(i => i.id === id);
                if (item) {
                  await addToCart(item, -qty);
                }
              }
            }
          } catch (error) {
            console.error('Erro ao atualizar carrinho:', error);
          } finally {
            setIsEditMode(false);
            setSelectedItems(new Set());
            setDecreases({});
          }
        }
      }
    ]);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      Alert.alert('Carrinho vazio', 'Adicione produtos antes de prosseguir.');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('delivery_active')
        .maybeSingle();

      if (data && !error && data.delivery_active === false) {
        Alert.alert(
          'Aviso',
          'Não é possível prosseguir com a compra. O frete encontra-se inativo no momento.'
        );
        return;
      }
    } catch (e) {
      console.log('Error checking delivery status during checkout:', e);
    }
    navigation.navigate('PaymentScreen');
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.backgroundLight }]}>
      <StatusBar backgroundColor={colors.headerBackground} barStyle="light-content" />

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
        {removedAlert && (
          <View style={[
            styles.removedBanner,
            { backgroundColor: isDarkMode ? '#2C1D1E' : '#FFF0F0', borderColor: '#FF3B30' }
          ]}>
            <Feather name="alert-circle" size={16} color="#FF3B30" style={{ marginRight: 8 }} />
            <Text style={[styles.removedBannerText, { color: isDarkMode ? '#FF8A8A' : '#D32F2F' }]} numberOfLines={3}>
              Aviso: O produto "{removedAlert}" esgotou e por isso foi retirado do seu carrinho.
            </Text>
            <TouchableOpacity onPress={() => setRemovedAlert(null)} style={{ marginLeft: 'auto', paddingLeft: 10 }}>
              <Feather name="x" size={16} color={isDarkMode ? '#FF8A8A' : '#D32F2F'} />
            </TouchableOpacity>
          </View>
        )}

        {/* ========== "Meu carrinho:" + Remover ========== */}
        <View style={[styles.titleRow, isEditMode && { marginBottom: 28 }]}>
          <Text style={[styles.meuCarrinhoTitle, { color: colors.textDark }]}>Meu carrinho:</Text>
          
          <View style={styles.editControlsContainer}>
            <View style={styles.buttonsRowHeader}>
              {isEditMode && (
                <TouchableOpacity
                  onPress={handleCancelEdit}
                  style={styles.cancelBtn}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
              )}
              
              <View style={styles.removerColumn}>
                <TouchableOpacity 
                  onPress={handleRemoverPress} 
                  activeOpacity={0.7} 
                  style={[
                    styles.removerBtnContainer, 
                    { backgroundColor: isDarkMode ? '#FFFFFF' : '#1C2434' }
                  ]}
                >
                  <View style={styles.cartRemoveIconWrapper}>
                    <MaterialIcons 
                      name="shopping-cart" 
                      size={24} 
                      color={isDarkMode ? '#8B0000' : '#FFFFFF'} 
                    />
                    <View style={styles.cartMinusBadge}>
                      <Feather name="minus" size={10} color="#FFFFFF" />
                    </View>
                  </View>
                  <Text style={[styles.removerBtnText, { color: isDarkMode ? '#8B0000' : '#FFFFFF' }]}>
                    Remover
                  </Text>
                </TouchableOpacity>

                {isEditMode && (
                  <TouchableOpacity 
                    onPress={handleSelectAll} 
                    style={styles.selectAllBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.selectAllText, { color: isDarkMode ? '#FFFFFF' : '#8B0000' }]}>
                      Selecionar tudo
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* ========== PRODUTOS (cards individuais) ========== */}
        {groupedCart.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textGray }]}>Carrinho vazio</Text>
          </View>
        ) : (
          groupedCart.map((item: any) => (
            <View key={item.id} style={[styles.productRow, { backgroundColor: colors.cardBackground }]}>
              {/* Foto (82x80) */}
              <View style={[styles.productPhoto, { backgroundColor: isDarkMode ? '#1E1E24' : '#FFFFFF' }]}>
                {item.image_url ? (
                  <Image
                    source={{ uri: item.image_url }}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.productImage, { backgroundColor: isDarkMode ? '#3A3A44' : '#d9d9d9', justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ color: isDarkMode ? '#888' : '#999', fontSize: 10 }}>N/A</Text>
                  </View>
                )}
              </View>

              {/* Separador 1 */}
              <View style={[styles.colSep, { backgroundColor: colors.backgroundLight }]} />

              {/* Cód. do produto */}
              <View style={styles.colInfo}>
                <Text style={[styles.colHeader, { color: colors.textDark }]}>Cód. do{'\n'}produto</Text>
                <Text style={[styles.colValue, { color: colors.textDark }]}>{item.id?.substring(0, 7) || '---'}</Text>
              </View>

              {/* Separador 2 */}
              <View style={[styles.colSep, { backgroundColor: colors.backgroundLight }]} />

              {/* Nome do produto */}
              <View style={styles.colInfo}>
                <Text style={[styles.colHeader, { color: colors.textDark }]}>Nome do{'\n'}produto</Text>
                <Text style={[styles.colValue, { color: colors.textDark }]} numberOfLines={2}>{item.name}</Text>
              </View>

              {/* Separador 3 */}
              <View style={[styles.colSep, { backgroundColor: colors.backgroundLight }]} />

              {/* Quantidade */}
              <View style={styles.colQty}>
                <Text style={[styles.colHeader, { color: colors.textDark }]}>Quantidade</Text>
                {isEditMode ? (
                  <View style={styles.qtyEditRow}>
                    <TouchableOpacity 
                      onPress={() => handleDecrease(item.id, item.quantity)}
                      style={[
                        styles.decreaseBtn,
                        { backgroundColor: isDarkMode ? '#2D2D35' : '#F5F5F5' }
                      ]}
                      activeOpacity={0.7}
                    >
                      <Feather name="minus" size={12} color="#FF3B30" />
                    </TouchableOpacity>

                    <Text style={[styles.qtyNumberEdit, { color: colors.textDark }]}>
                      {item.quantity - (decreases[item.id] || 0)}
                    </Text>

                    <TouchableOpacity 
                      onPress={() => handleToggleSelect(item.id)}
                      style={styles.checkboxTouchTarget}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.checkboxContainer,
                        selectedItems.has(item.id) && styles.checkboxSelected
                      ]}>
                        {selectedItems.has(item.id) && (
                          <Feather name="check" size={10} color="#FFFFFF" />
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={[styles.qtyNumber, { color: colors.textDark }]}>{item.quantity}</Text>
                )}
              </View>
            </View>
          ))
        )}

      </ScrollView>

      {/* ========== BOTÕES (fixos acima da barra de baixo) ========== */}
      <View style={styles.buttonsContainer}>
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            style={[styles.btnContinuar, { backgroundColor: colors.cardBackground }]}
            onPress={() => navigation.navigate('Menu')}
            activeOpacity={0.7}
          >
            <Text style={[styles.btnTextSecondary, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>Continuar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnProsseguir}
            onPress={handleCheckout}
            activeOpacity={0.7}
          >
            <Text style={styles.btnTextPrimary}>Prosseguir</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.btnPedidos}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('OrdersScreen')}
        >
          <Text style={styles.btnTextPrimary}>Meus pedidos</Text>
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
    height: '100%',
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

  // Prosseguir: 160x65, fundo #2A7420 (verde)
  btnProsseguir: {
    width: 160,
    height: 65,
    borderRadius: 15,
    backgroundColor: '#2A7420',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Meus pedidos: 220x65, fundo #1C2434 (azul escuro)
  btnPedidos: {
    width: 220,
    height: 65,
    borderRadius: 15,
    backgroundColor: '#1C2434',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meuCarrinhoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  removerBtnContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 140,
    height: 42,
    borderRadius: 21,
    paddingHorizontal: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  cartRemoveIconWrapper: {
    position: 'relative',
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartMinusBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removerBtnText: {
    color: '#FF3B30',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 6,
  },
  btnTextPrimary: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  btnTextSecondary: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  editControlsContainer: {
    alignItems: 'flex-end',
    gap: 6,
  },
  buttonsRowHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  cancelBtn: {
    backgroundColor: '#FF3B30',
    width: 90,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  removerColumn: {
    alignItems: 'center',
    position: 'relative',
  },
  selectAllBtn: {
    position: 'absolute',
    top: 45,
    alignSelf: 'center',
  },
  selectAllText: {
    color: '#8B0000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  qtyEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  decreaseBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  qtyNumberEdit: {
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 16,
    textAlign: 'center',
  },
  checkboxTouchTarget: {
    padding: 4,
  },
  checkboxContainer: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#888',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  removedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
    alignSelf: 'center',
    width: '100%',
  },
  removedBannerText: {
    fontSize: 13,
    fontWeight: 'bold',
    flexShrink: 1,
  },
});
