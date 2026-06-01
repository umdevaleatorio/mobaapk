import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ProfileModal from '../../presentation/screens/admin/AdminProfile/components/ProfileModal';

jest.mock('expo-secure-store', () => ({
  deleteItemAsync: jest.fn(),
}));

jest.mock('../../presentation/screens/admin/AdminProfile/AdminProfileScreen.styles', () => ({
  styles: {
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    whiteModalContainer: { backgroundColor: '#FFF', padding: 20, borderRadius: 12 },
    whiteModalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
    whiteModalDesc: { fontSize: 14, marginBottom: 16 },
    whiteModalInput: { height: 44, borderRadius: 10, paddingHorizontal: 12, fontSize: 14, borderWidth: 1 },
    whiteModalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
    whiteModalBtnCancel: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
    whiteModalBtnConfirm: { backgroundColor: '#25BE36', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
    whiteModalBtnTextCancel: { fontSize: 15, fontWeight: 'bold' },
    whiteModalBtnTextConfirm: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
    inputSuccess: { borderColor: '#25BE36' },
    inputError: { borderColor: '#FF3B30' },
    usernameErrorMsg: { color: '#FF3B30', fontSize: 12 },
    usernameSuccessMsg: { color: '#25BE36', fontSize: 12 },
    suggestionsContainer: { marginTop: 12 },
    suggestionsTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
    suggestionBadge: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, marginBottom: 6, alignSelf: 'flex-start' },
    suggestionBadgeText: { fontSize: 14 },
    modalContainer: { backgroundColor: '#FFF', padding: 24, borderRadius: 16 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    modalOption: { paddingVertical: 14 },
    modalOptionText: { fontSize: 16, textAlign: 'center' },
    modalSeparator: { height: 1, backgroundColor: '#E3E4EB' },
    modalCancelText: { color: '#767676' },
    viewPhotoOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
    viewPhotoContainer: { width: '90%', alignItems: 'center' },
    closeViewPhotoBtn: { alignSelf: 'flex-end', padding: 8 },
    viewPhotoSquare: { width: 300, height: 300, borderRadius: 12, marginTop: 16 },
  },
}));

const defaultProps: any = {
  showUsernameModal: false,
  setShowUsernameModal: jest.fn(),
  usernameInput: '',
  setUsernameInput: jest.fn(),
  usernameStatus: '',
  usernameSuggestions: [],
  handleSaveUsername: jest.fn(),
  showPhoneModal: false,
  setShowPhoneModal: jest.fn(),
  phoneInput: '',
  setPhoneInput: jest.fn(),
  phoneStatus: '',
  handleConfirmPhone: jest.fn(),
  showEmailModal: false,
  setShowEmailModal: jest.fn(),
  emailInput: '',
  setEmailInput: jest.fn(),
  emailStatus: '',
  emailError: '',
  emailCode: '',
  setEmailCode: jest.fn(),
  handleConfirmEmail: jest.fn(),
  showImagePickerOptions: false,
  setShowImagePickerOptions: jest.fn(),
  photoUri: null,
  setPhotoUri: jest.fn(),
  openCamera: jest.fn(),
  openGallery: jest.fn(),
  showViewPhotoModal: false,
  setShowViewPhotoModal: jest.fn(),
  user: { id: 'user12345abcde' },
  isDarkMode: false,
  colors: { textDark: '#1C2434' },
};

describe('ProfileModal', () => {
  describe('Username Modal', () => {
    it('renders username modal when visible', () => {
      const { getByText } = render(<ProfileModal {...defaultProps} showUsernameModal={true} />);
      expect(getByText('Escolha seu nome de usuário')).toBeTruthy();
    });

    it('shows taken error and suggestions', async () => {
      const { findByText, getByText } = render(
        <ProfileModal {...defaultProps} showUsernameModal={true} usernameStatus='taken' usernameSuggestions={['user1', 'user2']} />
      );
      expect(await findByText(/já está sendo usado/)).toBeTruthy();
      expect(getByText('user1')).toBeTruthy();
    });

    it('calls setUsernameInput when suggestion pressed', () => {
      const setUsernameInput = jest.fn();
      const { getByText } = render(
        <ProfileModal {...defaultProps} showUsernameModal={true} usernameStatus='taken' usernameSuggestions={['user1']} setUsernameInput={setUsernameInput} />
      );
      fireEvent.press(getByText('user1'));
      expect(setUsernameInput).toHaveBeenCalledWith('user1');
    });

    it('shows invalid format error', () => {
      const { getByText } = render(
        <ProfileModal {...defaultProps} showUsernameModal={true} usernameStatus='invalid_format' />
      );
      expect(getByText(/Caracteres especiais/)).toBeTruthy();
    });

    it('shows available message and enables confirm', () => {
      const { getByText } = render(
        <ProfileModal {...defaultProps} showUsernameModal={true} usernameStatus='available' />
      );
      expect(getByText('Este nome de usuário está disponível')).toBeTruthy();
    });

    it('calls handleSaveUsername when confirm pressed', () => {
      const handleSaveUsername = jest.fn();
      const { getByText } = render(
        <ProfileModal {...defaultProps} showUsernameModal={true} usernameStatus='available' handleSaveUsername={handleSaveUsername} />
      );
      fireEvent.press(getByText('Confirmar'));
      expect(handleSaveUsername).toHaveBeenCalled();
    });

    it('calls setShowUsernameModal on cancel', () => {
      const setShowUsernameModal = jest.fn();
      const { getByText } = render(
        <ProfileModal {...defaultProps} showUsernameModal={true} setShowUsernameModal={setShowUsernameModal} />
      );
      fireEvent.press(getByText('Cancelar'));
      expect(setShowUsernameModal).toHaveBeenCalledWith(false);
    });
  });

  describe('Phone Modal', () => {
    it('renders phone modal', () => {
      const { getByText } = render(<ProfileModal {...defaultProps} showPhoneModal={true} />);
      expect(getByText('Digite seu telefone')).toBeTruthy();
    });

    it('renders phone validation modal', () => {
      const { getByText } = render(<ProfileModal {...defaultProps} showPhoneModal={true} phoneStatus='validar' />);
      expect(getByText('Validar Telefone')).toBeTruthy();
      expect(getByText(/código SMS/)).toBeTruthy();
    });

    it('calls handleConfirmPhone', () => {
      const handleConfirmPhone = jest.fn();
      const { getByText } = render(
        <ProfileModal {...defaultProps} showPhoneModal={true} handleConfirmPhone={handleConfirmPhone} />
      );
      fireEvent.press(getByText('Confirmar'));
      expect(handleConfirmPhone).toHaveBeenCalled();
    });
  });

  describe('Email Modal', () => {
    it('renders email modal', () => {
      const { getByText } = render(<ProfileModal {...defaultProps} showEmailModal={true} />);
      expect(getByText('Alterar E-mail')).toBeTruthy();
    });

    it('renders email validation modal (lines 171-173)', () => {
      const { getByText, getByPlaceholderText } = render(
        <ProfileModal {...defaultProps} showEmailModal={true} emailStatus='validar' />
      );
      expect(getByText('Validar E-mail')).toBeTruthy();
      expect(getByPlaceholderText('Código de 6 dígitos...')).toBeTruthy();
    });

    it('shows email error', () => {
      const { getByText } = render(
        <ProfileModal {...defaultProps} showEmailModal={true} emailError='Email inválido' />
      );
      expect(getByText('Email inválido')).toBeTruthy();
    });
  });

  describe('Image Picker Options', () => {
    it('shows image picker options', () => {
      const { getByText } = render(<ProfileModal {...defaultProps} showImagePickerOptions={true} />);
      expect(getByText('Alterar Foto de Perfil')).toBeTruthy();
      expect(getByText('Tirar Foto')).toBeTruthy();
      expect(getByText('Escolher da Galeria')).toBeTruthy();
    });

    it('shows view photo option when photoUri exists', () => {
      const { getByText } = render(
        <ProfileModal {...defaultProps} showImagePickerOptions={true} photoUri='file://photo.jpg' />
      );
      expect(getByText('Ver foto')).toBeTruthy();
    });

    it('opens camera', () => {
      const openCamera = jest.fn();
      const { getByText } = render(
        <ProfileModal {...defaultProps} showImagePickerOptions={true} openCamera={openCamera} />
      );
      fireEvent.press(getByText('Tirar Foto'));
      expect(openCamera).toHaveBeenCalled();
    });

    it('opens gallery', () => {
      const openGallery = jest.fn();
      const { getByText } = render(
        <ProfileModal {...defaultProps} showImagePickerOptions={true} openGallery={openGallery} />
      );
      fireEvent.press(getByText('Escolher da Galeria'));
      expect(openGallery).toHaveBeenCalled();
    });

    it('shows remove photo when photoUri exists', () => {
      const { getByText } = render(
        <ProfileModal {...defaultProps} showImagePickerOptions={true} photoUri='file://photo.jpg' user={{ id: 'user123' }} />
      );
      expect(getByText('Remover Foto')).toBeTruthy();
    });

    it('removes photo with user object (line 231 with user)', async () => {
      const setPhotoUri = jest.fn();
      const setShowImagePickerOptions = jest.fn();
      const { findByText } = render(
        <ProfileModal
          {...defaultProps}
          showImagePickerOptions={true}
          photoUri='file://photo.jpg'
          user={{ id: 'abc123xyz789' }}
          setPhotoUri={setPhotoUri}
          setShowImagePickerOptions={setShowImagePickerOptions}
        />
      );
      const removeBtn = await findByText('Remover Foto');
      fireEvent.press(removeBtn);
      const { deleteItemAsync } = require('expo-secure-store');
      expect(deleteItemAsync).toHaveBeenCalledWith('av_abc123xy');
      expect(setPhotoUri).toHaveBeenCalledWith(null);
      await new Promise(r => setTimeout(r, 50));
      expect(setShowImagePickerOptions).toHaveBeenCalledWith(false);
    });

    it('removes photo without user (line 231 falsy user branch)', async () => {
      const { getByText } = render(
        <ProfileModal
          {...defaultProps}
          showImagePickerOptions={true}
          photoUri='file://photo.jpg'
          user={null}
        />
      );
      fireEvent.press(getByText('Remover Foto'));
      const { deleteItemAsync } = require('expo-secure-store');
      expect(deleteItemAsync).toHaveBeenCalledWith('av_guest');
    });

    it('dismisses image picker overlay', () => {
      const setShowImagePickerOptions = jest.fn();
      const { getByText } = render(
        <ProfileModal {...defaultProps} showImagePickerOptions={true} setShowImagePickerOptions={setShowImagePickerOptions} />
      );
      fireEvent.press(getByText('Cancelar'));
      expect(setShowImagePickerOptions).toHaveBeenCalledWith(false);
    });
  });

  describe('View Photo Modal', () => {
    it('shows view photo modal when visible', () => {
      const { UNSAFE_getAllByType } = render(
        <ProfileModal {...defaultProps} showViewPhotoModal={true} photoUri='file://photo.jpg' />
      );
      const { Image } = require('react-native');
      const images = UNSAFE_getAllByType(Image);
      expect(images.length).toBeGreaterThan(0);
    });
  });
});
