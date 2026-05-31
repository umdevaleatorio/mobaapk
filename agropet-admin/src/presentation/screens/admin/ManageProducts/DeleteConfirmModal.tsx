import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from './styles';

export const DeleteConfirmModal = ({ visible, isDarkMode, selectedCount, onConfirm, onClose }: any) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.modalOverlay}>
      <View style={[styles.whiteModalContainer, { backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF' }]}>
        <Text style={[styles.whiteModalTitle, { color: '#FF3B30', fontSize: 18, fontWeight: 'bold' }]}>Atenção: Ação Destrutiva!</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderWidth: 1, borderRadius: 10, backgroundColor: isDarkMode ? '#2C1D1E' : '#FFF0F0', borderColor: '#FF3B30', marginVertical: 15 }}>
          <Feather name="alert-circle" size={18} color="#FF3B30" style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: isDarkMode ? '#FF8A8A' : '#D32F2F', flex: 1, lineHeight: 16 }}>
            {`Tem certeza de que o proprietário quer prosseguir? Esta ação é irreversível e excluirá permanentemente os ${selectedCount} produtos selecionados do banco de dados.`}
          </Text>
        </View>
        <View style={styles.modalButtonsRow}>
          <TouchableOpacity style={[styles.modalConfirmBtn, { backgroundColor: '#A72424' }]} activeOpacity={0.7} onPress={onConfirm}>
            <Text style={styles.modalConfirmText}>Sim, Excluir Definitivamente</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modalCancelBtn, { borderColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]} activeOpacity={0.7} onPress={onClose}>
            <Text style={[styles.modalCancelText, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);
