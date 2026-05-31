import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  addressCard: {
    borderRadius: 20,
    padding: 16,
    marginTop: 10,
  },
  addressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  addressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  enviarBtn: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enviarBtnActive: {
    backgroundColor: '#25BE36',
  },
  enviarBtnConfirmed: {
    backgroundColor: '#25BE36',
  },
  enviarBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  addressFieldGroup: {
    marginBottom: 12,
  },
  addressLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    marginBottom: 5,
  },
  addressInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  addressInputBoxError: {
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  addressInput: {
    flex: 1,
    fontSize: 13,
  },
  alterarLinkAddr: {
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  addressErrorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 5,
    fontWeight: 'bold',
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    maxHeight: 150,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    zIndex: 999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  suggestionText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  obsText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 5,
    lineHeight: 24,
  },
});
