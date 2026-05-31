import React from 'react';
import { View, Text, StatusBar, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Colors from '../../../theme/colors';
import AdminHeader from '../../../components/AdminHeader';
import { AdminUserMenu } from '../../../components/AdminUserMenu';
import CheckIcon from '../../../assets/tela7/registrar/Adicionar/Remover/Check.svg';
import DeleteProductIcon from '../../../assets/tela7/excluir/Adicionar/Remover/Delete product.svg';
import { useManageProductsScreen } from './useManageProductsScreen';
import { ProductCard } from './ProductCard';
import { FilterModal } from './FilterModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { styles } from './styles';

const CATEGORIES = ['Ração', 'Pesca', 'Sementes', 'Adubo'];

export default function ManageProductsScreen() {
  const h = useManageProductsScreen();
  const labelColor = h.isDarkMode ? '#FFFFFF' : '#8A7268';
  const sepColor = h.isDarkMode ? 'rgba(255,255,255,0.2)' : '#8A7268';

  const getFilterLabel = () => {
    const parts: string[] = [];
    if (h.statusFilter !== 'Todos') parts.push(h.statusFilter);
    if (h.alertYellowFilter) parts.push('Moderado');
    if (h.alertRedFilter) parts.push('Crítico');
    return parts.length === 0 ? 'Filtro' : parts.join(' + ');
  };

  const renderTag = (category: string) => {
    const isSelected = h.activeCategories.includes(category);
    return (
      <TouchableOpacity key={category} onPress={() => h.setActiveCategories(prev => prev.includes(category) ? prev.filter((c: string) => c !== category) : [...prev, category])} activeOpacity={0.7}
        style={[styles.tagItem, { backgroundColor: isSelected ? (h.isDarkMode ? '#5B86E5' : '#E3DAD9') : 'transparent' }]}>
        <Text style={[styles.tagText, { color: isSelected ? (h.isDarkMode ? '#FFFFFF' : '#9C3F07') : labelColor, fontWeight: isSelected ? 'bold' : 'normal' }]}>{category}</Text>
      </TouchableOpacity>
    );
  };

  const renderProduct = ({ item }: any) => (
    <ProductCard
      item={item}
      selectionMode={h.selectionMode}
      isSelected={h.selectedProductIds.has(item.id)}
      onToggleSelect={h.toggleSelection}
      onEdit={(product: any) => h.navigation.navigate('ProductEditScreen', { product })}
      onDelete={h.deleteProduct}
      onToggleStatus={h.toggleProductStatus}
      onDismissAlert={h.dismissAlert}
    />
  );

  return (
    <View style={[styles.mainContainer, { backgroundColor: h.isDarkMode ? '#18181C' : '#F5F5F5' }]}>
      <StatusBar backgroundColor={h.colors.headerBackground} barStyle="light-content" />
      <AdminHeader title="gerenciar" searchValue={h.searchText} onSearchChange={h.setSearchText} />
      <View style={[styles.filterContainer, { backgroundColor: h.isDarkMode ? '#18181C' : '#F5F5F5' }]}>
        <View style={[styles.filterPill, { backgroundColor: h.isDarkMode ? '#2E2E38' : '#E3E4EB' }]}>
          <TouchableOpacity style={styles.filterBtn} onPress={() => h.setShowFilterModal(true)} activeOpacity={0.7}>
            <Feather name="sliders" size={12} color={labelColor} />
            <Text style={[styles.filterBtnText, { color: labelColor }]}>{getFilterLabel()}</Text>
            <Feather name="chevron-down" size={12} color={labelColor} style={{ marginLeft: 2 }} />
          </TouchableOpacity>
          <View style={[styles.filterSep, { backgroundColor: sepColor }]} />
          <Text style={[styles.categoryLabelText, { color: labelColor }]}>Categoria</Text>
          <View style={[styles.filterSep, { backgroundColor: sepColor }]} />
          <FlatList horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow} data={CATEGORIES} renderItem={({ item }) => renderTag(item)} keyExtractor={(item) => item} />
        </View>
      </View>
      <View style={styles.actionButtonsRow}>
        <View style={styles.deleteColumnContainer}>
          <TouchableOpacity style={styles.registerBtn} onPress={() => h.navigation.navigate('ProductCreateScreen')}>
            <CheckIcon width={34} height={34} fill={h.isDarkMode ? '#FFFFFF' : undefined} />
            <Text style={styles.actionBtnText}>Registrar produto</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.deleteColumnContainer}>
          <TouchableOpacity style={[styles.massDeleteBtn, h.selectionMode && styles.massDeleteBtnActive]} onPress={h.handleMassDelete}>
            <DeleteProductIcon width={33} height={32} fill={h.isDarkMode ? '#FFFFFF' : undefined} style={{ marginRight: 8 }} />
            {h.selectionMode ? <Text style={styles.massDeleteBtnText}>Confirmar ({h.selectedProductIds.size})</Text> : <Text style={styles.actionBtnText}>Excluir produto</Text>}
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.secondaryActionsRow}>
        <TouchableOpacity activeOpacity={0.7} onPress={h.handleSelectAllBtn} style={[styles.secondaryBtn, { backgroundColor: h.isDarkMode ? '#2E2E38' : '#E3E4EB' }]}>
          <Text style={[styles.secondaryBtnText, { color: h.isDarkMode ? '#FFFFFF' : '#1C2434' }]}>
            {h.filteredProducts.length > 0 && h.filteredProducts.every((p: any) => h.selectedProductIds.has(p.id)) ? "Deselecionar tudo" : "Selecionar tudo"}
          </Text>
        </TouchableOpacity>
        {h.selectionMode ? (
          <TouchableOpacity activeOpacity={0.7} onPress={() => { h.setSelectionMode(false); h.setSelectedProductIds(new Set()); }} style={[styles.secondaryBtn, { backgroundColor: h.isDarkMode ? '#2E2E38' : '#E3E4EB' }]}>
            <Text style={[styles.secondaryBtnText, { color: h.isDarkMode ? '#FFFFFF' : '#1C2434' }]}>Cancelar Seleção</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity activeOpacity={0.7} onPress={h.handleDeactivateAll} style={[styles.secondaryBtn, { backgroundColor: '#FFFFFF' }]}>
            <Text style={[styles.secondaryBtnText, { color: '#FF3B30' }]}>Desativar todos</Text>
          </TouchableOpacity>
        )}
      </View>
      {h.loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primaryDark} />
        </View>
      ) : (
        <FlatList data={h.filteredProducts} keyExtractor={(item) => item.id} renderItem={renderProduct} contentContainerStyle={styles.productsList} showsVerticalScrollIndicator={false}
          ListEmptyComponent={<View style={styles.emptyContainer}><Text style={[styles.emptyText, { color: h.isDarkMode ? '#8E8E93' : '#919191', textAlign: 'center' }]}>{h.hasError ? "Não foi possível carregar os produtos." : "Este produto não foi encontrado/registrado ainda."}</Text></View>} />
      )}
      <View style={{ height: 100 }} />
      <DeleteConfirmModal visible={h.showConfirmDeleteModal} isDarkMode={h.isDarkMode} selectedCount={h.selectedProductIds.size} onConfirm={h.confirmMassDelete} onClose={() => h.setShowConfirmDeleteModal(false)} />
      <FilterModal visible={h.showFilterModal} isDarkMode={h.isDarkMode} colors={h.colors}
        tempStatusFilter={h.tempStatusFilter} tempAlertYellowFilter={h.tempAlertYellowFilter} tempAlertRedFilter={h.tempAlertRedFilter}
        onSelectStatus={(s: any) => { h.setTempStatusFilter(s); if (s === 'Inativos') { h.setTempAlertYellowFilter(false); h.setTempAlertRedFilter(false); } }}
        onToggleYellow={() => { if (h.tempStatusFilter !== 'Inativos') h.setTempAlertYellowFilter(!h.tempAlertYellowFilter); }}
        onToggleRed={() => { if (h.tempStatusFilter !== 'Inativos') h.setTempAlertRedFilter(!h.tempAlertRedFilter); }}
        onApply={() => { h.setStatusFilter(h.tempStatusFilter); h.setAlertYellowFilter(h.tempAlertYellowFilter); h.setAlertRedFilter(h.tempAlertRedFilter); h.setShowFilterModal(false); }}
        onClose={() => h.setShowFilterModal(false)} />
      <AdminUserMenu />
    </View>
  );
}
