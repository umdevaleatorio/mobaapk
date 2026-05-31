import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../../../data/datasources/supabase/client';
import { useTheme } from '../../../contexts/ThemeContext';

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Ração': ['ração', 'racao', 'dog chow', 'pedigree', 'besser', 'purina', 'whiskas', 'granplus', 'premium', 'cão', 'cães', 'gato', 'gatos', 'vaca', 'porco'],
  'Pesca': ['pesca', 'vara', 'anzol', 'linha', 'molinete', 'boia', 'bóia', 'isca', 'carretilha'],
  'Sementes': ['semente', 'semeadura', 'sementes', 'girassol', 'milho', 'alpiste'],
  'Adubo': ['adubo', 'fertilizante', 'terra', 'substrato', 'humus', 'húmus', 'calpiso', 'calcario'],
};

const isProductInCategories = (product: any, categories: string[]) => {
  if (categories.length === 0) return true;
  const name = (product.name || '').toLowerCase();
  const desc = (product.description || '').toLowerCase();
  return categories.some(cat => (CATEGORY_KEYWORDS[cat] || []).some(kw => name.includes(kw) || desc.includes(kw)));
};

export function getFirstImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try { const parsed = JSON.parse(trimmed); if (Array.isArray(parsed) && parsed.length > 0) return parsed[0]; } catch (_) {}
  }
  return url;
}

