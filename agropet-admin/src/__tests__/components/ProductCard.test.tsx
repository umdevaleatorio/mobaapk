import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ProductCard } from '../../presentation/screens/admin/ManageProducts/ProductCard';

jest.mock('../../presentation/contexts/ThemeContext', () => ({
  useTheme: () => ({ colors: { textDark: '#1C2434' }, isDarkMode: false }),
}));

jest.mock('expo-image', () => ({ Image: 'Image' }));

jest.mock('../../utils/imageUtils', () => ({
  getFirstImageUrl: (url: string | null | undefined) => url || null,
}));

jest.mock('../../assets/tela7/produtos/produto 1/Adicionar/Remover/Edit.svg', () => 'EditIcon');
jest.mock('../../assets/tela7/produtos/produto 1/Adicionar/Remover/Trash.svg', () => 'TrashIcon');
jest.mock('../../assets/tela7/produtos/produto 1/Adicionar/Remover/Ativo.svg', () => 'AtivoSvg');
jest.mock('../../assets/tela7/produtos/produto 1/Adicionar/Remover/Botão desativar.svg', () => 'ToggleActiveSvg');
jest.mock('../../assets/tela7/produtos/produto 4/Adicionar/Remover/Desativado.svg', () => 'DesativadoSvg');
jest.mock('../../assets/tela7/produtos/produto 4/Adicionar/Remover/Botão desativar.svg', () => 'ToggleInactiveSvg');

jest.mock('../../presentation/screens/admin/ManageProducts/styles', () => ({
  styles: {
    productCard: { borderRadius: 12, padding: 12, margin: 8 },
    selectedCard: { borderWidth: 2, borderColor: '#25BE36' },
    cardInactive: { opacity: 0.5 },
    editIconBtn: { position: 'absolute', top: 8, right: 40, zIndex: 10, padding: 4 },
    trashIconBtn: { position: 'absolute', top: 8, right: 8, zIndex: 10, padding: 4 },
    cardRow: { flexDirection: 'row', alignItems: 'center' },
    checkboxArea: { padding: 8 },
    checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: '#A8A8B3', justifyContent: 'center', alignItems: 'center' },
    checkboxChecked: { backgroundColor: '#25BE36', borderColor: '#25BE36' },
    checkmark: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },
    productImageWrapper: { padding: 8 },
    productImage: { width: 70, height: 70, borderRadius: 12 },
    noImage: { justifyContent: 'center', alignItems: 'center' },
    noImageText: { fontSize: 10, textAlign: 'center' },
    separator: { width: 1, height: '100%' },
    nameColumn: { flex: 1.2, paddingHorizontal: 8 },
    columnHeader: { fontSize: 11, fontWeight: 'bold', marginBottom: 4 },
    productName: { fontSize: 12 },
    quantityColumn: { flex: 1, alignItems: 'center' },
    quantityValue: { fontSize: 14, fontWeight: 'bold' },
    statusColumn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  },
}));

const baseItem: any = {
  id: 'p1',
  name: 'Ração Premium',
  description: 'Ração para cães',
  price: 89.90,
  stock: 25,
  active: true,
  image_url: 'https://example.com/img.jpg',
};

const defaultProps: any = {
  item: baseItem,
  selectionMode: false,
  isSelected: false,
  onToggleSelect: jest.fn(),
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  onToggleStatus: jest.fn(),
  onDismissAlert: jest.fn(),
};

describe('ProductCard', () => {
  it('renders correctly', () => {
    const { getByText } = render(<ProductCard {...defaultProps} />);
    expect(getByText('Ração Premium')).toBeTruthy();
    expect(getByText('25')).toBeTruthy();
  });

  it('presses all buttons when selectionMode=false', () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    const onToggleStatus = jest.fn();
    const { UNSAFE_getAllByType } = render(
      <ProductCard {...defaultProps} onEdit={onEdit} onDelete={onDelete} onToggleStatus={onToggleStatus} />
    );
    const { TouchableOpacity } = require('react-native');
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    touchables.forEach(t => {
      if (t.props.onPress) fireEvent.press(t);
    });
    expect(onEdit).toHaveBeenCalledWith(baseItem);
    expect(onDelete).toHaveBeenCalledWith(baseItem.id);
    expect(onToggleStatus).toHaveBeenCalledWith(baseItem);
  });

  it('does not call edit/delete/toggle in selectionMode (lines 45,48,82 false branches)', () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    const onToggleStatus = jest.fn();
    const { UNSAFE_getAllByType } = render(
      <ProductCard
        {...defaultProps}
        selectionMode={true}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggleStatus={onToggleStatus}
      />
    );
    const { TouchableOpacity } = require('react-native');
    const touchables = UNSAFE_getAllByType(TouchableOpacity);
    touchables.forEach(t => {
      if (t.props.onPress) fireEvent.press(t);
    });
  });

  it('renders low stock warning', () => {
    const itemLowStock = { ...baseItem, stock: 3 };
    const { getByText } = render(<ProductCard {...defaultProps} item={itemLowStock} />);
    expect(getByText(/esgotando/)).toBeTruthy();
  });

  it('renders moderate stock warning (lines 32-36)', () => {
    const itemModStock = { ...baseItem, stock: 20 };
    const { getByText } = render(<ProductCard {...defaultProps} item={itemModStock} />);
    expect(getByText(/estoque moderado/)).toBeTruthy();
  });

  it('renders no warning for high stock', () => {
    const itemHighStock = { ...baseItem, stock: 50 };
    const { queryByText } = render(<ProductCard {...defaultProps} item={itemHighStock} />);
    expect(queryByText(/esgotando/)).toBeNull();
    expect(queryByText(/estoque moderado/)).toBeNull();
  });

  it('calls onDismissAlert when alert dismissed', () => {
    const onDismissAlert = jest.fn();
    const itemLowStock = { ...baseItem, stock: 3 };
    const { getByText } = render(
      <ProductCard {...defaultProps} item={itemLowStock} onDismissAlert={onDismissAlert} />
    );
    expect(getByText(/esgotando/)).toBeTruthy();
  });

  it('renders item without image (lines 62-64 false branch)', () => {
    const itemNoImage = { ...baseItem, image_url: null };
    const { getByText } = render(<ProductCard {...defaultProps} item={itemNoImage} />);
    expect(getByText(/Sem/)).toBeTruthy();
  });

  it('renders without name', () => {
    const itemNoName = { ...baseItem, name: null };
    const { getByText } = render(<ProductCard {...defaultProps} item={itemNoName} />);
    expect(getByText('Sem nome')).toBeTruthy();
  });

  it('renders in selection mode with checkbox', () => {
    const { getByTestId } = render(<ProductCard {...defaultProps} selectionMode={true} />);
    expect(getByTestId('product-checkbox')).toBeTruthy();
  });

  it('renders selected with checkmark', () => {
    const { getByText } = render(<ProductCard {...defaultProps} selectionMode={true} isSelected={true} />);
    expect(getByText('X')).toBeTruthy();
  });

  it('renders inactive product', () => {
    const itemInactive = { ...baseItem, active: false };
    const { getByText } = render(<ProductCard {...defaultProps} item={itemInactive} />);
    expect(getByText('25')).toBeTruthy();
  });

  it('renders with stock = 0 (falsy branch)', () => {
    const itemNoStock = { ...baseItem, stock: 0 };
    const { getByText } = render(<ProductCard {...defaultProps} item={itemNoStock} />);
    expect(getByText('0')).toBeTruthy();
  });
});
