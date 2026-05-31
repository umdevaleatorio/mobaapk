import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#F5F5F5' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 120 },
  filterRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 20, marginTop: -10,
    justifyContent: 'space-between', zIndex: 10,
  },
  filterBtn: { width: 170, height: 42, justifyContent: 'center' },
  filterBtnContent: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15,
  },
  emptyText: { fontSize: 14, color: '#000', textAlign: 'center', marginTop: 20 },
  orderCard: {
    flexDirection: 'row', backgroundColor: '#1C2434', borderRadius: 15, marginBottom: 15,
    height: 100, alignItems: 'center', paddingHorizontal: 8,
  },
  colContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  productImageContainer: {
    width: 70, height: 70, backgroundColor: '#FFFFFF', borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2,
    shadowRadius: 1.5, elevation: 2,
  },
  productImage: { width: 58, height: 58 },
  placeholderImg: { width: 58, height: 58, backgroundColor: '#E0E0E0', borderRadius: 8 },
  cardSeparator: { width: 1, height: 100, backgroundColor: '#F5F5F5' },
  headerTextWhite: {
    fontSize: 12, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center', marginBottom: 4, marginTop: -8,
  },
  valorText: { fontSize: 14, fontWeight: 'bold', color: '#339914', textAlign: 'center' },
  pgtoText: { fontSize: 13, fontWeight: 'bold', color: '#FFFFFF', textAlign: 'center' },
  verResumoBtn: { alignItems: 'center', justifyContent: 'center', padding: 4 },
  verResumoText: { fontSize: 13, fontWeight: 'bold', color: '#FFE082', textAlign: 'center' },
  tabBarOuter: {
    position: 'absolute', bottom: Platform.OS === 'ios' ? 34 : 24, left: 16, right: 16,
  },
  tabBarInner: {
    flexDirection: 'row', backgroundColor: '#E3E4EB', borderRadius: 30, height: 80,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  tabSeparator: { width: 1, height: 49, backgroundColor: '#8A7268' },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  iconBgInactive: {
    width: 51, height: 41, borderRadius: 20, alignItems: 'center',
    justifyContent: 'center', backgroundColor: 'transparent',
  },
  iconBgActive: {
    width: 51, height: 41, borderRadius: 20, backgroundColor: '#E3DAD9',
    alignItems: 'center', justifyContent: 'center',
  },
  summaryCard: {
    backgroundColor: '#FFFAFA', borderRadius: 15, padding: 16, marginBottom: 20, borderWidth: 1,
    borderColor: '#E3E4EB', shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  summaryTotalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#E3E4EB', paddingBottom: 10, marginBottom: 10,
  },
  summaryTotalLabel: { fontSize: 16, fontWeight: 'bold', color: '#000000' },
  summaryTotalValue: { fontSize: 16, fontWeight: 'bold', color: '#000000' },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5,
  },
  summaryLabelCredito: { fontSize: 13, fontWeight: 'bold', color: '#FF0000' },
  summaryLabelDebito: { fontSize: 13, fontWeight: 'bold', color: '#4CAF50' },
  summaryLabelDinheiro: { fontSize: 13, fontWeight: 'bold', color: '#1B5E20' },
  summaryLabelPix: { fontSize: 13, fontWeight: 'bold', color: '#00BFA5' },
  summaryValue: { fontSize: 13, fontWeight: 'bold', color: '#48B644' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center',
  },
  whiteModalContainer: {
    borderRadius: 20, padding: 24, width: '85%', alignSelf: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1,
    shadowRadius: 8, elevation: 5,
  },
  whiteModalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  whiteModalDesc: { fontSize: 14, textAlign: 'center', marginBottom: 20 },
  whiteModalBtnConfirm: { paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  whiteModalBtnTextConfirm: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
  whiteModalBtnCancel: { paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  whiteModalBtnTextCancel: { fontWeight: 'bold', fontSize: 15 },
  filterModeHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderBottomWidth: 1, marginBottom: 16,
  },
  filterModeTitle: { fontSize: 15, fontWeight: 'bold' },
  filterPeriodContainer: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 4 },
  rangeRowContainer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, width: '100%',
  },
  datePickRow: {
    flex: 1, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', borderWidth: 0.5, borderColor: '#E3E4EB',
  },
  datePickLabel: { fontSize: 10, color: '#767676', fontWeight: 'bold', marginBottom: 2 },
  datePickVal: { fontSize: 13, fontWeight: 'bold' },
});
