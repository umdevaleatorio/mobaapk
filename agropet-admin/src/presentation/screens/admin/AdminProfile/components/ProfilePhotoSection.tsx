import React from 'react';
import { View, TouchableOpacity, Text, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from '../AdminProfileScreen.styles';
import PhotoSvg from '../../../../assets/tela13/photo/Photo.svg';
import PersonIcon13 from '../../../../assets/tela13/photo/Person Icon.svg';

interface Props {
  photoUri: string | null;
  isDarkMode: boolean;
  handleSelectPhoto: () => void;
}

export default function ProfilePhotoSection({ photoUri, isDarkMode, handleSelectPhoto }: Props) {
  return (
    <View style={styles.photoContainer}>
      <View style={[
        styles.photoPlaceholder,
        isDarkMode ? {
          backgroundColor: '#000000',
          borderRadius: 20,
          borderWidth: 1,
          borderColor: '#2E2E38',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.4,
          shadowRadius: 4,
          elevation: 3,
        } : null
      ]}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.profilePhoto} />
        ) : (
          isDarkMode ? (
            <View style={[styles.personIconCircle, { backgroundColor: '#2E2E38' }]}>
              <Feather name="user" size={36} color="#FFFFFF" />
            </View>
          ) : (
            <>
              <PhotoSvg width={110} height={110} style={{ position: 'absolute' }} />
              <PersonIcon13 width={70} height={70} style={{ position: 'absolute' }} />
            </>
          )
        )}
      </View>
      <TouchableOpacity onPress={handleSelectPhoto}>
        <Text style={[styles.alterarFotoText, { color: isDarkMode ? '#5B86E5' : '#042A7D' }]}>Alterar foto</Text>
      </TouchableOpacity>
    </View>
  );
}
