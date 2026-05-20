import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Colors from '../../theme/colors';
import { supabase } from '../../../data/datasources/supabase/client';
import AdminHeader from '../../components/AdminHeader';
import { AdminUserMenu } from '../../components/AdminUserMenu';

// Filter SVGs
import FiltroIcon from '../../assets/tela7/filtro/Filtro Icon.svg';
import FiltroText from '../../assets/tela7/filtro/Filtro.svg';
import CategoriaText from '../../assets/tela7/filtro/Categoria_.svg';
import RacaoText from '../../assets/tela7/filtro/Ração.svg';
import PescaText from '../../assets/tela7/filtro/Pesca.svg';
import SementesText from '../../assets/tela7/filtro/Sementes.svg';
import AduboText from '../../assets/tela7/filtro/Adubo ....svg';
import SeparadorFiltro from '../../assets/tela7/filtro/Separador.svg';

// Button SVGs
import CheckIcon from '../../assets/tela7/registrar/Adicionar/Remover/Check.svg';
import RegistrarProdutoText from '../../assets/tela7/registrar/Adicionar/Remover/Registrar produto.svg';
import DeleteProductIcon from '../../assets/tela7/excluir/Adicionar/Remover/Delete product.svg';
import ExcluirProdutoText from '../../assets/tela7/excluir/Adicionar/Remover/Excluir produto.svg';

