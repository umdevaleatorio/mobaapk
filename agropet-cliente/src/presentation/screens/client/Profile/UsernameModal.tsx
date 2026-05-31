import React from 'react';
import { View, TextInput, Text, TouchableOpacity, Modal } from 'react-native';
import { styles } from './ProfileScreen.styles';

type Props = { h: any };

export default function UsernameModal({ h }: Props) {
  return (
    <Modal visible={h.showUsernameModal} transparent={true} animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.whiteModalContainer, { backgroundColor: h.isDarkMode ? '#2E2E38' : '#FFFFFF' }]}>
          <Text style={[styles.whiteModalTitle, { color: h.colors.textDark }]}>Escolha seu nome de usuário</Text>
          <Text style={[styles.whiteModalDesc, { color: h.isDarkMode ? '#A8A8B3' : '#767676' }]}>Lembre-se: não será possível alterar depois.</Text>

          {h.usernameStatus === 'taken' && (
            <Text style={styles.usernameErrorMsg}>Este nome de usuário já está sendo usado, por favor, escolha outro</Text>
          )}
          {h.usernameStatus === 'invalid_format' && (
            <>
              <Text style={styles.usernameErrorMsg}>Caracteres especiais não são permitidos: !@#$%¨&*()</Text>
              <Text style={styles.usernameSuccessMsg}>(Permitido: _ e . no meio. Ex: usuario_123)</Text>
            </>
          )}

          <TextInput
            style={[
              styles.whiteModalInput,
              { backgroundColor: h.isDarkMode ? '#1E1E24' : '#F0F0F0', color: h.colors.textDark, borderColor: h.isDarkMode ? '#3E3E4A' : 'transparent' },
              h.usernameStatus === 'available' ? styles.inputSuccess : null,
              (h.usernameStatus === 'taken' || h.usernameStatus === 'invalid_format') ? styles.inputError : null
            ]}
            placeholder="Ex: usuario123"
            placeholderTextColor={h.isDarkMode ? '#8E8E93' : '#919191'}
            value={h.usernameInput}
            onChangeText={h.setUsernameInput}
            autoCapitalize="none"
          />

          {h.usernameStatus === 'available' && (
            <Text style={styles.usernameSuccessMsg}>Este nome de usuário está disponível</Text>
          )}

          {h.usernameStatus === 'taken' && (
            <View style={styles.suggestionsContainer}>
              <Text style={[styles.suggestionsTitle, { color: h.colors.textDark }]}>Sugestões disponíveis:</Text>
              {h.usernameSuggestions.map((sug: string) => (
                <TouchableOpacity key={sug} onPress={() => h.setUsernameInput(sug)} style={[styles.suggestionBadge, { backgroundColor: h.isDarkMode ? '#1E1E24' : '#E3E4EB' }]}>
                  <Text style={[styles.suggestionBadgeText, { color: h.colors.textDark }]}>{sug}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.whiteModalButtons}>
            <TouchableOpacity style={[styles.whiteModalBtnCancel, { backgroundColor: h.isDarkMode ? '#3E3E4A' : '#E3E4EB' }]} onPress={() => h.setShowUsernameModal(false)}>
              <Text style={[styles.whiteModalBtnTextCancel, { color: h.isDarkMode ? '#FF6B6B' : '#FF3B30' }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.whiteModalBtnConfirm, h.usernameStatus !== 'available' && { opacity: 0.5 }]}
              onPress={h.handleSaveUsername}
              disabled={h.usernameStatus !== 'available'}
            >
              <Text style={styles.whiteModalBtnTextConfirm}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
