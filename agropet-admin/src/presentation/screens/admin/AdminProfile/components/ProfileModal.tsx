import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Image,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Feather } from '@expo/vector-icons';
import { styles } from '../AdminProfileScreen.styles';

interface Props {
  showUsernameModal: boolean;
  setShowUsernameModal: (v: boolean) => void;
  usernameInput: string;
  setUsernameInput: (v: string) => void;
  usernameStatus: string;
  usernameSuggestions: string[];
  handleSaveUsername: () => void;
  showPhoneModal: boolean;
  setShowPhoneModal: (v: boolean) => void;
  phoneInput: string;
  setPhoneInput: (v: string) => void;
  phoneStatus: string;
  handleConfirmPhone: () => void;
  showEmailModal: boolean;
  setShowEmailModal: (v: boolean) => void;
  emailInput: string;
  setEmailInput: (v: string) => void;
  emailStatus: string;
  emailError: string;
  emailCode: string;
  setEmailCode: (v: string) => void;
  handleConfirmEmail: () => void;
  showImagePickerOptions: boolean;
  setShowImagePickerOptions: (v: boolean) => void;
  photoUri: string | null;
  setPhotoUri: (v: string | null) => void;
  openCamera: () => void;
  openGallery: () => void;
  showViewPhotoModal: boolean;
  setShowViewPhotoModal: (v: boolean) => void;
  user: any;
  isDarkMode: boolean;
  colors: any;
}

