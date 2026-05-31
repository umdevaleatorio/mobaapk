import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  caixaCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  caixaTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caixaTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#A8A8B3',
    marginBottom: 4,
  },
  caixaValue: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  pulseContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    zIndex: 2,
  },
  pulseRing: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2.5,
    opacity: 0.45,
  },
  caixaDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 14,
  },
  caixaSubGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  caixaSubItem: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  caixaSubLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A8A8B3',
    flex: 1,
  },
  caixaSubValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