// Product card SVGs (using produto 1 as reusable icons)
import EditIcon from '../../assets/tela7/produtos/produto 1/Adicionar/Remover/Edit.svg';
import TrashIcon from '../../assets/tela7/produtos/produto 1/Adicionar/Remover/Trash.svg';
import CardSeparator from '../../assets/tela7/produtos/produto 1/Adicionar/Remover/Separador 1.svg';
import AtivoSvg from '../../assets/tela7/produtos/produto 1/Adicionar/Remover/Ativo.svg';
import ToggleActiveSvg from '../../assets/tela7/produtos/produto 1/Adicionar/Remover/Botão desativar.svg';
import DesativadoSvg from '../../assets/tela7/produtos/produto 4/Adicionar/Remover/Desativado.svg';
import ToggleInactiveSvg from '../../assets/tela7/produtos/produto 4/Adicionar/Remover/Botão desativar.svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ManageProductsScreen() {
  const navigation = useNavigation<any>();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  // Selection mode for mass deletion
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  const fetchProducts = async () => {
    setLoading(true);
    let query = supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (activeCategory) {
      query = query.eq('category_id', activeCategory);
    }

    const { data, error } = await query;
    if (!error) {
      setProducts(data || []);
    } else {
      Alert.alert('Erro', 'Não foi possível carregar os produtos.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchProducts();
    });
    return unsubscribe;
  }, [navigation, activeCategory]);

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchText.toLowerCase())
  );

  const toggleProductStatus = async (product: any) => {
    const newStatus = !product.active;
    const { error } = await supabase
      .from('products')
      .update({ active: newStatus })
      .eq('id', product.id);

    if (!error) {
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, active: newStatus } : p));
    } else {
      Alert.alert('Erro', 'Não foi possível alterar o status do produto.');
    }
  };

  const deleteProduct = (id: string) => {
    Alert.alert(
      'Atenção',
      'Tem certeza que deseja excluir este produto? Ele será removido permanentemente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('products').delete().eq('id', id);
            if (!error) {
              setProducts(prev => prev.filter(p => p.id !== id));
            } else {
              Alert.alert('Erro', 'Não foi possível excluir o produto.');
            }
          }
        }
      ]
    );
  };

  const handleMassDelete = () => {
    if (!selectionMode) {
      setSelectionMode(true);
      return;
    }
    
    if (selectedProductIds.size === 0) {
      Alert.alert('Aviso', 'Nenhum produto selecionado para exclusão.');
      setSelectionMode(false);
      return;
    }

    Alert.alert(
      'Atenção',
      `Tem certeza que deseja excluir ${selectedProductIds.size} produtos selecionados?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const { error } = await supabase
              .from('products')
              .delete()
              .in('id', Array.from(selectedProductIds));
              
            if (!error) {
              setProducts(prev => prev.filter(p => !selectedProductIds.has(p.id)));
              setSelectedProductIds(new Set());
              setSelectionMode(false);
            } else {
              Alert.alert('Erro', 'Ocorreu um erro na exclusão em massa.');
            }
            setLoading(false);
          }
        }
      ]
    );
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedProductIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedProductIds(newSet);
  };

  // Product card - vertical list layout matching the design rigorously
  const renderProductCard = ({ item }: { item: any }) => {
    const isSelected = selectedProductIds.has(item.id);
    const isActive = item.active !== false;

    return (
      <View style={[
        styles.productCard, 
        isSelected && styles.selectedCard,
        !isActive && styles.cardInactive,
      ]}>
        {/* Edit icon - top-left area, just outside the main content */}
        <TouchableOpacity 
          style={styles.editIconBtn}
          onPress={() => {
            if (!selectionMode) navigation.navigate('ProductEditScreen', { product: item });
          }}
        >
          <EditIcon width={20} height={20} />
        </TouchableOpacity>

        {/* Trash icon - bottom-left, aligned horizontally with edit */}
        <TouchableOpacity 
          style={styles.trashIconBtn}
          onPress={() => {
            if (!selectionMode) deleteProduct(item.id);
          }}
        >
          <TrashIcon width={19} height={20} />
        </TouchableOpacity>

        {/* Main content row */}
        <View style={styles.cardRow}>
          {/* Checkbox for mass select */}
          {selectionMode && (
            <TouchableOpacity 
              style={styles.checkboxArea} 
              onPress={() => toggleSelection(item.id)}
            >
              <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
          )}

          {/* Product Photo */}
          <View style={styles.productImageWrapper}>
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.productImage} resizeMode="cover" />
            ) : (
              <View style={[styles.productImage, styles.noImage]}>
                <Text style={styles.noImageText}>Sem{'\n'}Foto</Text>
              </View>
            )}
          </View>

          {/* Separator 1 */}
          <CardSeparator width={1} height={100} />

          {/* Name column */}
          <View style={styles.nameColumn}>
            <Text style={styles.columnHeader}>Nome do{'\n'}produto</Text>
            <Text style={styles.productName} numberOfLines={2}>{item.name || 'Sem nome'}</Text>
          </View>

          {/* Separator 2 */}
          <CardSeparator width={1} height={100} />

          {/* Quantidade column */}
          <View style={styles.quantityColumn}>
            <Text style={styles.columnHeader}>Quantidade</Text>
            <Text style={styles.quantityValue}>{item.stock || 0}</Text>
          </View>

          {/* Separator 3 */}
          <CardSeparator width={1} height={100} />

          {/* Situação column */}
          <View style={styles.statusColumn}>
            <Text style={styles.columnHeader}>Situação</Text>
            {isActive ? (
              <AtivoSvg width={35} height={12} />
            ) : (
              <DesativadoSvg width={55} height={12} />
            )}
            <TouchableOpacity
              onPress={() => {
                if (!selectionMode) toggleProductStatus(item);
              }}
              style={{ marginTop: 6 }}
            >
              {isActive ? (
                <ToggleActiveSvg width={40} height={20} />
              ) : (
                <ToggleInactiveSvg width={40} height={20} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar backgroundColor="#1C2434" barStyle="light-content" />

      {/* Header with search bar */}
      <AdminHeader title="gerenciar" searchValue={searchText} onSearchChange={setSearchText} />

      {/* Filter Bar - centered with rounded background, wider */}
      <View style={styles.filterContainer}>
        <View style={styles.filterBar}>
          <FiltroIcon width={14} height={14} />
          <FiltroText width={28} height={11} />
          <SeparadorFiltro width={1} height={22} />
          <CategoriaText width={58} height={13} />
          <TouchableOpacity 
            style={[styles.filterTag, activeCategory === 'Ração' && styles.filterTagActive]}
            onPress={() => setActiveCategory(activeCategory === 'Ração' ? null : 'Ração')}
          >
            <RacaoText width={36} height={13} />
          </TouchableOpacity>
          <SeparadorFiltro width={1} height={22} />
          <TouchableOpacity 
            style={[styles.filterTag, activeCategory === 'Pesca' && styles.filterTagActive]}
            onPress={() => setActiveCategory(activeCategory === 'Pesca' ? null : 'Pesca')}
          >
            <PescaText width={35} height={11} />
          </TouchableOpacity>
          <SeparadorFiltro width={1} height={22} />
          <TouchableOpacity 
            style={[styles.filterTag, activeCategory === 'Sementes' && styles.filterTagActive]}
            onPress={() => setActiveCategory(activeCategory === 'Sementes' ? null : 'Sementes')}
          >
            <SementesText width={56} height={11} />
          </TouchableOpacity>
          <SeparadorFiltro width={1} height={22} />
          <TouchableOpacity 
            style={[styles.filterTag, activeCategory === 'Adubo' && styles.filterTagActive]}
            onPress={() => setActiveCategory(activeCategory === 'Adubo' ? null : 'Adubo')}
          >
            <AduboText width={62} height={11} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Buttons: Registrar & Excluir - bigger */}
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity 
          style={styles.registerBtn}
          onPress={() => navigation.navigate('ProductCreateScreen')}
        >
          <CheckIcon width={34} height={34} />
          <RegistrarProdutoText width={130} height={20} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.massDeleteBtn, selectionMode && styles.massDeleteBtnActive]}
          onPress={handleMassDelete}
        >
          <DeleteProductIcon width={33} height={32} />
          {selectionMode ? (
            <Text style={styles.massDeleteBtnText}>
              Confirmar ({selectedProductIds.size})
            </Text>
          ) : (
            <ExcluirProdutoText width={115} height={20} />
          )}
        </TouchableOpacity>
      </View>

      {/* Cancel Selection Mode Button */}
      {selectionMode && (
        <TouchableOpacity style={styles.cancelSelectionBtn} onPress={() => {
          setSelectionMode(false);
          setSelectedProductIds(new Set());
        }}>
          <Text style={styles.cancelSelectionText}>Cancelar Seleção</Text>
        </TouchableOpacity>
      )}

      {/* ========== LISTA DE PRODUTOS (vertical) ========== */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryDark} />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProductCard}
          contentContainerStyle={styles.productsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhum produto encontrado</Text>
            </View>
          }
        />
      )}

      {/* Padding for bottom tab bar */}
      <View style={{ height: 100 }} />

      {/* Global Admin Menu Modal */}
      <AdminUserMenu />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  // ===== FILTER =====
  filterContainer: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3E4EB',
    borderRadius: 25,
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 6,
  },
  filterTag: {
    paddingHorizontal: 3,
    paddingVertical: 3,
    borderRadius: 4,
  },
  filterTagActive: {
    backgroundColor: 'rgba(249, 125, 1, 0.2)',
    borderRadius: 6,
  },
  // ===== ACTION BUTTONS =====
  actionButtonsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
    marginTop: 2,
  },
  registerBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#339914',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
    height: 46,
  },
  massDeleteBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#A72424',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
    height: 46,
  },
  massDeleteBtnActive: {
    backgroundColor: '#7A1A1A',
  },
  massDeleteBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  cancelSelectionBtn: {
    marginHorizontal: 16,
    marginBottom: 10,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#CCC',
    alignItems: 'center',
  },
  cancelSelectionText: {
    color: '#1C2434',
    fontWeight: 'bold',
  },
  // ===== PRODUCTS LIST =====
  productsList: {
    paddingHorizontal: 12,
    paddingBottom: 20,
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
    color: '#767676',
    fontSize: 16,
  },
  // ===== PRODUCT CARD =====
  productCard: {
    backgroundColor: '#E3E4EB',
    borderRadius: 15,
    height: 100,
    marginBottom: 12,
    position: 'relative',
    justifyContent: 'center',
  },
  cardInactive: {
    opacity: 0.5,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#F97D01',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingRight: 30,
  },
  // Checkbox for mass select
  checkboxArea: {
    marginLeft: 6,
    marginRight: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#A72424',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#A72424',
  },
  checkmark: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  // Product photo
  productImageWrapper: {
    width: 82,
    height: 82,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    marginLeft: 10,
    marginRight: 4,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#919191',
    fontSize: 10,
    textAlign: 'center',
  },
  // Name column - balanced with quantity and status
  nameColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 4,
    paddingTop: 4,
    height: '100%',
  },
  columnHeader: {
    fontSize: 12,
    color: '#1C2434',
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  productName: {
    fontSize: 12,
    color: '#1C2434',
    textAlign: 'center',
  },
  // Quantity column - wider to balance
  quantityColumn: {
    flex: 0.8,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 2,
    paddingTop: 4,
    height: '100%',
  },
  quantityValue: {
    fontSize: 24,
    color: '#1C2434',
    marginTop: 6,
  },
  // Status column - wider to balance
  statusColumn: {
    flex: 0.8,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 2,
    paddingTop: 4,
    height: '100%',
  },
  // Edit icon - top right, more to the left
  editIconBtn: {
    position: 'absolute',
    top: -6,
    right: -4,
    zIndex: 2,
    padding: 2,
  },
  // Trash icon - bottom right, aligned with edit
  trashIconBtn: {
    position: 'absolute',
    bottom: -6,
    right: -4,
    zIndex: 2,
    padding: 2,
  },
});