export function useManageProductsScreen() {
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
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempStatusFilter, setTempStatusFilter] = useState<'Todos' | 'Ativos' | 'Inativos'>('Todos');
  const [tempAlertYellowFilter, setTempAlertYellowFilter] = useState(false);
  const [tempAlertRedFilter, setTempAlertRedFilter] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [dismissedProductIds, setDismissedProductIds] = useState<Set<string>>(new Set());
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);

  const fetchProducts = async () => {
    setLoading(true); setHasError(false);
    const { data, error } = await supabase.from('products').select('id, name, description, price, stock, active, category_id, created_at, image_url').order('created_at', { ascending: false });
    if (!error) setProducts(data || []);
    else { setProducts([]); setHasError(true); }
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      setDismissedProductIds(new Set());
      const pSearch = route.params?.searchText;
      const pCats = route.params?.categories;
      if (pSearch !== undefined || pCats !== undefined) {
        setSearchText(pSearch || ''); setActiveCategories(pCats || []);
        setStatusFilter('Todos'); setAlertYellowFilter(false); setAlertRedFilter(false);
        fetchProducts();
        navigation.setParams({ searchText: undefined, categories: undefined });
      } else {
        setSearchText(''); setActiveCategories([]);
        setStatusFilter('Todos'); setAlertYellowFilter(false); setAlertRedFilter(false);
        fetchProducts();
      }
    });
    return unsub;
  }, [navigation, route.params]);

  const dismissAlert = (id: string) => setDismissedProductIds(prev => { const n = new Set(prev); n.add(id); return n; });

  const toggleProductStatus = async (product: any) => {
    const newStatus = !product.active;
    const { error } = await supabase.from('products').update({ active: newStatus }).eq('id', product.id);
    if (!error) setProducts(prev => prev.map(p => p.id === product.id ? { ...p, active: newStatus } : p));
    else Alert.alert('Erro', 'Não foi possível alterar o status do produto.');
  };

  const deleteProduct = (id: string) => {
    Alert.alert('Atenção', 'Tem certeza que deseja excluir este produto? Ele será removido permanentemente.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (!error) setProducts(prev => prev.filter(p => p.id !== id));
        else Alert.alert('Erro', 'Não foi possível excluir o produto.');
      }}
    ]);
  };

  const filteredProductsRaw = products.filter(p => {
    const name = (p.name || '').toLowerCase();
    const desc = (p.description || '').toLowerCase();
    const q = searchText.toLowerCase();
    const matchesSearch = name.includes(q) || desc.includes(q);
    const matchesCategory = isProductInCategories(p, activeCategories);
    const isActive = p.active !== false;
    const stock = p.stock || 0;
    if (statusFilter === 'Ativos' && !isActive) return false;
    if (statusFilter === 'Inativos' && isActive) return false;
    if (alertYellowFilter || alertRedFilter) {
      const isRed = stock < 10;
      const isYellow = stock >= 10 && stock <= 29;
      if (alertYellowFilter && alertRedFilter && !isRed && !isYellow) return false;
      if (alertRedFilter && !isRed) return false;
      if (alertYellowFilter && !isYellow) return false;
    }
    return matchesSearch && matchesCategory;
  });

  const filteredProducts = (alertYellowFilter || alertRedFilter)
    ? [...filteredProductsRaw].sort((a, b) => {
        const sA = a.stock || 0, sB = b.stock || 0;
        const rA = sA < 10, rB = sB < 10;
        const yA = sA >= 10 && sA <= 29, yB = sB >= 10 && sB <= 29;
        if (rA && !rB) return -1; if (!rA && rB) return 1;
        if (yA && !yB && !rB) return -1; if (!yA && yB && !rA) return 1;
        return 0;
      })
    : filteredProductsRaw;

  const handleSelectAllBtn = () => {
    const allIds = filteredProducts.map(p => p.id);
    if (allIds.length > 0 && allIds.every(id => selectedProductIds.has(id))) setSelectedProductIds(new Set());
    else { setSelectedProductIds(new Set(allIds)); setSelectionMode(true); }
  };

  const handleDeactivateAll = () => {
    const activeVisible = filteredProducts.filter(p => p.active !== false);
    if (activeVisible.length === 0) { Alert.alert('Aviso', 'Não há produtos ativos na lista filtrada para desativar.'); return; }
    Alert.alert('Desativar Produtos', `Tem certeza de que deseja desativar todos os ${activeVisible.length} produtos ativos filtrados simultaneamente?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Desativar Todos', style: 'destructive', onPress: async () => {
        setLoading(true);
        try {
          const { error } = await supabase.from('products').update({ active: false }).in('id', activeVisible.map(p => p.id));
          if (!error) { setProducts(prev => prev.map(p => activeVisible.find(x => x.id === p.id) ? { ...p, active: false } : p)); Alert.alert('Sucesso', 'Todos os produtos filtrados foram desativados.'); }
          else Alert.alert('Erro', 'Não foi possível desativar os produtos.');
        } catch (err) { console.error(err); Alert.alert('Erro', 'Ocorreu um erro ao desativar os produtos.'); }
        finally { setLoading(false); }
      }}
    ]);
  };

  const handleMassDelete = () => {
    if (!selectionMode) { setSelectionMode(true); return; }
    if (selectedProductIds.size === 0) { Alert.alert('Aviso', 'Nenhum produto selecionado para exclusão.'); setSelectionMode(false); return; }
    setShowConfirmDeleteModal(true);
  };

  const confirmMassDelete = async () => {
    setShowConfirmDeleteModal(false); setLoading(true);
    try {
      const { error } = await supabase.from('products').delete().in('id', Array.from(selectedProductIds));
      if (!error) { setProducts(prev => prev.filter(p => !selectedProductIds.has(p.id))); setSelectedProductIds(new Set()); setSelectionMode(false); }
      else Alert.alert('Erro', 'Ocorreu um erro na exclusão em massa.');
    } catch (err) { console.error(err); Alert.alert('Erro', 'Ocorreu um erro ao realizar a exclusão.'); }
    finally { setLoading(false); }
  };

  const toggleSelection = (id: string) => {
    const n = new Set(selectedProductIds);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelectedProductIds(n);
  };

  return {
    colors, isDarkMode, navigation,
    products, loading, setLoading,
    searchText, setSearchText,
    activeCategories, setActiveCategories,
    hasError, statusFilter, setStatusFilter,
    alertYellowFilter, setAlertYellowFilter,
    alertRedFilter, setAlertRedFilter,
    showFilterModal, setShowFilterModal,
    tempStatusFilter, setTempStatusFilter,
    tempAlertYellowFilter, setTempAlertYellowFilter,
    tempAlertRedFilter, setTempAlertRedFilter,
    selectionMode, setSelectionMode,
    selectedProductIds, setSelectedProductIds,
    dismissedProductIds,
    showConfirmDeleteModal, setShowConfirmDeleteModal,
    fetchProducts,
    dismissAlert, toggleProductStatus, deleteProduct,
    filteredProducts,
    handleSelectAllBtn, handleDeactivateAll,
    handleMassDelete, confirmMassDelete, toggleSelection,
  };
}
