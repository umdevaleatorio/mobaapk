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
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import Colors from '../../theme/colors';
import { supabase } from '../../../data/datasources/supabase/client';
import AdminHeader from '../../components/AdminHeader';
import { AdminUserMenu } from '../../components/AdminUserMenu';
import { useTheme } from '../../contexts/ThemeContext';

// Button SVGs
import CheckIcon from '../../assets/tela7/registrar/Adicionar/Remover/Check.svg';
import DeleteProductIcon from '../../assets/tela7/excluir/Adicionar/Remover/Delete product.svg';

// Product card SVGs (using produto 1 as reusable icons)
import EditIcon from '../../assets/tela7/produtos/produto 1/Adicionar/Remover/Edit.svg';
import TrashIcon from '../../assets/tela7/produtos/produto 1/Adicionar/Remover/Trash.svg';
import CardSeparator from '../../assets/tela7/produtos/produto 1/Adicionar/Remover/Separador 1.svg';
import AtivoSvg from '../../assets/tela7/produtos/produto 1/Adicionar/Remover/Ativo.svg';
import ToggleActiveSvg from '../../assets/tela7/produtos/produto 1/Adicionar/Remover/Botão desativar.svg';
import DesativadoSvg from '../../assets/tela7/produtos/produto 4/Adicionar/Remover/Desativado.svg';
import ToggleInactiveSvg from '../../assets/tela7/produtos/produto 4/Adicionar/Remover/Botão desativar.svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Ração': ['ração', 'racao', 'dog chow', 'pedigree', 'besser', 'purina', 'whiskas', 'granplus', 'premium', 'cão', 'cães', 'gato', 'gatos', 'vaca', 'porco'],
  'Pesca': ['pesca', 'vara', 'anzol', 'linha', 'molinete', 'boia', 'bóia', 'isca', 'carretilha'],
  'Sementes': ['semente', 'semeadura', 'sementes', 'girassol', 'milho', 'alpiste'],
  'Adubo': ['adubo', 'fertilizante', 'terra', 'substrato', 'humus', 'húmus', 'calpiso', 'calcario']
};

const isProductInCategories = (product: any, categories: string[]) => {
  if (categories.length === 0) return true;
  
  const name = (product.name || '').toLowerCase();
  const description = (product.description || '').toLowerCase();
  
  return categories.some(category => {
    const keywords = CATEGORY_KEYWORDS[category] || [];
    return keywords.some(keyword => 
      name.includes(keyword.toLowerCase()) || 
      description.includes(keyword.toLowerCase())
    );
  });
};

