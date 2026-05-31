import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 120,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#E3E4EB',
    borderRadius: 15,
    minHeight: 85,
    marginRight: 15,
  },
  iconBox: {
    width: 75,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1.5,
    borderColor: '#FFFFFF',
    paddingVertical: 15,
  },
  middleBox: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 15,
    borderRightWidth: 1.5,
    borderColor: '#FFFFFF',
    paddingVertical: 15,
  },
  subTaskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingRight: 10,
    alignItems: 'center',
  },
  subTaskIcons: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginLeft: 5,
  },
  rightTimeBox: {
    width: 75,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  outerStatus: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separatorWrapper: {
    width: '100%',
    alignItems: 'center',
    paddingRight: 40,
    marginBottom: 5,
  },
  thermometerStick: {
    width: 3,
  },
  thermometerSquare: {
    width: 6,
    height: 6,
  },
  tabBarOuter: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 24,
    left: 16,
    right: 16,
  },
  tabBarInner: {
    flexDirection: 'row',
    backgroundColor: '#E3E4EB',
    borderRadius: 30,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  tabSeparator: {
    width: 1,
    height: 49,
    backgroundColor: '#8A7268',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  iconBgInactive: {
    width: 51,
    height: 41,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});
