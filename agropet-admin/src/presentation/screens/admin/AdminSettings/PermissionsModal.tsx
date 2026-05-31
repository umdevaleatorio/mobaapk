import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { styles } from './AdminSettingsScreen.styles';

interface PermissionsModalProps {
  h: any;
}

const PermissionsModal: React.FC<PermissionsModalProps> = ({ h }) => {
  return (
    <Modal visible={h.showPermissionsModal} transparent={true} animationType="slide" onRequestClose={() => h.setShowPermissionsModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.whiteModalContainer, { backgroundColor: h.colors.white, width: '90%' }]}>
          <Text style={[styles.whiteModalTitle, { color: h.colors.textDark, fontSize: 20, marginBottom: 5 }]}>Gerenciador de Permissões</Text>
          <Text style={[styles.whiteModalDesc, { color: h.isDarkMode ? '#A8A8B3' : '#767676', marginBottom: 20 }]}>
            Veja e gerencie as permissões do aplicativo para habilitar todos os recursos.
          </Text>

          <View style={{ gap: 15, marginBottom: 25 }}>
            {/* Câmera */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: h.isDarkMode ? '#1E1E24' : '#F5F5F5', padding: 12, borderRadius: 10 }}>
              <View>
                <Text style={{ fontWeight: 'bold', color: h.colors.textDark, fontSize: 15 }}>Câmera</Text>
                <Text style={{ fontSize: 12, color: h.cameraPermission === 'granted' ? '#4CAF50' : '#FF3B30' }}>
                  {h.cameraPermission === 'granted' ? 'Permitido ✓' : 'Não Permitido ✗'}
                </Text>
              </View>
              <TouchableOpacity
                style={{
                  backgroundColor: h.cameraPermission === 'granted' ? (h.isDarkMode ? '#3E3E4A' : '#E3E4EB') : h.colors.accent,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                  opacity: h.cameraPermission === 'granted' ? 0.6 : 1
                }}
                onPress={() => h.handlePressPermission('camera', 'Câmera', h.cameraPermission)}
              >
                <Text style={{
                  color: h.cameraPermission === 'granted' ? (h.isDarkMode ? '#A8A8B3' : '#767676') : '#FFFFFF',
                  fontWeight: 'bold',
                  fontSize: 12
                }}>
                  {h.cameraPermission === 'granted' ? 'Desautorizar' : 'Solicitar'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Galeria */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: h.isDarkMode ? '#1E1E24' : '#F5F5F5', padding: 12, borderRadius: 10 }}>
              <View>
                <Text style={{ fontWeight: 'bold', color: h.colors.textDark, fontSize: 15 }}>Galeria de Fotos</Text>
                <Text style={{ fontSize: 12, color: h.galleryPermission === 'granted' ? '#4CAF50' : '#FF3B30' }}>
                  {h.galleryPermission === 'granted' ? 'Permitido ✓' : 'Não Permitido ✗'}
                </Text>
              </View>
              <TouchableOpacity
                style={{
                  backgroundColor: h.galleryPermission === 'granted' ? (h.isDarkMode ? '#3E3E4A' : '#E3E4EB') : h.colors.accent,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                  opacity: h.galleryPermission === 'granted' ? 0.6 : 1
                }}
                onPress={() => h.handlePressPermission('gallery', 'Galeria de Fotos', h.galleryPermission)}
              >
                <Text style={{
                  color: h.galleryPermission === 'granted' ? (h.isDarkMode ? '#A8A8B3' : '#767676') : '#FFFFFF',
                  fontWeight: 'bold',
                  fontSize: 12
                }}>
                  {h.galleryPermission === 'granted' ? 'Desautorizar' : 'Solicitar'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Localização */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: h.isDarkMode ? '#1E1E24' : '#F5F5F5', padding: 12, borderRadius: 10 }}>
              <View>
                <Text style={{ fontWeight: 'bold', color: h.colors.textDark, fontSize: 15 }}>Localização (GPS)</Text>
                <Text style={{ fontSize: 12, color: h.locationPermission === 'granted' ? '#4CAF50' : '#FF3B30' }}>
                  {h.locationPermission === 'granted' ? 'Permitido ✓' : 'Não Permitido ✗'}
                </Text>
              </View>
              <TouchableOpacity
                style={{
                  backgroundColor: h.locationPermission === 'granted' ? (h.isDarkMode ? '#3E3E4A' : '#E3E4EB') : h.colors.accent,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                  opacity: h.locationPermission === 'granted' ? 0.6 : 1
                }}
                onPress={() => h.handlePressPermission('location', 'Localização (GPS)', h.locationPermission)}
              >
                <Text style={{
                  color: h.locationPermission === 'granted' ? (h.isDarkMode ? '#A8A8B3' : '#767676') : '#FFFFFF',
                  fontWeight: 'bold',
                  fontSize: 12
                }}>
                  {h.locationPermission === 'granted' ? 'Desautorizar' : 'Solicitar'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Notificações */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: h.isDarkMode ? '#1E1E24' : '#F5F5F5', padding: 12, borderRadius: 10 }}>
              <View>
                <Text style={{ fontWeight: 'bold', color: h.colors.textDark, fontSize: 15 }}>Notificações Push</Text>
                <Text style={{ fontSize: 12, color: h.notificationsPermission === 'granted' ? '#4CAF50' : '#FF3B30' }}>
                  {h.notificationsPermission === 'granted' ? 'Permitido ✓' : 'Não Permitido ✗'}
                </Text>
              </View>
              <TouchableOpacity
                style={{
                  backgroundColor: h.notificationsPermission === 'granted' ? (h.isDarkMode ? '#3E3E4A' : '#E3E4EB') : h.colors.accent,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 6,
                  opacity: h.notificationsPermission === 'granted' ? 0.6 : 1
                }}
                onPress={() => h.handlePressPermission('notifications', 'Notificações Push', h.notificationsPermission)}
              >
                <Text style={{
                  color: h.notificationsPermission === 'granted' ? (h.isDarkMode ? '#A8A8B3' : '#767676') : '#FFFFFF',
                  fontWeight: 'bold',
                  fontSize: 12
                }}>
                  {h.notificationsPermission === 'granted' ? 'Desautorizar' : 'Solicitar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={{ backgroundColor: h.colors.accent, paddingVertical: 12, borderRadius: 10, alignItems: 'center' }}
            onPress={() => h.setShowPermissionsModal(false)}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>Fechar Gerenciador</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default PermissionsModal;
