import React from 'react';
import { View, Text, TouchableOpacity, Image, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from './ProfileScreen.styles';

type Props = { h: any };

export default function ViewPhotoModal({ h }: Props) {
  return (
    <Modal
      visible={h.showViewPhotoModal}
      transparent
      animationType="fade"
      onRequestClose={() => h.setShowViewPhotoModal(false)}
    >
      <TouchableOpacity
        style={styles.viewPhotoOverlay}
        activeOpacity={1}
        onPress={() => h.setShowViewPhotoModal(false)}
      >
        <View style={styles.viewPhotoContainer}>
          <TouchableOpacity
            style={styles.closeViewPhotoBtn}
            onPress={() => h.setShowViewPhotoModal(false)}
          >
            <Feather name="x" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          {h.photoUri && (
            <Image
              source={{ uri: h.photoUri }}
              style={styles.viewPhotoSquare}
              resizeMode="cover"
            />
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
