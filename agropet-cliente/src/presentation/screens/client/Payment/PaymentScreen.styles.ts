import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },
  sectionHeader: {
    marginBottom: 10,
    marginLeft: 4,
  },
  resumoCard: {
    backgroundColor: '#1C2434',
    borderRadius: 20,
    overflow: 'hidden',
  },
  tRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
  },
  tColDivider: {
    width: 1.5,
    backgroundColor: '#F5F5F5',
    alignSelf: 'stretch',
  },
  tColProduto: {
    flex: 1.3,
    paddingHorizontal: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tColQty: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tColPreco: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    color: '#FFFFFF',
    fontSize: 13,
    textAlign: 'center',
  },
  itemTextGrande: {
    color: '#FFFFFF',
    fontSize: 18,
  },
  itemTotal: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
  paymentCard: {
    backgroundColor: '#E3E4EB',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  dropdownBox: {
    width: 250,
    height: 45,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  instructionBox: {
    marginTop: 20,
    marginBottom: 20,
  },
  dropdownList: {
    width: 250,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginTop: 5,
    paddingVertical: 5,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  fazerPedidoBtn: {
    width: 238,
    height: 67,
    backgroundColor: '#339914',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
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
  iconBg: {
    width: 51,
    height: 41,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBgActive: {
    backgroundColor: '#E3DAD9',
  },
});
