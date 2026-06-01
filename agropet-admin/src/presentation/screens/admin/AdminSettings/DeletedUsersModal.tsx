import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from './AdminSettingsScreen.styles';

interface DeletedUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  deleted_at: string;
  scheduled_delete_at: string;
}

interface DeletedUsersModalProps {
  visible: boolean;
  onClose: () => void;
  deletedUsers: DeletedUser[];
  loading: boolean;
  onHardDelete: (userId: string) => void;
  isDarkMode: boolean;
}

export default function DeletedUsersModal({
  visible,
  onClose,
  deletedUsers,
  loading,
  onHardDelete,
  isDarkMode,
}: DeletedUsersModalProps) {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isExpired = (scheduledDeleteAt: string) => {
    return new Date(scheduledDeleteAt) < new Date();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.whiteModalContainer, { maxHeight: '80%', backgroundColor: isDarkMode ? '#1E1E24' : '#FFFFFF' }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={[styles.whiteModalTitle, { color: isDarkMode ? '#FFFFFF' : '#1C2434' }]}>Contas Marcadas para Exclusão</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={22} color={isDarkMode ? '#FFFFFF' : '#1C2434'} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#042A7D" style={{ marginVertical: 40 }} />
          ) : deletedUsers.length === 0 ? (
            <Text style={[styles.whiteModalDesc, { marginVertical: 32 }]}>
              Nenhuma conta marcada para exclusão.
            </Text>
          ) : (
            <FlatList
              data={deletedUsers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={{
                  backgroundColor: isDarkMode ? '#2E2E38' : '#F5F5F5',
                  borderRadius: 12,
                  padding: 14,
                  marginBottom: 10,
                }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 15, color: isDarkMode ? '#FFFFFF' : '#1C2434', marginBottom: 4 }}>
                    {item.name || 'Sem nome'}
                  </Text>
                  <Text style={{ fontSize: 13, color: isDarkMode ? '#A8A8B3' : '#666', marginBottom: 2 }}>{item.email}</Text>
                  {item.phone && (
                    <Text style={{ fontSize: 13, color: isDarkMode ? '#A8A8B3' : '#666', marginBottom: 2 }}>{item.phone}</Text>
                  )}
                  <Text style={{ fontSize: 12, color: isDarkMode ? '#888' : '#999', marginTop: 4 }}>
                    Excluída em: {formatDate(item.deleted_at)}
                  </Text>
                  <Text style={{ fontSize: 12, color: isExpired(item.scheduled_delete_at) ? '#FF3B30' : '#FFC107', fontWeight: 'bold' }}>
                    {isExpired(item.scheduled_delete_at)
                      ? 'Pronta para remoção permanente'
                      : `Remoção em: ${formatDate(item.scheduled_delete_at)}`}
                  </Text>
                  {isExpired(item.scheduled_delete_at) && (
                    <TouchableOpacity
                      onPress={() => onHardDelete(item.id)}
                      style={{
                        backgroundColor: '#FF3B30',
                        borderRadius: 8,
                        paddingVertical: 8,
                        paddingHorizontal: 16,
                        alignSelf: 'flex-end',
                        marginTop: 8,
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 }}>
                        Excluir Permanentemente
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            />
          )}

          <TouchableOpacity
            onPress={onClose}
            style={[{ marginTop: 16, alignSelf: 'center', width: '50%', backgroundColor: isDarkMode ? '#2E2E38' : '#F0F0F0', paddingVertical: 12, borderRadius: 10, alignItems: 'center' }]}
          >
            <Text style={{ color: '#FF3B30', fontWeight: 'bold', fontSize: 15 }}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
