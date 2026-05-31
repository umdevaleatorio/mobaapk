import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingBottom: 112,
  },

  // ========== OUTER BACKGROUND ==========
  outerCard: {
    backgroundColor: '#E3E4EB',
    borderRadius: 25,
    padding: 20,
    paddingBottom: 30,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 60,
  },

  // ========== DARK CARD ==========
  darkCard: {
    backgroundColor: '#1C2434',
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingTop: 30,
    paddingBottom: 40,
    gap: 25,
  },

  // Input sections
  fieldSection: {},

  // Input field container
  fieldInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C0CADE',
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 12,
    marginTop: 6,
    gap: 8,
  },
  fieldValue: {
    flex: 1,
    fontSize: 14,
    color: '#1C2434',
  },
  alterarBtnInside: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },

  // Toggle Row
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 10,
  },
  toggleSpacer: {
    flex: 1,
  },
  toggleSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
    marginLeft: 43,
    marginTop: -2,
    marginBottom: 8,
  },

  // ===== CUSTOM SWITCH AND ANIMATED ELEMENTS =====
  switchTrack: {
    width: 54,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: 3,
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  iconBoxAnim: {
    width: 29,
    height: 29,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronButton: {
    width: 44,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ===== WHITE MODALS (Identical layout to Client's Settings) =====
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
  },
  modalOverlayNested: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    zIndex: 999,
  },
  whiteModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    alignSelf: 'center',
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
  whiteModalInputWrapper: {
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 45,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  whiteModalInputFlex: {
    flex: 1,
    fontSize: 16,
    color: '#1C2434',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  usernameErrorMsg: {
    color: '#FF3B30',
    fontSize: 12,
    marginBottom: 8,
    textAlign: 'center',
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
});
