import React from 'react';
import { View, Text, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from '../AdminDashboardScreen.styles';

interface FilterOptionModalProps {
  visible: boolean;
  localStartDate: Date;
  localEndDate: Date;
  isDarkMode: boolean;
  colors: any;
  onClose: () => void;
  onSingleDayPress: () => void;
  onRangeStartPress: () => void;
  onRangeEndPress: () => void;
  onRangeConfirm: () => void;
}

export default function FilterOptionModal({
  visible, localStartDate, localEndDate, isDarkMode, colors,
  onClose, onSingleDayPress, onRangeStartPress, onRangeEndPress, onRangeConfirm
}: FilterOptionModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.whiteModalContainer, { backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF' }]}>
          <Text style={[styles.whiteModalTitle, { color: colors.textDark }]}>Filtrar Dashboard</Text>
          <Text style={[styles.whiteModalDesc, { color: isDarkMode ? '#A8A8B3' : '#767676' }]}>
            Escolha como deseja consultar os ganhos da loja:
          </Text>

          <TouchableOpacity
            style={[styles.filterModeHeader, { borderBottomColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]}
            activeOpacity={0.7}
            onPress={onSingleDayPress}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="calendar" size={20} color="#F97D01" style={{ marginRight: 10 }} />
              <View>
                <Text style={[styles.filterModeTitle, { color: colors.textDark }]}>Dia Único</Text>
                <Text style={{ fontSize: 12, color: isDarkMode ? '#A8A8B3' : '#767676' }}>
                  Consultar ganhos de uma data específica
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={isDarkMode ? '#A8A8B3' : '#767676'} />
          </TouchableOpacity>

          <View style={[styles.filterPeriodContainer, { borderColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]}>
            <Text style={[styles.filterModeTitle, { color: colors.textDark, marginBottom: 12 }]}>Período Personalizado</Text>
            <View style={styles.rangeRowContainer}>
              <TouchableOpacity
                style={[styles.datePickRow, { backgroundColor: isDarkMode ? '#1E1E24' : '#F5F6FA' }]}
                activeOpacity={0.7}
                onPress={onRangeStartPress}
              >
                <Text style={styles.datePickLabel}>Início</Text>
                <Text style={[styles.datePickVal, { color: colors.textDark }]}>
                  {localStartDate.toLocaleDateString('pt-BR')}
                </Text>
              </TouchableOpacity>

              <Feather name="arrow-right" size={16} color={isDarkMode ? '#FFFFFF' : '#1C2434'} style={{ alignSelf: 'center' }} />

              <TouchableOpacity
                style={[styles.datePickRow, { backgroundColor: isDarkMode ? '#1E1E24' : '#F5F6FA' }]}
                activeOpacity={0.7}
                onPress={onRangeEndPress}
              >
                <Text style={styles.datePickLabel}>Fim</Text>
                <Text style={[styles.datePickVal, { color: colors.textDark }]}>
                  {localEndDate.toLocaleDateString('pt-BR')}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.whiteModalBtnConfirm, { backgroundColor: '#25BE36', marginTop: 12 }]}
              activeOpacity={0.7}
              onPress={onRangeConfirm}
            >
              <Text style={styles.whiteModalBtnTextConfirm}>Filtrar Período</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={{ alignSelf: 'center', marginTop: 16 }} activeOpacity={0.7} onPress={onClose}>
            <Text style={{ color: '#FF3B30', fontWeight: 'bold' }}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
