import React from 'react';
import { View, TextInput, Text, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { styles } from './ProfileScreen.styles';
import PhotoSvg from '../../../assets/tela13/photo/Photo.svg';
import PersonIcon13 from '../../../assets/tela13/photo/Person Icon.svg';

type Props = { h: any };

export default function ProfileHeader({ h }: Props) {
  return (
    <View style={styles.profileHeaderRow}>
      <View style={styles.photoContainer}>
        <View style={[
          styles.photoPlaceholder,
          h.isDarkMode ? {
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
          {h.photoUri ? (
            <Image source={{ uri: h.photoUri }} style={styles.profilePhoto} />
          ) : (
            h.isDarkMode ? (
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
        <TouchableOpacity onPress={h.handleSelectPhoto}>
          <Text style={[styles.alterarFotoText, { color: h.isDarkMode ? '#5B86E5' : '#042A7D' }]}>Alterar foto</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.topFields}>
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: h.colors.textDark }]}>Nome:</Text>
          <View style={[styles.textInputBox, { backgroundColor: h.colors.cardBackground }]}>
            <TextInput
              style={[styles.input, { color: h.nome ? h.colors.textDark : '#919191' }]}
              placeholder="Digite o seu nome aqui..."
              placeholderTextColor={h.isDarkMode ? '#8E8E93' : '#919191'}
              value={h.nome}
              onChangeText={h.setNome}
            />
          </View>
        </View>
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: h.colors.textDark }]}>Nome de usuário:</Text>
          <TouchableOpacity
            style={[styles.textInputBox, { backgroundColor: h.colors.cardBackground }]}
            onPress={() => {
              if (!h.usuario) {
                h.setUsernameInput('');
                h.setUsernameStatus('idle');
                h.setShowUsernameModal(true);
              }
            }}
            disabled={!!h.usuario}
          >
            <Text style={[styles.input, { color: h.usuario ? h.colors.textDark : '#919191' }]}>
              {h.usuario || 'Definir nome de usuário...'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