export default function ProfileModal({
  showUsernameModal, setShowUsernameModal, usernameInput, setUsernameInput, usernameStatus, usernameSuggestions, handleSaveUsername,
  showPhoneModal, setShowPhoneModal, phoneInput, setPhoneInput, phoneStatus, handleConfirmPhone,
  showEmailModal, setShowEmailModal, emailInput, setEmailInput, emailStatus, emailError, emailCode, setEmailCode, handleConfirmEmail,
  showImagePickerOptions, setShowImagePickerOptions, photoUri, setPhotoUri, openCamera, openGallery,
  showViewPhotoModal, setShowViewPhotoModal, user, isDarkMode, colors,
}: Props) {
  return (
    <>
      <Modal visible={showUsernameModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.whiteModalContainer, { backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF' }]}>
            <Text style={[styles.whiteModalTitle, { color: colors.textDark }]}>Escolha seu nome de usuário</Text>
            <Text style={[styles.whiteModalDesc, { color: isDarkMode ? '#A8A8B3' : '#767676' }]}>Lembre-se: não será possível alterar depois.</Text>

            {usernameStatus === 'taken' && (
              <Text style={styles.usernameErrorMsg}>Este nome de usuário já está sendo usado, por favor, escolha outro</Text>
            )}
            {usernameStatus === 'invalid_format' && (
              <>
                <Text style={styles.usernameErrorMsg}>Caracteres especiais não são permitidos: !@#$%¨&*()</Text>
                <Text style={styles.usernameSuccessMsg}>(Permitido: _ e . no meio. Ex: usuario_123)</Text>
              </>
            )}

            <TextInput
              style={[
                styles.whiteModalInput,
                { backgroundColor: isDarkMode ? '#1E1E24' : '#F0F0F0', color: colors.textDark, borderColor: isDarkMode ? '#3E3E4A' : 'transparent' },
                usernameStatus === 'available' ? styles.inputSuccess : null,
                (usernameStatus === 'taken' || usernameStatus === 'invalid_format') ? styles.inputError : null
              ]}
              placeholder="Ex: usuario123"
              placeholderTextColor={isDarkMode ? '#8E8E93' : '#919191'}
              value={usernameInput}
              onChangeText={setUsernameInput}
              autoCapitalize="none"
            />

            {usernameStatus === 'available' && (
              <Text style={styles.usernameSuccessMsg}>Este nome de usuário está disponível</Text>
            )}

            {usernameStatus === 'taken' && (
              <View style={styles.suggestionsContainer}>
                <Text style={[styles.suggestionsTitle, { color: colors.textDark }]}>Sugestões disponíveis:</Text>
                {usernameSuggestions.map(sug => (
                  <TouchableOpacity key={sug} onPress={() => setUsernameInput(sug)} style={[styles.suggestionBadge, { backgroundColor: isDarkMode ? '#1E1E24' : '#E3E4EB' }]}>
                    <Text style={[styles.suggestionBadgeText, { color: colors.textDark }]}>{sug}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={styles.whiteModalButtons}>
              <TouchableOpacity style={[styles.whiteModalBtnCancel, { backgroundColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]} onPress={() => setShowUsernameModal(false)}>
                <Text style={[styles.whiteModalBtnTextCancel, { color: isDarkMode ? '#FFFFFF' : '#767676' }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.whiteModalBtnConfirm, usernameStatus !== 'available' && { opacity: 0.5 }]}
                onPress={handleSaveUsername}
                disabled={usernameStatus !== 'available'}
              >
                <Text style={styles.whiteModalBtnTextConfirm}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showPhoneModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.whiteModalContainer, { backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF' }]}>
            <Text style={[styles.whiteModalTitle, { color: colors.textDark }]}>
              {phoneStatus === 'validar' ? 'Validar Telefone' : 'Digite seu telefone'}
            </Text>
            <Text style={[styles.whiteModalDesc, { color: isDarkMode ? '#A8A8B3' : '#767676' }]}>
              {phoneStatus === 'validar'
                ? 'Enviamos um código SMS para o seu número. (Simulação: clique em Confirmar para validar)'
                : 'Insira o número com DDD para continuar.'}
            </Text>

            <TextInput
              style={[styles.whiteModalInput, { backgroundColor: isDarkMode ? '#1E1E24' : '#F0F0F0', color: colors.textDark, borderColor: isDarkMode ? '#3E3E4A' : 'transparent' }]}
              placeholder={phoneStatus === 'validar' ? 'Código SMS...' : '+55 (11) 99999-9999'}
              placeholderTextColor={isDarkMode ? '#8E8E93' : '#919191'}
              value={phoneInput}
              onChangeText={setPhoneInput}
              keyboardType="phone-pad"
            />

            <View style={styles.whiteModalButtons}>
              <TouchableOpacity style={[styles.whiteModalBtnCancel, { backgroundColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]} onPress={() => setShowPhoneModal(false)}>
                <Text style={[styles.whiteModalBtnTextCancel, { color: isDarkMode ? '#FFFFFF' : '#767676' }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.whiteModalBtnConfirm} onPress={handleConfirmPhone}>
                <Text style={styles.whiteModalBtnTextConfirm}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showEmailModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.whiteModalContainer, { backgroundColor: isDarkMode ? '#2E2E38' : '#FFFFFF' }]}>
            <Text style={[styles.whiteModalTitle, { color: colors.textDark }]}>
              {emailStatus === 'validar' ? 'Validar E-mail' : 'Alterar E-mail'}
            </Text>
            <Text style={[styles.whiteModalDesc, { color: isDarkMode ? '#A8A8B3' : '#767676' }]}>
              {emailStatus === 'validar'
                ? 'Verifique a caixa de entrada do seu novo e-mail. (Simulação: clique em Confirmar)'
                : 'Insira o novo endereço de e-mail.'}
            </Text>

            {!!emailError && (
              <Text style={styles.usernameErrorMsg}>{emailError}</Text>
            )}

            {emailStatus === 'validar' ? (
              <TextInput
                style={[styles.whiteModalInput, { backgroundColor: isDarkMode ? '#1E1E24' : '#F0F0F0', color: colors.textDark, borderColor: isDarkMode ? '#3E3E4A' : 'transparent' }, emailError ? styles.inputError : null]}
                placeholder="Código de 6 dígitos..."
                placeholderTextColor={isDarkMode ? '#8E8E93' : '#919191'}
                value={emailCode}
                onChangeText={setEmailCode}
                keyboardType="numeric"
              />
            ) : (
              <TextInput
                style={[styles.whiteModalInput, { backgroundColor: isDarkMode ? '#1E1E24' : '#F0F0F0', color: colors.textDark, borderColor: isDarkMode ? '#3E3E4A' : 'transparent' }, emailError ? styles.inputError : null]}
                placeholder="novo@email.com"
                placeholderTextColor={isDarkMode ? '#8E8E93' : '#919191'}
                value={emailInput}
                onChangeText={setEmailInput}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            )}

            <View style={styles.whiteModalButtons}>
              <TouchableOpacity style={[styles.whiteModalBtnCancel, { backgroundColor: isDarkMode ? '#3E3E4A' : '#E3E4EB' }]} onPress={() => setShowEmailModal(false)}>
                <Text style={[styles.whiteModalBtnTextCancel, { color: isDarkMode ? '#FFFFFF' : '#767676' }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.whiteModalBtnConfirm} onPress={handleConfirmEmail}>
                <Text style={styles.whiteModalBtnTextConfirm}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showImagePickerOptions} transparent animationType="fade" onRequestClose={() => setShowImagePickerOptions(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowImagePickerOptions(false)}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Alterar Foto de Perfil</Text>

            {photoUri && (
              <>
                <TouchableOpacity style={styles.modalOption} onPress={() => { setShowImagePickerOptions(false); setShowViewPhotoModal(true); }}>
                  <Text style={styles.modalOptionText}>Ver foto</Text>
                </TouchableOpacity>
                <View style={styles.modalSeparator} />
              </>
            )}

            <TouchableOpacity style={styles.modalOption} onPress={openCamera}>
              <Text style={styles.modalOptionText}>Tirar Foto</Text>
            </TouchableOpacity>

            <View style={styles.modalSeparator} />

            <TouchableOpacity style={styles.modalOption} onPress={openGallery}>
              <Text style={styles.modalOptionText}>Escolher da Galeria</Text>
            </TouchableOpacity>

            {photoUri && (
              <>
                <View style={styles.modalSeparator} />
                <TouchableOpacity style={styles.modalOption} onPress={async () => {
                  setPhotoUri(null);
                  try { await SecureStore.deleteItemAsync(user ? `av_${user.id.slice(0, 8)}` : 'av_guest'); } catch (e) { }
                  setShowImagePickerOptions(false);
                }}>
                  <Text style={[styles.modalOptionText, { color: '#FF6B6B' }]}>Remover Foto</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.modalSeparator} />

            <TouchableOpacity style={[styles.modalOption, { marginTop: 10 }]} onPress={() => setShowImagePickerOptions(false)}>
              <Text style={[styles.modalOptionText, styles.modalCancelText]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showViewPhotoModal} transparent animationType="fade" onRequestClose={() => setShowViewPhotoModal(false)}>
        <TouchableOpacity style={styles.viewPhotoOverlay} activeOpacity={1} onPress={() => setShowViewPhotoModal(false)}>
          <View style={styles.viewPhotoContainer}>
            <TouchableOpacity style={styles.closeViewPhotoBtn} onPress={() => setShowViewPhotoModal(false)}>
              <Feather name="x" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            {photoUri && (
              <Image source={{ uri: photoUri }} style={styles.viewPhotoSquare} resizeMode="cover" />
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
