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
  Modal,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import Colors from '../../theme/colors';
import { supabase } from '../../../data/datasources/supabase/client';
import AdminHeader from '../../components/AdminHeader';
import { AdminUserMenu } from '../../components/AdminUserMenu';
import { useTheme } from '../../contexts/ThemeContext';

function getFirstImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
    } catch (_) {}
  }
  return url;
}

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
  const [alertYellowFilter, setAlertYellowFilter] = useState(false);
  const [alertRedFilter, setAlertRedFilter] = useState(false);
  
  // Unified modal filter state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempStatusFilter, setTempStatusFilter] = useState<'Todos' | 'Ativos' | 'Inativos'>('Todos');
  const [tempAlertYellowFilter, setTempAlertYellowFilter] = useState(false);
  const [tempAlertRedFilter, setTempAlertRedFilter] = useState(false);
  
  // Selection mode for mass deletion
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [dismissedProductIds, setDismissedProductIds] = useState<Set<string>>(new Set());
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);

  const dismissAlert = (id: string) => {
    setDismissedProductIds(prev => {
      const newSet = new Set(prev);
      newSet.add(id);
      return newSet;
    });
  };

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
      setDismissedProductIds(new Set());
      const paramsSearchText = route.params?.searchText;
      const paramsCategories = route.params?.categories;

      if (paramsSearchText !== undefined || paramsCategories !== undefined) {
        const text = paramsSearchText || '';
        const cats = paramsCategories || [];
        setSearchText(text);
        setActiveCategories(cats);
        setStatusFilter('Todos');
        setAlertYellowFilter(false);
        setAlertRedFilter(false);
        fetchProducts();
        // Clear navigation params
        navigation.setParams({ searchText: undefined, categories: undefined });
      } else {
        setSearchText('');
        setActiveCategories([]);
        setStatusFilter('Todos');
        setAlertYellowFilter(false);
        setAlertRedFilter(false);
        fetchProducts();
      }
    });
    return unsubscribe;
  }, [navigation, route.params]);

  const handleOpenFilterModal = () => {
    setTempStatusFilter(statusFilter);
    setTempAlertYellowFilter(alertYellowFilter);
    setTempAlertRedFilter(alertRedFilter);
    setShowFilterModal(true);
  };

  const handleSelectStatus = (status: 'Todos' | 'Ativos' | 'Inativos') => {
    setTempStatusFilter(status);
    if (status === 'Inativos') {
      setTempAlertYellowFilter(false);
      setTempAlertRedFilter(false);
    }
  };

  const handleToggleYellow = () => {
    if (tempStatusFilter === 'Inativos') return;
    setTempAlertYellowFilter(!tempAlertYellowFilter);
  };

  const handleToggleRed = () => {
    if (tempStatusFilter === 'Inativos') return;
    setTempAlertRedFilter(!tempAlertRedFilter);
  };

  const handleApplyFilters = () => {
    setStatusFilter(tempStatusFilter);
    setAlertYellowFilter(tempAlertYellowFilter);
    setAlertRedFilter(tempAlertRedFilter);
    setShowFilterModal(false);
  };

  const filteredProductsRaw = products.filter(p => {
    const name = (p.name || '').toLowerCase();
    const desc = (p.description || '').toLowerCase();
    const query = searchText.toLowerCase();
    const matchesSearch = name.includes(query) || desc.includes(query);
    const matchesCategory = isProductInCategories(p, activeCategories);
    const isActive = p.active !== false;
    const stock = p.stock || 0;
    
    // 1. Status Filter
    if (statusFilter === 'Ativos') {
      if (!isActive) return false;
    } else if (statusFilter === 'Inativos') {
      if (isActive) return false;
    }
    
    // 2. Alert Filters
    if (alertYellowFilter || alertRedFilter) {
      const isRed = stock < 10;
      const isYellow = stock >= 10 && stock <= 29;
      
      if (alertYellowFilter && alertRedFilter) {
        if (!isRed && !isYellow) return false;
      } else if (alertRedFilter) {
        if (!isRed) return false;
      } else if (alertYellowFilter) {
        if (!isYellow) return false;
      }
    }
    
    return matchesSearch && matchesCategory;
  });

  // Prioritize Red alerts first, then Yellow alerts, when warnings are enabled
  const filteredProducts = (alertYellowFilter || alertRedFilter)
    ? [...filteredProductsRaw].sort((a, b) => {
        const stockA = a.stock || 0;
        const stockB = b.stock || 0;
        
        const isRedA = stockA < 10;
        const isRedB = stockB < 10;
        const isYellowA = stockA >= 10 && stockA <= 29;
        const isYellowB = stockB >= 10 && stockB <= 29;
        
        if (isRedA && !isRedB) return -1;
        if (!isRedA && isRedB) return 1;
        if (isYellowA && !isYellowB && !isRedB) return -1;
        if (!isYellowA && isYellowB && !isRedA) return 1;
        
        return 0;
      })
    : filteredProductsRaw;

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

  const handleSelectAllBtn = () => {
    const allFilteredIds = filteredProducts.map(p => p.id);
    const areAllSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedProductIds.has(id));
    
    if (areAllSelected) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(allFilteredIds));
      setSelectionMode(true);
    }
  };

  const handleDeactivateAll = () => {
    const activeVisibleProducts = filteredProducts.filter(p => p.active !== false);
    if (activeVisibleProducts.length === 0) {
      Alert.alert('Aviso', 'Não há produtos ativos na lista filtrada para desativar.');
      return;
    }

    Alert.alert(
      'Desativar Produtos',
      `Tem certeza de que deseja desativar todos os ${activeVisibleProducts.length} produtos ativos filtrados simultaneamente?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desativar Todos',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const activeIds = activeVisibleProducts.map(p => p.id);
            try {
              const { error } = await supabase
                .from('products')
                .update({ active: false })
                .in('id', activeIds);

              if (!error) {
                setProducts(prev => prev.map(p => activeIds.includes(p.id) ? { ...p, active: false } : p));
                Alert.alert('Sucesso', 'Todos os produtos filtrados foram desativados.');
              } else {
                Alert.alert('Erro', 'Não foi possível desativar os produtos.');
              }
            } catch (err) {
              console.error(err);
              Alert.alert('Erro', 'Ocorreu um erro ao desativar os produtos.');
            } finally {
              setLoading(false);
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

    // Show the custom high-fidelity red warning modal instead of standard Alert!
    setShowConfirmDeleteModal(true);
  };

  const confirmMassDelete = async () => {
    setShowConfirmDeleteModal(false);
    setLoading(true);
    try {
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
    } catch (err) {
      console.error(err);
      Alert.alert('Erro', 'Ocorreu um erro ao realizar a exclusão.');
    } finally {
      setLoading(false);
    }
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
    const stock = item.stock || 0;
    const stockColor = stock < 10 ? '#FF3B30' : (stock <= 29 ? '#FFE082' : '#00BFA5');

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
              <Image source={{ uri: getFirstImageUrl(item.image_url) || '' }} style={styles.productImage} resizeMode="cover" />
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
            <Text style={[styles.quantityValue, { color: stockColor }]}>{stock}</Text>
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

        {/* Warning alerts directly under the cardRow */}
        {!dismissedProductIds.has(item.id) && (
          stock < 10 ? (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderRadius: 10,
              backgroundColor: isDarkMode ? '#2C1D1E' : '#FFF0F0',
              borderColor: '#FF3B30',
              marginHorizontal: 8,
              marginBottom: 8,
              marginTop: 4,
              position: 'relative',
            }}>
              <Feather name="alert-circle" size={14} color="#FF3B30" style={{ marginRight: 6 }} />
              <Text style={{
                fontSize: 11,
                fontWeight: 'bold',
                color: isDarkMode ? '#FF8A8A' : '#D32F2F',
                flexShrink: 1,
                lineHeight: 15,
                paddingRight: 16,
              }}>
                {`${item.name} está esgotando, adicione mais ao estoque para manter ativo ou espere acabar para auto-desativação.`}
              </Text>
              <TouchableOpacity
                onPress={() => dismissAlert(item.id)}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  padding: 2,
                }}
              >
                <Feather name="x" size={14} color={isDarkMode ? '#FF8A8A' : '#D32F2F'} />
              </TouchableOpacity>
            </View>
          ) : stock <= 29 ? (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 8,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderRadius: 10,
              backgroundColor: isDarkMode ? '#2C2B1D' : '#FFFDE6',
              borderColor: '#FFB300',
              marginHorizontal: 8,
              marginBottom: 8,
              marginTop: 4,
              position: 'relative',
            }}>
              <Feather name="alert-triangle" size={14} color="#FFB300" style={{ marginRight: 6 }} />
              <Text style={{
                fontSize: 11,
                fontWeight: 'bold',
                color: isDarkMode ? '#FFE082' : '#B78103',
                flexShrink: 1,
                lineHeight: 15,
                paddingRight: 16,
              }}>
                {`${item.name} está com estoque moderado (${stock} unidades). Considere reabastecer em breve.`}
              </Text>
              <TouchableOpacity
                onPress={() => dismissAlert(item.id)}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  padding: 2,
                }}
              >
                <Feather name="x" size={14} color={isDarkMode ? '#FFE082' : '#B78103'} />
              </TouchableOpacity>
            </View>
          ) : null
        )}
      </View>
    );
  };

  const labelColor = isDarkMode ? '#FFFFFF' : '#8A7268';
  const sepColor = isDarkMode ? 'rgba(255,255,255,0.2)' : '#8A7268';

  const getFilterLabel = () => {
    let parts: string[] = [];
    if (statusFilter !== 'Todos') {
      parts.push(statusFilter);
    }
    if (alertYellowFilter) {
      parts.push('Moderado');
    }
    if (alertRedFilter) {
      parts.push('Crítico');
    }
    if (parts.length === 0) return 'Filtro';
    return parts.join(' + ');
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: isDarkMode ? '#18181C' : '#F5F5F5' }]}>
      <StatusBar backgroundColor={colors.headerBackground} barStyle="light-content" />

      {/* Header with search bar */}
      <AdminHeader title="gerenciar" searchValue={searchText} onSearchChange={setSearchText} />

      {/* Filter Bar - centered with rounded background, wider */}
      <View style={[styles.filterContainer, { backgroundColor: isDarkMode ? '#18181C' : '#F5F5F5' }]}>
        <View style={[styles.filterPill, { backgroundColor: isDarkMode ? '#2E2E38' : '#E3E4EB' }]}>
          {/* FiltroIcon + texto */}
          <TouchableOpacity 
            style={styles.filterBtn}
            onPress={handleOpenFilterModal}
            activeOpacity={0.7}
          >
            <Feather name="sliders" size={12} color={labelColor} />
            <Text style={[styles.filterBtnText, { color: labelColor }]}>{getFilterLabel()}</Text>
            <Feather name="chevron-down" size={12} color={labelColor} style={{ marginLeft: 2 }} />
          </TouchableOpacity>

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
                tagBg = isDarkMode ? '#5B86E5' : '#E3DAD9';
              }

              let tagTextColor = isDarkMode ? '#FFFFFF' : '#8A7268';
              if (isSelected) {
                tagTextColor = isDarkMode ? '#FFFFFF' : '#9C3F07';
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
        <View style={styles.deleteColumnContainer}>
          <TouchableOpacity 
            style={styles.registerBtn}
            onPress={() => navigation.navigate('ProductCreateScreen')}
          >
            <CheckIcon width={34} height={34} fill={isDarkMode ? '#FFFFFF' : undefined} stroke={isDarkMode ? '#FFFFFF' : undefined} />
            <Text style={styles.actionBtnText}>Registrar produto</Text>
          </TouchableOpacity>
        </View>

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
        </View>
      </View>

      {/* Secondary Action Row: Selecionar tudo & Desativar todos / Cancelar seleção */}
      <View style={styles.secondaryActionsRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleSelectAllBtn}
          style={[styles.secondaryBtn, { backgroundColor: isDarkMode ? '#2E2E38' : '#E3E4EB' }]}
        >
          <Text style={[styles.secondaryBtnText, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>
            {filteredProducts.length > 0 && filteredProducts.every(p => selectedProductIds.has(p.id))
              ? "Deselecionar tudo"
              : "Selecionar tudo"
            }
          </Text>
        </TouchableOpacity>

        {selectionMode ? (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              setSelectionMode(false);
              setSelectedProductIds(new Set());
            }}
            style={[styles.secondaryBtn, { backgroundColor: isDarkMode ? '#2E2E38' : '#E3E4EB' }]}
          >
            <Text style={[styles.secondaryBtnText, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>
              Cancelar Seleção
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleDeactivateAll}
            style={[
              styles.secondaryBtn, 
              { 
                backgroundColor: '#FFFFFF'
              }
            ]}
          >
            <Text style={[styles.secondaryBtnText, { color: '#FF3B30' }]}>
              Desativar todos
            </Text>
          </TouchableOpacity>
        )}
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

      {/* ========== CUSTOM DESTRUCTIVE DELETE WARNING MODAL ========== */}
      <Modal visible={showConfirmDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.whiteModalContainer, { backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF' }]}>
            <Text style={[styles.whiteModalTitle, { color: '#FF3B30', fontSize: 18, fontWeight: 'bold' }]}>
              Atenção: Ação Destrutiva!
            </Text>
            
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 12,
              paddingHorizontal: 14,
              borderWidth: 1,
              borderRadius: 10,
              backgroundColor: isDarkMode ? '#2C1D1E' : '#FFF0F0',
              borderColor: '#FF3B30',
              marginVertical: 15,
            }}>
              <Feather name="alert-circle" size={18} color="#FF3B30" style={{ marginRight: 8 }} />
              <Text style={{
                fontSize: 12,
                fontWeight: 'bold',
                color: isDarkMode ? '#FF8A8A' : '#D32F2F',
                flex: 1,
                lineHeight: 16,
              }}>
                {`Tem certeza de que o proprietário quer prosseguir? Esta ação é irreversível e excluirá permanentemente os ${selectedProductIds.size} produtos selecionados do banco de dados.`}
              </Text>
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity 
                style={[styles.modalConfirmBtn, { backgroundColor: '#A72424' }]}
                activeOpacity={0.7}
                onPress={confirmMassDelete}
              >
                <Text style={styles.modalConfirmText}>Sim, Excluir Definitivamente</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalCancelBtn, { borderColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]}
                activeOpacity={0.7}
                onPress={() => setShowConfirmDeleteModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========== UNIFIED FILTER MODAL (SITUAÇÃO & ALERTA DE ESTOQUE) ========== */}
      <Modal visible={showFilterModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.whiteModalContainer, { backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF' }]}>
            <Text style={[styles.whiteModalTitle, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>Filtrar Produtos</Text>
            
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
              {/* SUBSECTION 1: SITUAÇÃO */}
              <Text style={[styles.modalSubsectionHeader, { color: isDarkMode ? '#FFE082' : '#F97D01' }]}>Situação</Text>
              
              {['Todos', 'Ativos', 'Inativos'].map((statusOption) => {
                const label = statusOption === 'Todos' ? 'Todos os produtos' : statusOption === 'Ativos' ? 'Somente ativos' : 'Somente inativos';
                const isSelected = tempStatusFilter === statusOption;
                const isDisabled = statusOption === 'Inativos' && (tempAlertYellowFilter || tempAlertRedFilter);

                return (
                  <TouchableOpacity
                    key={statusOption}
                    activeOpacity={isDisabled ? 1 : 0.7}
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: isDarkMode ? '#3E3E4A' : '#E3E4EB',
                      opacity: isDisabled ? 0.4 : 1,
                    }}
                    onPress={() => {
                      if (!isDisabled) {
                        handleSelectStatus(statusOption as any);
                      }
                    }}
                  >
                    <Text style={{
                      fontSize: 14,
                      color: isDarkMode ? '#FFFFFF' : '#1C2434',
                      fontWeight: isSelected ? 'bold' : 'normal',
                      flex: 1,
                    }}>
                      {label}
                    </Text>
                    <View style={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      borderWidth: 1.5,
                      borderColor: isSelected ? '#25BE36' : (isDarkMode ? '#888888' : '#A8A8B3'),
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {isSelected && (
                        <View style={{
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: '#25BE36',
                        }} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* SUBSECTION 2: ALERTA DE ESTOQUE */}
              <Text style={[styles.modalSubsectionHeader, { color: isDarkMode ? '#FFE082' : '#F97D01', marginTop: 20, marginBottom: 10 }]}>Alertas de estoque</Text>

              {/* Yellow Alert Option Box */}
              <TouchableOpacity
                activeOpacity={tempStatusFilter === 'Inativos' ? 1 : 0.7}
                onPress={handleToggleYellow}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderWidth: 1,
                  borderRadius: 10,
                  backgroundColor: tempStatusFilter === 'Inativos' 
                    ? (isDarkMode ? '#222225' : '#F0F0F2') 
                    : (tempAlertYellowFilter 
                        ? (isDarkMode ? '#3D381D' : '#FFEBA3') 
                        : (isDarkMode ? '#2C2B1D' : '#FFFDE6')),
                  borderColor: tempStatusFilter === 'Inativos' ? '#CCCCCC' : '#FFB300',
                  marginBottom: 10,
                  opacity: tempStatusFilter === 'Inativos' ? 0.4 : 1,
                }}
              >
                <Feather name="alert-triangle" size={16} color={tempStatusFilter === 'Inativos' ? '#888888' : '#FFB300'} style={{ marginRight: 8 }} />
                <Text style={{
                  fontSize: 12,
                  fontWeight: 'bold',
                  color: tempStatusFilter === 'Inativos' 
                    ? '#888888' 
                    : (isDarkMode ? '#FFE082' : '#B78103'),
                  flex: 1,
                }}>
                  Estoque Moderado (Alerta Amarelo)
                </Text>
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  borderWidth: 1.2,
                  borderColor: tempStatusFilter === 'Inativos' ? '#888888' : '#FFB300',
                  backgroundColor: tempAlertYellowFilter ? '#FFB300' : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {tempAlertYellowFilter && <Feather name="check" size={12} color="#FFFFFF" />}
                </View>
              </TouchableOpacity>

              {/* Red Alert Option Box */}
              <TouchableOpacity
                activeOpacity={tempStatusFilter === 'Inativos' ? 1 : 0.7}
                onPress={handleToggleRed}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderWidth: 1,
                  borderRadius: 10,
                  backgroundColor: tempStatusFilter === 'Inativos' 
                    ? (isDarkMode ? '#222225' : '#F0F0F2') 
                    : (tempAlertRedFilter 
                        ? (isDarkMode ? '#4D1D1E' : '#FFC7C7') 
                        : (isDarkMode ? '#2C1D1E' : '#FFF0F0')),
                  borderColor: tempStatusFilter === 'Inativos' ? '#CCCCCC' : '#FF3B30',
                  marginBottom: 10,
                  opacity: tempStatusFilter === 'Inativos' ? 0.4 : 1,
                }}
              >
                <Feather name="alert-circle" size={16} color={tempStatusFilter === 'Inativos' ? '#888888' : '#FF3B30'} style={{ marginRight: 8 }} />
                <Text style={{
                  fontSize: 12,
                  fontWeight: 'bold',
                  color: tempStatusFilter === 'Inativos' 
                    ? '#888888' 
                    : (isDarkMode ? '#FF8A8A' : '#D32F2F'),
                  flex: 1,
                }}>
                  Estoque Crítico (Alerta Vermelho)
                </Text>
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  borderWidth: 1.2,
                  borderColor: tempStatusFilter === 'Inativos' ? '#888888' : '#FF3B30',
                  backgroundColor: tempAlertRedFilter ? '#FF3B30' : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {tempAlertRedFilter && <Feather name="check" size={12} color="#FFFFFF" />}
                </View>
              </TouchableOpacity>
            </ScrollView>

            {/* Confirm / Cancel Buttons */}
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity 
                style={[styles.modalConfirmBtn, { backgroundColor: '#25BE36' }]}
                activeOpacity={0.7}
                onPress={handleApplyFilters}
              >
                <Text style={styles.modalConfirmText}>Aplicar Filtros</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalCancelBtn, { borderColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]}
                activeOpacity={0.7}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={[styles.modalCancelText, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    width: '100%',
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
    minHeight: 100,
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
    height: 100,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  whiteModalContainer: {
    borderRadius: 20,
    padding: 24,
    width: '85%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  whiteModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalSubsectionHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 6,
  },
  modalButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalConfirmBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
    marginTop: 4,
  },
  secondaryBtn: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  secondaryBtnText: {
    fontWeight: 'bold',
    fontSize: 13,
  },
});