export default function ManageProductsScreen() {
  const { colors, isDarkMode } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [hasError, setHasError] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Ativos' | 'Inativos'>('Todos');
  
  // Selection mode for mass deletion
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  const fetchProducts = async () => {
    setLoading(true);
    setHasError(false);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (!error) {
      setProducts(data || []);
    } else {
      setProducts([]);
      setHasError(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const paramsSearchText = route.params?.searchText;
      const paramsCategories = route.params?.categories;

      if (paramsSearchText !== undefined || paramsCategories !== undefined) {
        const text = paramsSearchText || '';
        const cats = paramsCategories || [];
        setSearchText(text);
        setActiveCategories(cats);
        setStatusFilter('Todos');
        fetchProducts();
        // Clear navigation params
        navigation.setParams({ searchText: undefined, categories: undefined });
      } else {
        setSearchText('');
        setActiveCategories([]);
        setStatusFilter('Todos');
        fetchProducts();
      }
    });
    return unsubscribe;
  }, [navigation, route.params]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = isProductInCategories(p, activeCategories);
    const isActive = p.active !== false;
    
    if (statusFilter === 'Ativos') {
      return matchesSearch && matchesCategory && isActive;
    }
    if (statusFilter === 'Inativos') {
      return matchesSearch && matchesCategory && !isActive;
    }
    return matchesSearch && matchesCategory;
  });

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
        { backgroundColor: isDarkMode ? colors.cardBackground : '#E3E4EB' },
        isSelected && styles.selectedCard,
        !isActive && styles.cardInactive,
      ]}>
        {/* Edit icon - top-right area, inside the bounds to ensure touch event works on Android */}
        <TouchableOpacity 
          style={styles.editIconBtn}
          onPress={() => {
            if (!selectionMode) navigation.navigate('ProductEditScreen', { product: item });
          }}
        >
          <EditIcon width={20} height={20} fill={isDarkMode ? '#FFE082' : '#6C6C6C'} color={isDarkMode ? '#FFE082' : '#6C6C6C'} />
        </TouchableOpacity>

        {/* Trash icon - bottom-right, inside the bounds to ensure touch event works on Android */}
        <TouchableOpacity 
          style={styles.trashIconBtn}
          onPress={() => {
            if (!selectionMode) deleteProduct(item.id);
          }}
        >
          <TrashIcon width={19} height={20} fill={isDarkMode ? '#FFFFFF' : undefined} stroke={isDarkMode ? '#FFFFFF' : undefined} />
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
                {isSelected && <Text style={styles.checkmark}>X</Text>}
              </View>
            </TouchableOpacity>
          )}

          {/* Product Photo */}
          <View style={styles.productImageWrapper}>
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.productImage} resizeMode="cover" />
            ) : (
              <View style={[styles.productImage, styles.noImage, { backgroundColor: isDarkMode ? '#1E1E24' : '#FFFFFF' }]}>
                <Text style={[styles.noImageText, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>Sem{'\n'}Foto</Text>
              </View>
            )}
          </View>

          {/* Separator 1 */}
          <View style={{ width: 1, height: '100%', backgroundColor: isDarkMode ? '#18181C' : '#F5F5F5' }} />

          {/* Name column */}
          <View style={styles.nameColumn}>
            <Text style={[styles.columnHeader, { color: colors.textDark }]}>Nome do{'\n'}produto</Text>
            <Text style={[styles.productName, { color: colors.textDark }]} numberOfLines={2}>{item.name || 'Sem nome'}</Text>
          </View>

          {/* Separator 2 */}
          <View style={{ width: 1, height: '100%', backgroundColor: isDarkMode ? '#18181C' : '#F5F5F5' }} />

          {/* Quantidade column */}
          <View style={styles.quantityColumn}>
            <Text style={[styles.columnHeader, { color: colors.textDark }]}>Quantidade</Text>
            <Text style={[styles.quantityValue, { color: colors.textDark }]}>{item.stock || 0}</Text>
          </View>

          {/* Separator 3 */}
          <View style={{ width: 1, height: '100%', backgroundColor: isDarkMode ? '#18181C' : '#F5F5F5' }} />

          {/* Situação column */}
          <View style={styles.statusColumn}>
            <Text style={[styles.columnHeader, { color: colors.textDark }]}>Situação</Text>
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

  const labelColor = isDarkMode ? '#FFFFFF' : '#8A7268';
  const sepColor = isDarkMode ? 'rgba(255,255,255,0.2)' : '#8A7268';

  return (
    <View style={[styles.mainContainer, { backgroundColor: isDarkMode ? '#18181C' : '#F5F5F5' }]}>
      <StatusBar backgroundColor={colors.headerBackground} barStyle="light-content" />

      {/* Header with search bar */}
      <AdminHeader title="gerenciar" searchValue={searchText} onSearchChange={setSearchText} />

      {/* Filter Bar - centered with rounded background, wider */}
      <View style={[styles.filterContainer, { backgroundColor: isDarkMode ? '#18181C' : '#F5F5F5' }]}>
        <View style={[styles.filterPill, { backgroundColor: isDarkMode ? '#2E2E38' : '#E3E4EB' }]}>
          {/* FiltroIcon + texto */}
          <View style={styles.filterBtn}>
            <Feather name="sliders" size={12} color={labelColor} />
            <Text style={[styles.filterBtnText, { color: labelColor }]}>Filtro</Text>
          </View>

          <View style={[styles.filterSep, { backgroundColor: sepColor }]} />

          <Text style={[styles.categoryLabelText, { color: labelColor }]}>Categoria</Text>

          <View style={[styles.filterSep, { backgroundColor: sepColor }]} />

          {/* Tags — com destaque no ativo */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesRow}
          >
            {['Ração', 'Pesca', 'Sementes', 'Adubo'].map((category) => {
              const isSelected = activeCategories.includes(category);
              
              let tagBg = 'transparent';
              if (isSelected) {
                tagBg = '#5B86E5';
              }

              let tagTextColor = isDarkMode ? '#FFFFFF' : '#8A7268';
              if (isSelected) {
                tagTextColor = '#FFFFFF';
              }

              return (
                <TouchableOpacity
                  key={category}
                  onPress={() => {
                    setActiveCategories(prev =>
                      prev.includes(category)
                        ? prev.filter(c => c !== category)
                        : [...prev, category]
                    );
                  }}
                  activeOpacity={0.7}
                  style={[
                    styles.tagItem,
                    { backgroundColor: tagBg }
                  ]}
                >
                  <Text 
                    style={[
                      styles.tagText, 
                      { 
                        color: tagTextColor,
                        fontWeight: isSelected ? 'bold' : 'normal'
                      }
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* Action Buttons: Registrar & Excluir - bigger */}
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity 
          style={styles.registerBtn}
          onPress={() => navigation.navigate('ProductCreateScreen')}
        >
          <CheckIcon width={34} height={34} fill={isDarkMode ? '#FFFFFF' : undefined} stroke={isDarkMode ? '#FFFFFF' : undefined} />
          <Text style={styles.actionBtnText}>Registrar produto</Text>
        </TouchableOpacity>

        <View style={styles.deleteColumnContainer}>
          <TouchableOpacity 
            style={[styles.massDeleteBtn, selectionMode && styles.massDeleteBtnActive]}
            onPress={handleMassDelete}
          >
            <DeleteProductIcon 
              width={33} 
              height={32} 
              fill={isDarkMode ? '#FFFFFF' : undefined} 
              stroke={isDarkMode ? '#FFFFFF' : undefined} 
              style={{ marginRight: 8 }}
            />
            {selectionMode ? (
              <Text style={styles.massDeleteBtnText}>
                Confirmar ({selectedProductIds.size})
              </Text>
            ) : (
              <Text style={styles.actionBtnText}>Excluir produto</Text>
            )}
          </TouchableOpacity>

          {selectionMode && (
            <TouchableOpacity 
              style={[styles.cancelSelectionBtn, { backgroundColor: isDarkMode ? '#2E2E38' : '#E3E4EB' }]} 
              onPress={() => {
                setSelectionMode(false);
                setSelectedProductIds(new Set());
              }}
            >
              <Text style={[styles.cancelSelectionText, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>
                Cancelar Seleção
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Status Filter Buttons */}
      <View style={styles.statusFilterRow}>
        {(['Todos', 'Ativos', 'Inativos'] as const).map((status) => {
          const isSelected = statusFilter === status;
          let btnBg = isDarkMode ? '#2E2E38' : '#EAEAEF';
          let textColor = isDarkMode ? '#FFFFFF' : '#1C2434';

          if (isSelected) {
            textColor = '#FFFFFF';
            if (status === 'Todos') btnBg = '#3B82F6';
            else if (status === 'Ativos') btnBg = '#22C55E';
            else btnBg = '#EF4444';
          }

          return (
            <TouchableOpacity
              key={status}
              style={[styles.statusFilterBtn, { backgroundColor: btnBg }]}
              onPress={() => setStatusFilter(status)}
              activeOpacity={0.8}
            >
              <Text style={[styles.statusFilterText, { color: textColor }]}>
                {status}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

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
              <Text style={[styles.emptyText, { color: isDarkMode ? '#8E8E93' : '#919191', textAlign: 'center' }]}>
                {hasError ? "Não foi possível carregar os produtos." : "Este produto não foi encontrado/registrado ainda."}
              </Text>
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
  filterPill: {
    flexDirection: 'row',
    borderRadius: 30,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 10,
    width: '95%',
    alignSelf: 'center',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterSep: {
    width: 1,
    height: 20,
    backgroundColor: '#8A7268',
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  categoryLabelText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 10,
  },
  tagItem: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
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
    justifyContent: 'center',
    gap: 6,
    height: 46,
  },
  massDeleteBtn: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#A72424',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
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
  deleteColumnContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  cancelSelectionBtn: {
    width: '105%',
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  cancelSelectionText: {
    fontWeight: 'bold',
    fontSize: 13,
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
    borderWidth: 1.2,
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
  // Edit icon - top right corner, positioned over the edge
  editIconBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 10,
    padding: 6,
  },
  // Trash icon - bottom right corner, positioned over the edge
  trashIconBtn: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    zIndex: 10,
    padding: 6,
  },
  statusFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 10,
    marginTop: 4,
  },
  statusFilterBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 2,
  },
  statusFilterText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
