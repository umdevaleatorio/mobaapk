import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingBottom: 130,
    paddingHorizontal: 16,
    paddingTop: 16,
    flexGrow: 1,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  photoContainer: {
    alignItems: 'center',
    marginRight: 15,
  },
  photoPlaceholder: {
    width: 110,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  personIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alterarFotoText: {
    fontSize: 16,
    color: '#042A7D',
    fontWeight: 'bold',
  },
  topFields: {
    flex: 1,
    gap: 10,
  },
  fieldGroup: {
    gap: 5,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1C2434',
  },
  textInputBox: {
    backgroundColor: '#E3E4EB',
    borderRadius: 10,
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  input: {
    fontSize: 14,
    color: '#1C2434',
  },
  infoRow: {
    marginBottom: 15,
  },
  infoBox: {
    backgroundColor: '#E3E4EB',
    borderRadius: 10,
    height: 45,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginTop: 5,
  },
  infoText: {
    fontSize: 14,
    color: '#767676',
  },
  alterarLink: {
    fontSize: 14,
    color: '#042A7D',
    fontWeight: 'bold',
  },

  profilePhoto: {
    width: 110,
    height: 110,
    borderRadius: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#EAEAEA',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalOption: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#D4D4D4',
    fontWeight: '500',
  },
  modalCancelText: {
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  modalSeparator: {
    height: 1,
    backgroundColor: '#333333',
    width: '100%',
  },

  whiteModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    alignSelf: 'center',
    marginBottom: 'auto',
    marginTop: 'auto',
  },
  whiteModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C2434',
    marginBottom: 8,
    textAlign: 'center',
  },
  whiteModalDesc: {
    fontSize: 14,
    color: '#767676',
    textAlign: 'center',
    marginBottom: 16,
  },
  whiteModalInput: {
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 45,
    fontSize: 16,
    color: '#1C2434',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputSuccess: {
    borderColor: '#00C853',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  usernameSuccessMsg: {
    color: '#00C853',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  usernameErrorMsg: {
    color: '#FF3B30',
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  suggestionsContainer: {
    marginTop: 10,
  },
  suggestionsTitle: {
    fontSize: 13,
    color: '#767676',
    marginBottom: 6,
  },
  suggestionBadge: {
    backgroundColor: '#E3E4EB',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  suggestionBadgeText: {
    color: '#1C2434',
    fontSize: 14,
    fontWeight: '500',
  },
  whiteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 10,
  },
  whiteModalBtnCancel: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  whiteModalBtnTextCancel: {
    color: '#FF3B30',
    fontWeight: 'bold',
    fontSize: 15,
  },
  whiteModalBtnConfirm: {
    flex: 1,
    backgroundColor: '#042A7D',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  whiteModalBtnTextConfirm: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  viewPhotoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewPhotoContainer: {
    width: '80%',
    aspectRatio: 1,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  viewPhotoSquare: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  closeViewPhotoBtn: {
    position: 'absolute',
    top: -45,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
});
