import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { styles } from './SettingsScreen.styles';

interface PermissionsModalProps {
  visible: boolean;
  isDarkMode: boolean;
  colors: any;
  cameraPermission: string;
  galleryPermission: string;
  locationPermission: string;
  notificationsPermission: string;
  onClose: () => void;
  handlePressPermission: (key: string, name: string, currentStatus: string) => void;
}

const PermissionRow: React.FC<{
  label: string;
  status: string;
  permissionKey: string;
  permissionName: string;
  isDarkMode: boolean;
  colors: any;
  onPress: (key: string, name: string, status: string) => void;
}> = ({ label, status, permissionKey, permissionName, isDarkMode, colors, onPress }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: isDarkMode ? '#1E1E24' : '#F5F5F5', padding: 12, borderRadius: 10 }}>
    <View>
      <Text style={{ fontWeight: 'bold', color: colors.textDark, fontSize: 15 }}>{label}</Text>
      <Text style={{ fontSize: 12, color: status === 'granted' ? '#4CAF50' : '#FF3B30' }}>
        {status === 'granted' ? 'Permitido ✓' : 'Não Permitido ✗'}
      </Text>
    </View>
    <TouchableOpacity
      style={{
        backgroundColor: status === 'granted' ? (isDarkMode ? '#3E3E4A' : '#E3E4EB') : colors.accent,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        opacity: status === 'granted' ? 0.6 : 1,
      }}
      onPress={() => onPress(permissionKey, permissionName, status)}
    >
      <Text style={{
        color: status === 'granted' ? (isDarkMode ? '#A8A8B3' : '#767676') : '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 12,
      }}>
        {status === 'granted' ? 'Desautorizar' : 'Solicitar'}
      </Text>
    </TouchableOpacity>
  </View>
);

const PermissionsModal: React.FC<PermissionsModalProps> = ({
  visible, isDarkMode, colors,
  cameraPermission, galleryPermission, locationPermission, notificationsPermission,
  onClose, handlePressPermission,
}) => {
  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.whiteModalContainer, { backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF', width: '90%' }]}>
          <Text style={[styles.whiteModalTitle, { color: colors.textDark, fontSize: 20, marginBottom: 5 }]}>Gerenciador de Permissões</Text>
          <Text style={[styles.whiteModalDesc, { color: isDarkMode ? '#A8A8B3' : '#767676', marginBottom: 20 }]}>
            Veja e gerencie as permissões do aplicativo para habilitar todos os recursos.
          </Text>

          <View style={{ gap: 15, marginBottom: 25 }}>
            <PermissionRow
              label="Câmera"
              status={cameraPermission}
              permissionKey="camera"
              permissionName="Câmera"
              isDarkMode={isDarkMode}
              colors={colors}
              onPress={handlePressPermission}
            />
            <PermissionRow
              label="Galeria de Fotos"
              status={galleryPermission}
              permissionKey="gallery"
              permissionName="Galeria de Fotos"
              isDarkMode={isDarkMode}
              colors={colors}
              onPress={handlePressPermission}
            />
            <PermissionRow
              label="Localização (GPS)"
              status={locationPermission}
              permissionKey="location"
              permissionName="Localização (GPS)"
              isDarkMode={isDarkMode}
              colors={colors}
              onPress={handlePressPermission}
            />
            <PermissionRow
              label="Notificações Push"
              status={notificationsPermission}
              permissionKey="notifications"
              permissionName="Notificações Push"
              isDarkMode={isDarkMode}
              colors={colors}
              onPress={handlePressPermission}
            />
          </View>

          <TouchableOpacity
            style={{ backgroundColor: colors.accent, paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
            onPress={onClose}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>Fechar Gerenciador</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default PermissionsModal;
