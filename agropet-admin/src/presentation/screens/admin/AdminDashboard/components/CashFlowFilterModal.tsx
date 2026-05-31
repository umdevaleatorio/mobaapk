import React from 'react';
import { View, Text, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from '../AdminDashboardScreen.styles';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface CashFlowFilterModalProps {
  visible: boolean;
  cashLocalFilter: 'all' | 'sangria' | 'suprimento';
  cashLocalStartDate: Date | null;
  cashLocalEndDate: Date | null;
  isDarkMode: boolean;
  colors: any;
  onClose: () => void;
  onFilterChange: (filter: 'all' | 'sangria' | 'suprimento') => void;
  onStartDatePress: () => void;
  onEndDatePress: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function CashFlowFilterModal({
  visible, cashLocalFilter, cashLocalStartDate, cashLocalEndDate,
  isDarkMode, colors, onClose, onFilterChange,
  onStartDatePress, onEndDatePress, onConfirm, onCancel
}: CashFlowFilterModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[styles.cashFlowModalContainer, { backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF' }]}>
          <Text style={[styles.cashFlowModalTitle, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>Filtrar Fluxo de Caixa</Text>

          {(['all', 'sangria', 'suprimento'] as const).map((option) => {
            const label = option === 'all' ? 'Ver tudo' : option === 'sangria' ? 'Sangrias' : 'Suprimentos';
            const icon = option === 'all' ? 'list' : option === 'sangria' ? 'minus-circle' : 'plus-circle';
            const iconColor = option === 'all' ? (isDarkMode ? '#FFE082' : '#F97D01') : option === 'sangria' ? '#FF3B30' : '#4CAF50';
            const isSelected = cashLocalFilter === option;
            return (
              <TouchableOpacity
                key={option} activeOpacity={0.7}
                style={[styles.cashFlowOption, {
                  backgroundColor: isSelected ? (isDarkMode ? 'rgba(255, 224, 130, 0.15)' : 'rgba(249, 125, 1, 0.1)') : 'transparent',
                  borderColor: isSelected ? (isDarkMode ? '#FFE082' : '#F97D01') : (isDarkMode ? '#3E3E4A' : '#E3E4EB'),
                }]}
                onPress={() => onFilterChange(option)}
              >
                <Feather name={icon} size={18} color={iconColor} style={{ marginRight: 10 }} />
                <Text style={[styles.cashFlowOptionText, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>{label}</Text>
                {isSelected && (
                  <Feather name="check" size={18} color={isDarkMode ? '#FFE082' : '#F97D01'} style={{ marginLeft: 'auto' }} />
                )}
              </TouchableOpacity>
            );
          })}

          <View style={[styles.filterPeriodContainer, { borderColor: isDarkMode ? '#3E3E4A' : '#E3E4EB', marginTop: 12 }]}>
            <Text style={[styles.filterModeTitle, { color: colors.textDark, marginBottom: 12 }]}>Período Personalizado</Text>
            <View style={styles.rangeRowContainer}>
              <TouchableOpacity
                style={[styles.datePickRow, { backgroundColor: isDarkMode ? '#1E1E24' : '#F5F6FA' }]}
                activeOpacity={0.7}
                onPress={onStartDatePress}
              >
                <Text style={styles.datePickLabel}>Início</Text>
                <Text style={[styles.datePickVal, { color: colors.textDark }]}>
                  {cashLocalStartDate ? cashLocalStartDate.toLocaleDateString('pt-BR') : '--/--/----'}
                </Text>
              </TouchableOpacity>

              <Feather name="arrow-right" size={16} color={isDarkMode ? '#FFFFFF' : '#1C2434'} style={{ alignSelf: 'center' }} />

              <TouchableOpacity
                style={[styles.datePickRow, { backgroundColor: isDarkMode ? '#1E1E24' : '#F5F6FA' }]}
                activeOpacity={0.7}
                onPress={onEndDatePress}
              >
                <Text style={styles.datePickLabel}>Fim</Text>
                <Text style={[styles.datePickVal, { color: colors.textDark }]}>
                  {cashLocalEndDate ? cashLocalEndDate.toLocaleDateString('pt-BR') : '--/--/----'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 20, alignItems: 'center' }}>
            <TouchableOpacity activeOpacity={0.7} onPress={onCancel} style={{ marginRight: 20 }}>
              <Text style={{ color: '#FF3B30', fontWeight: 'bold' }}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.whiteModalBtnConfirm, { backgroundColor: '#25BE36', paddingHorizontal: 20 }]}
              activeOpacity={0.7} onPress={onConfirm}
            >
              <Text style={styles.whiteModalBtnTextConfirm}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
