import { StyleSheet, Dimensions, Platform, StatusBar } from 'react-native';
import Colors from '../../../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 44,
    paddingBottom: 12,
    backgroundColor: Colors.white,
  },
  miniLogoWrapper: {
    width: 36,
    height: 36,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  comeceAquiBtn: {
    marginLeft: 4,
  },
  middleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 5,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  bemVindoWrapper: {
    alignItems: 'center',
    marginTop: -25,
    marginBottom: 15,
  },
  formCard: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 25,
    paddingVertical: 18,
    paddingHorizontal: 28,
    width: SCREEN_WIDTH * 0.86,
    gap: 6,
  },
  fieldGroup: {
    marginBottom: 2,
  },
  labelWrapper: {
    marginBottom: 4,
    marginLeft: 4,
  },
  textInput: {
    backgroundColor: Colors.white,
    borderRadius: 15,
    height: 38,
    paddingHorizontal: 16,
    fontSize: 14,
    color: Colors.textDark,
  },
  entrarButton: {
    backgroundColor: Colors.white,
    borderRadius: 30,
    width: 206,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  footerContainer: {
    backgroundColor: Colors.primaryDark,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  footerItem: {
    paddingHorizontal: 4,
  },
  separator: {
    width: 1,
    height: 29,
    backgroundColor: Colors.white,
    borderRadius: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
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
