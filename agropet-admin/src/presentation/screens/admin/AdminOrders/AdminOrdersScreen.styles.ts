import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: 120,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 20,
    marginLeft: 4,
  },
  emptyText: {
    fontSize: 14,
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  cancelledSectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 4,
    marginBottom: 8,
  },
  columnLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  orderCard: {
    flexDirection: 'row',
    borderRadius: 15,
    marginBottom: 15,
    height: 100,
    alignItems: 'center',
  },
  colContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  valText: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pgtoText: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  verProdutosBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },

});
