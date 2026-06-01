import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import AdminAddressCard from '../../presentation/screens/admin/AdminProfile/components/AdminAddressCard';

jest.mock('../../presentation/screens/admin/AdminProfile/components/AdminAddressCard.styles', () => ({
  styles: {
    addressCard: { padding: 16, margin: 16, borderRadius: 16 },
    addressHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
    addressTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
    enviarBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
    enviarBtnConfirmed: { backgroundColor: '#25BE36' },
    enviarBtnActive: { backgroundColor: '#5B86E5' },
    enviarBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
    addressFieldGroup: { marginBottom: 16 },
    addressLabel: { color: '#FFF', fontSize: 14, marginBottom: 6 },
    addressInputBox: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, paddingHorizontal: 12, height: 44 },
    addressInputBoxError: { borderColor: '#FF3B30', borderWidth: 1 },
    addressInput: { flex: 1, fontSize: 14 },
    alterarLinkAddr: { fontSize: 13, fontWeight: '600' },
    addressErrorText: { color: '#FF3B30', fontSize: 12, marginTop: 4 },
    suggestionsDropdown: { maxHeight: 150, borderRadius: 8, marginTop: 4 },
    suggestionItem: { padding: 12, borderBottomWidth: 0.5, borderBottomColor: '#ccc' },
    suggestionText: { color: '#FFF', fontSize: 14 },
    row: { flexDirection: 'row' },
    obsText: {},
  },
}));

const defaultProps = {
  isDarkMode: false,
  locationConfirmed: false,
  handleSendAddress: jest.fn(),
  showAddressValidationErrors: false,
  firstEmptyField: null,
  rua: '',
  ruaRef: { current: null },
  setRua: jest.fn(),
  addressErrorOpacity: 1,
  addressSuggestions: [],
  handleSelectAddress: jest.fn(),
  bairro: '',
  bairroRef: { current: null },
  setBairro: jest.fn(),
  cep: '',
  cepRef: { current: null },
  setCep: jest.fn(),
  numero: '',
  numeroRef: { current: null },
  setNumero: jest.fn(),
};

describe('AdminAddressCard', () => {
  it('renders correctly', () => {
    const { getByText } = render(<AdminAddressCard {...defaultProps} />);
    expect(getByText('Endereço')).toBeTruthy();
    expect(getByText('Enviar')).toBeTruthy();
  });

  it('shows confirmed state', () => {
    const { getByText } = render(<AdminAddressCard {...defaultProps} locationConfirmed={true} />);
    expect(getByText('✓ Enviado')).toBeTruthy();
  });

  it('calls handleSendAddress when enviar pressed', () => {
    const handleSendAddress = jest.fn();
    const { getByText } = render(<AdminAddressCard {...defaultProps} handleSendAddress={handleSendAddress} />);
    fireEvent.press(getByText('Enviar'));
    expect(handleSendAddress).toHaveBeenCalled();
  });

  it('shows suggestions dropdown with isDarkMode=false (line 71 false branch)', () => {
    const { getByText } = render(
      <AdminAddressCard
        {...defaultProps}
        addressSuggestions={[{ display_name: 'Rua Teste, 123' }]}
      />
    );
    expect(getByText('Rua Teste, 123')).toBeTruthy();
  });

  it('shows suggestions dropdown with isDarkMode=true', () => {
    const { getByText } = render(
      <AdminAddressCard
        {...defaultProps}
        isDarkMode={true}
        addressSuggestions={[{ display_name: 'Rua Escura, 456' }]}
      />
    );
    expect(getByText('Rua Escura, 456')).toBeTruthy();
  });

  it('calls handleSelectAddress when suggestion pressed', () => {
    const handleSelectAddress = jest.fn();
    const { getByText } = render(
      <AdminAddressCard
        {...defaultProps}
        addressSuggestions={[{ display_name: 'Rua Teste, 123' }]}
        handleSelectAddress={handleSelectAddress}
      />
    );
    fireEvent.press(getByText('Rua Teste, 123'));
    expect(handleSelectAddress).toHaveBeenCalledWith({ display_name: 'Rua Teste, 123' });
  });

  it('shows validation error for rua (line 66)', () => {
    const { getByText } = render(
      <AdminAddressCard {...defaultProps} showAddressValidationErrors={true} firstEmptyField='rua' />
    );
    expect(getByText('Preencha todos os campos para continuar')).toBeTruthy();
  });

  it('shows validation error for bairro (line 107)', () => {
    const { getByText } = render(
      <AdminAddressCard {...defaultProps} showAddressValidationErrors={true} firstEmptyField='bairro' />
    );
    expect(getByText('Preencha todos os campos para continuar')).toBeTruthy();
  });

  it('shows validation error for cep (line 132)', () => {
    const { getByText } = render(
      <AdminAddressCard {...defaultProps} showAddressValidationErrors={true} firstEmptyField='cep' />
    );
    expect(getByText('Preencha todos os campos para continuar')).toBeTruthy();
  });

  it('shows validation error for numero (line 156)', () => {
    const { getByText } = render(
      <AdminAddressCard {...defaultProps} showAddressValidationErrors={true} firstEmptyField='numero' />
    );
    expect(getByText('Preencha todos os campos para continuar')).toBeTruthy();
  });

  it('calls setters when text changes', () => {
    const setRua = jest.fn();
    const { getByPlaceholderText } = render(
      <AdminAddressCard {...defaultProps} setRua={setRua} />
    );
    fireEvent.changeText(getByPlaceholderText('Digite sua rua...'), 'Nova Rua');
    expect(setRua).toHaveBeenCalledWith('Nova Rua');
  });

  it('renders in dark mode', () => {
    const { getByText } = render(<AdminAddressCard {...defaultProps} isDarkMode={true} />);
    expect(getByText('Endereço')).toBeTruthy();
  });
});
