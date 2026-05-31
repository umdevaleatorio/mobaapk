import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from './styles';

export const FilterModal = ({ visible, isDarkMode, colors, tempStatusFilter, tempAlertYellowFilter, tempAlertRedFilter, onSelectStatus, onToggleYellow, onToggleRed, onApply, onClose }: any) => {
  const renderRadio = (status: string, label: string) => {
    const isSelected = tempStatusFilter === status;
    const isDisabled = status === 'Inativos' && (tempAlertYellowFilter || tempAlertRedFilter);
    return (
      <TouchableOpacity key={status} activeOpacity={isDisabled ? 1 : 0.7}
        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#3E3E4A' : '#E3E4EB', opacity: isDisabled ? 0.4 : 1 }}
        onPress={() => { if (!isDisabled) onSelectStatus(status); }}>
        <Text style={{ fontSize: 14, color: isDarkMode ? '#FFFFFF' : '#1C2434', fontWeight: isSelected ? 'bold' : 'normal', flex: 1 }}>{label}</Text>
        <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: isSelected ? '#25BE36' : (isDarkMode ? '#888888' : '#A8A8B3'), alignItems: 'center', justifyContent: 'center' }}>
          {isSelected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#25BE36' }} />}
        </View>
      </TouchableOpacity>
    );
  };

  const renderToggle = (label: string, icon: string, isChecked: boolean, color: string, activeBg: string, inactiveBg: string, onToggle: () => void) => {
    const disabled = tempStatusFilter === 'Inativos';
    return (
      <TouchableOpacity activeOpacity={disabled ? 1 : 0.7} onPress={onToggle}
        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderRadius: 10, backgroundColor: disabled ? (isDarkMode ? '#222225' : '#F0F0F2') : (isChecked ? activeBg : inactiveBg), borderColor: disabled ? '#CCCCCC' : color, marginBottom: 10, opacity: disabled ? 0.4 : 1 }}>
        <Feather name={icon} size={16} color={disabled ? '#888888' : color} style={{ marginRight: 8 }} />
        <Text style={{ fontSize: 12, fontWeight: 'bold', color: disabled ? '#888888' : (isDarkMode ? '#FFE082' : '#B78103'), flex: 1 }}>{label}</Text>
        <View style={{ width: 20, height: 20, borderRadius: 4, borderWidth: 1.2, borderColor: disabled ? '#888888' : color, backgroundColor: isChecked ? color : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
          {isChecked && <Feather name="check" size={12} color="#FFFFFF" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.whiteModalContainer, { backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF' }]}>
          <Text style={[styles.whiteModalTitle, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>Filtrar Produtos</Text>
          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
            <Text style={[styles.modalSubsectionHeader, { color: isDarkMode ? '#FFE082' : '#F97D01' }]}>Situação</Text>
            {renderRadio('Todos', 'Todos os produtos')}
            {renderRadio('Ativos', 'Somente ativos')}
            {renderRadio('Inativos', 'Somente inativos')}
            <Text style={[styles.modalSubsectionHeader, { color: isDarkMode ? '#FFE082' : '#F97D01', marginTop: 20, marginBottom: 10 }]}>Alertas de estoque</Text>
            {renderToggle('Estoque Moderado (Alerta Amarelo)', 'alert-triangle', tempAlertYellowFilter, '#FFB300', isDarkMode ? '#3D381D' : '#FFEBA3', isDarkMode ? '#2C2B1D' : '#FFFDE6', onToggleYellow)}
            {renderToggle('Estoque Crítico (Alerta Vermelho)', 'alert-circle', tempAlertRedFilter, '#FF3B30', isDarkMode ? '#4D1D1E' : '#FFC7C7', isDarkMode ? '#2C1D1E' : '#FFF0F0', onToggleRed)}
          </ScrollView>
          <View style={styles.modalButtonsRow}>
            <TouchableOpacity style={[styles.modalConfirmBtn, { backgroundColor: '#25BE36' }]} activeOpacity={0.7} onPress={onApply}>
              <Text style={styles.modalConfirmText}>Aplicar Filtros</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalCancelBtn, { borderColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]} activeOpacity={0.7} onPress={onClose}>
              <Text style={[styles.modalCancelText, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
