import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { styles } from './ProfileScreen.styles';

type Props = { h: any };

export default function ImagePickerModal({ h }: Props) {
  return (
    <Modal
      visible={h.showImagePickerOptions}
      transparent
      animationType="fade"
      onRequestClose={() => h.setShowImagePickerOptions(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => h.setShowImagePickerOptions(false)}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Alterar Foto de Perfil</Text>

          {h.photoUri && (
            <>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  h.setShowImagePickerOptions(false);
                  h.setShowViewPhotoModal(true);
                }}
              >
                <Text style={styles.modalOptionText}>Ver foto</Text>
              </TouchableOpacity>
              <View style={styles.modalSeparator} />
            </>
          )}

          <TouchableOpacity style={styles.modalOption} onPress={h.openCamera}>
            <Text style={styles.modalOptionText}>Tirar Foto</Text>
          </TouchableOpacity>

          <View style={styles.modalSeparator} />

          <TouchableOpacity style={styles.modalOption} onPress={h.openGallery}>
            <Text style={styles.modalOptionText}>Escolher da Galeria</Text>
          </TouchableOpacity>

          {h.photoUri && (
            <>
              <View style={styles.modalSeparator} />
              <TouchableOpacity
                style={styles.modalOption}
                onPress={async () => {
                  h.setPhotoUri(null);
                  try { await SecureStore.deleteItemAsync(h.user ? `av_${h.user.id.slice(0, 8)}` : 'av_guest'); } catch (e) {}
                  h.setShowImagePickerOptions(false);
                }}
              >
                <Text style={[styles.modalOptionText, { color: '#FF6B6B' }]}>Remover Foto</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.modalSeparator} />

          <TouchableOpacity
            style={[styles.modalOption, { marginTop: 10 }]}
            onPress={() => h.setShowImagePickerOptions(false)}
          >
            <Text style={[styles.modalOptionText, styles.modalCancelText]}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
