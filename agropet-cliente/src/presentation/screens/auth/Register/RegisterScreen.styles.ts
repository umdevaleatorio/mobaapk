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
  entrePorAquiBtn: {
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
  formCard: {
    backgroundColor: Colors.primaryDark,
    borderRadius: 25,
    paddingVertical: 18,
    paddingHorizontal: 28,
    width: SCREEN_WIDTH * 0.86,
    marginTop: -15,
    gap: 4,
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
  criarContaButton: {
    backgroundColor: Colors.secondary,
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
});
