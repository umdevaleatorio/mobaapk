import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { getFirstImageUrl } from '../../../../utils/imageUtils';
import EditIcon from '../../../assets/tela7/produtos/produto 1/Adicionar/Remover/Edit.svg';
import TrashIcon from '../../../assets/tela7/produtos/produto 1/Adicionar/Remover/Trash.svg';
import AtivoSvg from '../../../assets/tela7/produtos/produto 1/Adicionar/Remover/Ativo.svg';
import ToggleActiveSvg from '../../../assets/tela7/produtos/produto 1/Adicionar/Remover/Botão desativar.svg';
import DesativadoSvg from '../../../assets/tela7/produtos/produto 4/Adicionar/Remover/Desativado.svg';
import ToggleInactiveSvg from '../../../assets/tela7/produtos/produto 4/Adicionar/Remover/Botão desativar.svg';
import { styles } from './styles';

export const ProductCard = React.memo(({ item, selectionMode, isSelected, onToggleSelect, onEdit, onDelete, onToggleStatus, onDismissAlert }: any) => {
  const { colors, isDarkMode } = useTheme();
  const isActive = item.active !== false;
  const stock = item.stock || 0;
  const stockColor = stock < 10 ? '#FF3B30' : (stock <= 29 ? '#FFE082' : '#00BFA5');

  const renderWarning = () => {
    if (stock < 10) return (
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderRadius: 10, backgroundColor: isDarkMode ? '#2C1D1E' : '#FFF0F0', borderColor: '#FF3B30', marginHorizontal: 8, marginBottom: 8, marginTop: 4 }}>
        <Feather name="alert-circle" size={14} color="#FF3B30" style={{ marginRight: 6 }} />
        <Text style={{ fontSize: 11, fontWeight: 'bold', color: isDarkMode ? '#FF8A8A' : '#D32F2F', flexShrink: 1, lineHeight: 15, paddingRight: 16 }}>{item.name} está esgotando, adicione mais ao estoque para manter ativo ou espere acabar para auto-desativação.</Text>
        <TouchableOpacity onPress={() => onDismissAlert(item.id)} style={{ position: 'absolute', right: 8, top: 8, padding: 2 }}>
          <Feather name="x" size={14} color={isDarkMode ? '#FF8A8A' : '#D32F2F'} />
        </TouchableOpacity>
      </View>
    );
    if (stock <= 29) return (
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderRadius: 10, backgroundColor: isDarkMode ? '#2C2B1D' : '#FFFDE6', borderColor: '#FFB300', marginHorizontal: 8, marginBottom: 8, marginTop: 4 }}>
        <Feather name="alert-triangle" size={14} color="#FFB300" style={{ marginRight: 6 }} />
        <Text style={{ fontSize: 11, fontWeight: 'bold', color: isDarkMode ? '#FFE082' : '#B78103', flexShrink: 1, lineHeight: 15, paddingRight: 16 }}>{item.name} está com estoque moderado ({stock} unidades). Considere reabastecer em breve.</Text>
        <TouchableOpacity onPress={() => onDismissAlert(item.id)} style={{ position: 'absolute', right: 8, top: 8, padding: 2 }}>
          <Feather name="x" size={14} color={isDarkMode ? '#FFE082' : '#B78103'} />
        </TouchableOpacity>
      </View>
    );
    return null;
  };

  return (
    <View style={[styles.productCard, { backgroundColor: isDarkMode ? colors.cardBackground : '#E3E4EB' }, isSelected && styles.selectedCard, !isActive && styles.cardInactive]}>
      <TouchableOpacity style={styles.editIconBtn} onPress={() => { if (!selectionMode) onEdit(item); }}>
        <EditIcon width={20} height={20} color={isDarkMode ? '#FFE082' : '#6C6C6C'} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.trashIconBtn} onPress={() => { if (!selectionMode) onDelete(item.id); }}>
        <TrashIcon width={19} height={20} fill={isDarkMode ? '#FFFFFF' : undefined} />
      </TouchableOpacity>
      <View style={styles.cardRow}>
        {selectionMode && (
          <TouchableOpacity style={styles.checkboxArea} onPress={() => onToggleSelect(item.id)} testID="product-checkbox">
            <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
              {isSelected && <Text style={styles.checkmark}>X</Text>}
            </View>
          </TouchableOpacity>
        )}
        <View style={styles.productImageWrapper}>
          {item.image_url ? (
            <Image source={{ uri: /* istanbul ignore next */ getFirstImageUrl(item.image_url) || '' }} style={styles.productImage} contentFit="cover" cachePolicy="disk" />
          ) : (
            <View style={[styles.productImage, styles.noImage, { backgroundColor: isDarkMode ? '#1E1E24' : '#FFFFFF' }]}>
              <Text style={[styles.noImageText, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>Sem{"\n"}Foto</Text>
            </View>
          )}
        </View>
        <View style={{ width: 1, height: '100%', backgroundColor: isDarkMode ? '#18181C' : '#F5F5F5' }} />
        <View style={styles.nameColumn}>
          <Text style={[styles.columnHeader, { color: colors.textDark }]}>Nome do{"\n"}produto</Text>
          <Text style={[styles.productName, { color: colors.textDark }]} numberOfLines={2}>{item.name || 'Sem nome'}</Text>
        </View>
        <View style={{ width: 1, height: '100%', backgroundColor: isDarkMode ? '#18181C' : '#F5F5F5' }} />
        <View style={styles.quantityColumn}>
          <Text style={[styles.columnHeader, { color: colors.textDark }]}>Quantidade</Text>
          <Text style={[styles.quantityValue, { color: stockColor }]}>{stock}</Text>
        </View>
        <View style={{ width: 1, height: '100%', backgroundColor: isDarkMode ? '#18181C' : '#F5F5F5' }} />
        <View style={styles.statusColumn}>
          <Text style={[styles.columnHeader, { color: colors.textDark }]}>Situação</Text>
          {isActive ? <AtivoSvg width={35} height={12} /> : <DesativadoSvg width={55} height={12} />}
          <TouchableOpacity onPress={() => { if (!selectionMode) onToggleStatus(item); }} style={{ marginTop: 6 }}>
            {isActive ? <ToggleActiveSvg width={40} height={20} /> : <ToggleInactiveSvg width={40} height={20} />}
          </TouchableOpacity>
        </View>
      </View>
      {renderWarning()}
    </View>
  );
});
